# ESP32 Bridge Firmware

Line-based command protocol that mirrors the Flipper Zero feature set on hardware the A53 lacks.

## Features

| Area | Commands |
|---|---|
| Sub-GHz CC1101 | `SUBGHZ SCAN`, `SUBGHZ TX <hex>`, `SUBGHZ RX`, `CC1101 CONFIG <mhz>`, `CC1101 TX <hex>` |
| Infrared | `IR TX NEC <hex>`, `IR RX` (38 kHz) |
| 125 kHz RFID | `RFID READ`, `RFID WRITE <hex>` |
| NFC PN532 | `NFC READ`, `NFC WRITE <hex>` |
| WiFi | `WIFI SCAN`, `WIFI DEAUTH <bssid> <ch>` (promiscuous build), `WIFI BEACON <ssid>` |
| BLE | `BLE SCAN`, `BLE ADV <name>` |
| GPIO / hardware | `GPIO SET/GET/PWM <pin> …`, `I2C SCAN`, `SPI SCAN`, `UART SNIFF` |
| BadUSB | `BADUSB LIST`, `BADUSB RUN <name>` (ESP32-S2/S3/C3 only) |

## Connections

- **USB Serial**: 115200 baud over OTG. Connect from the app with `Connect USB serial` (Chrome on Android, USB-C OTG adapter + **USAA/goandroid device must be unlocked**).
- **WebSocket**: firmware starts an AP `FlipperLab` / `flipperlab` and a WS server on port **81**. Connect with `ws://<esp32-ip>:81` from the app or any browser client on the same LAN.

## Build

1. Install the **esp32** board package (ESP32-Arduino core ≥ 2.0).
2. Library Manager: `Async WebServer` + `AsyncTCP` (WebSocket support). Optional: `ELECHOUSE_CC1101` for full CC1101 register access.
3. Choose target: classic **ESP32** for RF/IR/RFID/NFC; **ESP32-S3** for BadUSB HID.
4. Upload, then open the app's **ESP32** tab and connect.

## Pin map

```
CC1101 : MOSI 23 | MISO 19 | SCK 18 | CS 5 | GDO0 21 | GDO2 22
IR      : TX 4 (220R + NPN) | RX 15 (38 kHz)
RFID    : UART2 RX 16 | TX 17 (125 kHz module)
PN532   : I2C SDA 21 | SCL 22 | IRQ 14 | RST 27  (0x24)
WiFi/BLE: onboard
```

Edit the `#define`s at the top of `esp32_bridge.ino` to match your board/wiring.

## Safety

Same rules as the app: only your own or explicitly authorized hardware. RF transmission and HID injection are restricted activities in many jurisdictions.
