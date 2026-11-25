# Flipper Lab — A53 • ESP32 Pentest

Single-app Flipper Zero + ESP32 pentest lab tuned for the **Samsung Galaxy A53 5G**. One React/PWA codebase, wrapped with Capacitor into one Android APK. Design tokens come from your Figma file **“Pavit’s team library”** (`MKaHE3j2iFBLntc4pDpVwz`): Fuschia/Iris palette + Work Sans type.

## What’s inside

- **37 tools across 7 categories** (`src/data/tools.ts`): RF & Wireless, ESP32 Lab, Network Pentest, Recon, Crypto & Encoding, Sensors, Files & Payloads.
- **Native on A53** — NFC, BLE scan/GATT, WiFi analysis, QR/barcode, sensors, mic, vibration/torch, WebCrypto (SHA/HMAC/AES-GCM), DoH/DNS, HTTP/TLS inspection, port/subnet checks, password lab, vault.
- **Needs ESP32** — Sub-GHz (CC1101), 125 kHz RFID, IR TX/RX, BadUSB/BadBLE HID, WiFi monitor/inject, GPIO/I2C/SPI/UART, PN532 NFC.
- **Hybrid** — phone does UI/analysis, ESP32 does RF.
- **ESP32 bridge** (`src/lib/esp32.ts`) — USB serial (Web Serial over OTG), WebSocket over LAN, or Sim mode.
- **Firmware** (`firmware/esp32_bridge/esp32_bridge.ino`) — line protocol: `HELP, PING, SUBGHZ SCAN, IR TX NEC …, RFID READ, WIFI SCAN, BLE SCAN, GPIO SET …, I2C SCAN, CC1101 TX …, BADUSB LIST`.
- **Vault** — IndexedDB-backed captures/payloads/keys with JSON import/export.

## Run the web app

```bash
npm install
npm run dev        # http://localhost:5173 (0.0.0.0 for LAN/preview)
npm run build      # production build to dist/
```

## Build the APK

Local (needs Android Studio / SDK + JDK 17):

```bash
npm install
npm run android:apk   # builds web, syncs Capacitor, runs Gradle assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

CI: the **Build APK** workflow (`.github/workflows/build-apk.yml`) builds on push / manual dispatch and publishes `flipper-lab-a53.apk` to a GitHub Release. Download link is printed at the end of the session / in the Release page.

## Flash the ESP32 bridge

1. Open `firmware/esp32_bridge/esp32_bridge.ino` in Arduino IDE.
2. Install libraries: **ESP Async WebServer** + **Async TCP** (WebSocket). Optional: ELECHOUSE CC1101.
3. Select your board (ESP32 / ESP32-S3 for BadUSB), port, upload.
4. In the app → **ESP32** tab → connect via USB serial or `ws://<esp32-ip>:81`, or use Sim mode.

Wiring defaults are documented at the top of the `.ino` and in `firmware/esp32_bridge/README.md`.

## Design tokens (Figma)

| Token | Value | Source node |
|---|---|---|
| Fuschia/100 | `#EF5DA8` | 91:0 |
| Fuschia/80 | `#F178B6` | 91:1 |
| Fuschia/60 | `#FCDEEC` | 91:2 |
| Iris/100 | `#5D5FEF` | 91:3 |
| Iris/80 | `#7879F1` | 91:4 |
| Iris/60 | `#A5A6F6` | 91:5 |
| Header 1 | Work Sans Bold 34/39.88, -0.68 | 116:2 |
| Header 2 | Work Sans Bold 20/23.46, -0.4 | 116:3 |
| Body | Work Sans Regular 13/15.25, -0.26 | 116:4 |

See `src/design/tokens.json` / `tokens.css`.

## Safety

Authorized use only. Test only networks/tags/devices you own or have explicit written permission to test. RF/deauth/evil-twin/HID features can disrupt others and may be illegal in your jurisdiction.
