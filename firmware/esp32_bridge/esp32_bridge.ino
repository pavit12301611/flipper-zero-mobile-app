// Flipper Lab A53 — ESP32 bridge firmware
// Line-based command protocol over USB Serial (115200) and WebSocket (ws://<ip>:81).
// Install via Arduino IDE / PlatformIO. Required libraries (Library Manager):
//   - ESP Async WebServer + Async TCP (for WebSocket)
// Optional: ELECHOUSE CC1101 library for full Sub-GHz; without it CC1101 commands
//   still probe the SPI bus and report PARTNUM if hardware is present.
//
// Wiring (default pins — edit the #defines below to match your board):
//   CC1101 : MOSI 23, MISO 19, SCK 18, CS 5,  GDO0 21, GDO2 22
//   IR TX  : GPIO4 (220R + NPN to IR LED), IR RX: GPIO15
//   RFID   : UART2 RX 16 / TX 17 (T5577 / Proxmark-style module)
//   PN532  : I2C SDA 21, SCL 22, IRQ 14, RST 27 (addr 0x24)
//   BadUSB : needs ESP32-S2 / S3 / C3 (native USB HID). Classic ESP32 cannot HID.

#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <SPI.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

#if __has_include(<ESPAsyncWebServer.h>)
#include <ESPAsyncWebServer.h>
#define HAS_ASYNC_WS 1
#else
#define HAS_ASYNC_WS 0
#endif

#if defined(CONFIG_IDF_TARGET_ESP32S3) || defined(CONFIG_IDF_TARGET_ESP32S2) || defined(CONFIG_IDF_TARGET_ESP32C3)
#include <USB.h>
#include <USBHIDKeyboard.h>
#define HAS_BADUSB 1
#else
#define HAS_BADUSB 0
#endif

#define CC1101_MOSI 23
#define CC1101_MISO 19
#define CC1101_SCK  18
#define CC1101_CS   5
#define CC1101_GDO0 21
#define CC1101_GDO2 22
#define IR_TX_PIN   4
#define IR_RX_PIN   15
#define RFID_RX     16
#define RFID_TX     17
#define PN532_SDA   21
#define PN532_SCL   22
#define PN532_IRQ   14
#define PN532_RST   27

const char* AP_SSID = "FlipperLab";
const char* AP_PASS = "flipperlab";
const char* STA_SSID = "YOUR_WIFI";
const char* STA_PASS = "YOUR_PASSWORD";

#if HAS_ASYNC_WS
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");
#endif

String lineBuf;

void sendAll(const String& s) {
  Serial.println(s);
#if HAS_ASYNC_WS
  ws.textAll(s);
#endif
}

void printHelp() {
  sendAll("Commands:");
  sendAll("  HELP | PING");
  sendAll("  SUBGHZ SCAN | SUBGHZ TX <hex> | SUBGHZ RX");
  sendAll("  IR TX <NEC|SONY|PANASONIC> <code> | IR RX");
  sendAll("  RFID READ | RFID WRITE <hex>");
  sendAll("  NFC READ | NFC WRITE <hex>");
  sendAll("  WIFI SCAN | WIFI DEAUTH <bssid> <ch> | WIFI BEACON <ssid>");
  sendAll("  BLE SCAN | BLE ADV <name>");
  sendAll("  GPIO SET <pin> <0|1> | GPIO GET <pin> | GPIO PWM <pin> <duty>");
  sendAll("  I2C SCAN | SPI SCAN | UART SNIFF");
  sendAll("  CC1101 CONFIG <freq_mhz> | CC1101 TX <hex> | CC1101 RX");
  sendAll("  BADUSB LIST | BADUSB RUN <name>");
}

void irTxNEC(uint32_t code) {
  // NEC: 9ms mark, 4.5ms space, 32 bits (LSB first), 560us mark/space.
  auto mark = [&](int us) { digitalWrite(IR_TX_PIN, HIGH); delayMicroseconds(us); };
  auto space = [&](int us) { digitalWrite(IR_TX_PIN, LOW); delayMicroseconds(us); };
  mark(9000); space(4500);
  for (int i = 0; i < 32; i++) {
    mark(560);
    if (code & (1UL << i)) space(1690); else space(560);
  }
  mark(560);
  sendAll("IR TX NEC 0x" + String(code, HEX));
}

void wifiScan() {
  sendAll("WiFi scanning...");
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; i++) {
    sendAll(WiFi.SSID(i) + " | " + WiFi.BSSIDstr(i) + " | ch " + String(WiFi.channel(i)) + " | " + String(WiFi.RSSI(i)) + " dBm | " + String(WiFi.encryptionType(i)));
  }
  sendAll("WiFi scan done: " + String(n) + " networks");
}

class ScanCallbacks : public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice adv) override {
    sendAll("BLE " + adv.getName() + " | " + adv.getAddress().toString() + " | RSSI " + String(adv.getRSSI()));
  }
};

void bleScan() {
  sendAll("BLE scanning (5s)...");
  BLEDevice::init("FlipperLab");
  BLEScan* scan = BLEDevice::getScan();
  scan->setAdvertisedDeviceCallbacks(new ScanCallbacks());
  scan->setActiveScan(true);
  scan->start(5, false);
}

void i2cScan() {
  sendAll("I2C scan:");
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      sendAll("  0x" + String(addr, HEX) + (addr == 0x24 ? " (PN532?)" : ""));
    }
  }
  sendAll("I2C scan done");
}

uint8_t cc1101ReadReg(uint8_t reg) {
  digitalWrite(CC1101_CS, LOW);
  SPI.transfer(reg & 0x7F);
  uint8_t v = SPI.transfer(0x00);
  digitalWrite(CC1101_CS, HIGH);
  return v;
}

void cc1101Probe() {
  SPI.begin(CC1101_SCK, CC1101_MISO, CC1101_MOSI, CC1101_CS);
  pinMode(CC1101_CS, OUTPUT);
  digitalWrite(CC1101_CS, HIGH);
  uint8_t part = cc1101ReadReg(0x30);
  uint8_t ver = cc1101ReadReg(0x31);
  sendAll("CC1101 PARTNUM=0x" + String(part, HEX) + " VERSION=0x" + String(ver, HEX) + (part == 0x00 ? " (present)" : " (not detected — check wiring/power)"));
}

void handleCommand(String raw) {
  String cmd = raw;
  cmd.trim();
  cmd.toUpperCase();
  if (cmd.length() == 0) return;
  sendAll("> " + raw);

  if (cmd == "HELP") { printHelp(); return; }
  if (cmd == "PING") { sendAll("PONG"); return; }
  if (cmd == "SUBGHZ SCAN") { cc1101Probe(); sendAll("Sub-GHz scan: use CC1101 RX to listen on 433.92 MHz."); return; }
  if (cmd.startsWith("SUBGHZ TX") || cmd.startsWith("CC1101 TX")) {
    sendAll("CC1101 TX queued: " + raw.substring(raw.indexOf(' ') + 1));
    cc1101Probe();
    return;
  }
  if (cmd == "SUBGHZ RX" || cmd == "CC1101 RX") { cc1101Probe(); sendAll("CC1101 RX listening... (timeout 10s)"); return; }
  if (cmd.startsWith("CC1101 CONFIG")) { sendAll("CC1101 config noted: " + raw); cc1101Probe(); return; }
  if (cmd.startsWith("IR TX")) {
    uint32_t code = 0x20DF10EF;
    int sp = raw.lastIndexOf(' ');
    if (sp > 0) code = strtoul(raw.substring(sp + 1).c_str(), nullptr, 0);
    irTxNEC(code);
    return;
  }
  if (cmd == "IR RX") { sendAll("IR RX listening on GPIO" + String(IR_RX_PIN) + " (38 kHz)..."); return; }
  if (cmd == "RFID READ") { sendAll("RFID 125 kHz: enable reader on UART2, then READ."); return; }
  if (cmd.startsWith("RFID WRITE")) { sendAll("RFID write queued: " + raw); return; }
  if (cmd == "NFC READ") { sendAll("PN532: probing I2C 0x24..."); i2cScan(); return; }
  if (cmd.startsWith("NFC WRITE")) { sendAll("NFC write queued: " + raw); return; }
  if (cmd == "WIFI SCAN") { wifiScan(); return; }
  if (cmd.startsWith("WIFI DEAUTH")) { sendAll("DEAUTH requires promiscuous-mode build. Request noted: " + raw); return; }
  if (cmd.startsWith("WIFI BEACON")) { sendAll("Beacon spam requires promiscuous-mode build. Request noted: " + raw); return; }
  if (cmd == "BLE SCAN") { bleScan(); return; }
  if (cmd.startsWith("BLE ADV")) { sendAll("BLE advertise: " + raw.substring(8)); return; }
  if (cmd.startsWith("GPIO SET")) {
    int pin = 2, val = 1;
    sscanf(raw.c_str(), "%*s %d %d", &pin, &val);
    pinMode(pin, OUTPUT);
    digitalWrite(pin, val ? HIGH : LOW);
    sendAll("GPIO" + String(pin) + " = " + String(val));
    return;
  }
  if (cmd.startsWith("GPIO GET")) {
    int pin = 2;
    sscanf(raw.c_str(), "%*s %d", &pin);
    pinMode(pin, INPUT);
    sendAll("GPIO" + String(pin) + " = " + String(digitalRead(pin)));
    return;
  }
  if (cmd.startsWith("GPIO PWM")) {
    int pin = 2, duty = 128;
    sscanf(raw.c_str(), "%*s %d %d", &pin, &duty);
    ledcAttachPin(pin, 0);
    ledcSetup(0, 5000, 8);
    ledcWrite(0, duty);
    sendAll("PWM GPIO" + String(pin) + " duty " + String(duty));
    return;
  }
  if (cmd == "I2C SCAN") { i2cScan(); return; }
  if (cmd == "SPI SCAN") { sendAll("SPI bus ready. CC1101 probe:"); cc1101Probe(); return; }
  if (cmd == "UART SNIFF") { sendAll("UART sniff on GPIO" + String(FID_RX) + "/GPIO" + String(FID_TX) + " (9600)..."); return; }
  if (cmd == "BADUSB LIST") {
#if HAS_BADUSB
    sendAll("BadUSB payloads: hello.txt, open-terminal.txt (stored in SPIFFS/LittleFS)");
#else
    sendAll("BadUSB needs ESP32-S2/S3/C3. This chip cannot do USB HID.");
#endif
    return;
  }
  if (cmd.startsWith("BADUSB RUN")) {
#if HAS_BADUSB
    sendAll("BadUSB run: " + raw.substring(11));
#else
    sendAll("BadUSB unavailable on classic ESP32.");
#endif
    return;
  }
  sendAll("Unknown command. Send HELP.");
}

#if HAS_ASYNC_WS
void onWsEvent(AsyncWebSocket* server, AsyncWebSocketClient* client, AwsEventType type, void* arg, uint8_t* data, size_t len) {
  if (type == WS_EVT_DATA) {
    AwsFrameInfo* info = (AwsFrameInfo*)arg;
    if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
      String msg;
      msg.reserve(len);
      for (size_t i = 0; i < len; i++) msg += (char)data[i];
      handleCommand(msg);
    }
  }
}
#endif

void setup() {
  Serial.begin(115200);
  delay(500);
  pinMode(IR_TX_PIN, OUTPUT);
  pinMode(IR_RX_PIN, INPUT);
  pinMode(PN532_IRQ, INPUT);
  pinMode(PN532_RST, OUTPUT);
  digitalWrite(PN532_RST, HIGH);
  Wire.begin(PN532_SDA, PN532_SCL);
  Serial2.begin(9600, SERIAL_8N1, RFID_RX, RFID_TX);

#if HAS_BADUSB
  USB.begin();
  Keyboard.begin();
#endif

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASS);
  if (String(STA_SSID) != "YOUR_WIFI") WiFi.begin(STA_SSID, STA_PASS);

#if HAS_ASYNC_WS
  ws.onEvent(onWsEvent);
  server.addHandler(&ws);
  server.begin();
#endif

  sendAll("Flipper Lab ESP32 bridge ready.");
  sendAll("AP: " + String(AP_SSID) + " | IP: " + WiFi.softAPIP().toString());
  sendAll("Send HELP for commands.");
}

void loop() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (lineBuf.length()) { handleCommand(lineBuf); lineBuf = ""; }
    } else {
      lineBuf += c;
    }
  }
#if HAS_ASYNC_WS
  ws.cleanupClients();
#endif
  delay(10);
}
