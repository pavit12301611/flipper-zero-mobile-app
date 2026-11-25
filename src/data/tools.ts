export type Capability = 'native' | 'esp32' | 'hybrid'
export type Category = 'RF & Wireless' | 'ESP32 Lab' | 'Network Pentest' | 'Recon' | 'Crypto & Encoding' | 'Sensors' | 'Files & Payloads'

export interface ToolDef {
  id: string
  name: string
  icon: string
  category: Category
  capability: Capability
  flipper: string
  desc: string
  a53: string
  actions: string[]
}

export const CATEGORIES: Category[] = ['RF & Wireless', 'ESP32 Lab', 'Network Pentest', 'Recon', 'Crypto & Encoding', 'Sensors', 'Files & Payloads']

export const TOOLS: ToolDef[] = [
  // RF & Wireless — Flipper parity
  { id: 'subghz', name: 'Sub-GHz', icon: '📡', category: 'RF & Wireless', capability: 'esp32', flipper: 'Sub-GHz', desc: '300–928 MHz TX/RX via CC1101. Capture, decode, replay, frequency hop, RSSI scan.', a53: 'No Sub-GHz radio in A53. Needs ESP32 + CC1101 bridge (USB/BLE/WiFi).', actions: ['Scan frequencies', 'Capture', 'Replay', 'Add manually', 'Save to Vault'] },
  { id: 'rfid', name: 'RFID 125 kHz', icon: '🏷️', category: 'RF & Wireless', capability: 'esp32', flipper: 'RFID', desc: 'EM4100, HID Prox, AWID read/write, T5577 clone, proxmark-style analysis via bridge.', a53: 'No 125 kHz reader in A53. Needs ESP32 + T5577 / Proxmark bridge.', actions: ['Read', 'Write / Clone', 'Emulate', 'Save to Vault'] },
  { id: 'nfc', name: 'NFC', icon: '📶', category: 'RF & Wireless', capability: 'native', flipper: 'NFC', desc: 'Read/write NDEF, UID, MIFARE Classic keys, ISO14443, FeliCa. Web NFC + native bridge.', a53: 'Native: A53 has NFC (13.56 MHz). Web NFC on Chrome Android; fallback manual UID + bridge.', actions: ['Scan tag', 'Write NDEF', 'Dump UID', 'Key check', 'Save to Vault'] },
  { id: 'ir', name: 'Infrared', icon: '🔦', category: 'RF & Wireless', capability: 'esp32', flipper: 'Infrared', desc: 'Universal remote library (.ir), NEC/Samsung/LG/Sony, learn + transmit via ESP32 IR LED.', a53: 'No IR blaster in A53. Needs ESP32 IR bridge. Library + editor work offline.', actions: ['Universal remotes', 'Learn', 'Transmit', 'Edit .ir', 'Save to Vault'] },
  { id: 'ble', name: 'Bluetooth BLE', icon: '🔵', category: 'RF & Wireless', capability: 'hybrid', flipper: 'Bluetooth', desc: 'BLE scan, GATT explorer, advertise, BadBLE, SwiftPair / Samsung spam via ESP32.', a53: 'Native BLE 5.1 scan/GATT via Web Bluetooth. Spam + sniff need ESP32.', actions: ['Scan', 'GATT explore', 'Advertise', 'BadBLE', 'Save to Vault'] },
  { id: 'wifi', name: 'WiFi', icon: '📶', category: 'RF & Wireless', capability: 'hybrid', flipper: 'WiFi', desc: 'Scan, monitor, deauth, beacon/probe spam, evil twin, PMKID, handshake — via ESP32. Phone handles analysis.', a53: 'Phone WiFi 5 cannot monitor/inject stock. ESP32 does RF; A53 does UI + analysis.', actions: ['Scan', 'Monitor', 'Deauth', 'Evil twin', 'Handshake', 'Save capture'] },
  { id: 'badusb', name: 'BadUSB', icon: '⌨️', category: 'RF & Wireless', capability: 'esp32', flipper: 'Bad USB', desc: 'DuckyScript payloads, HID injection, USB serial, via ESP32-S2/S3/C3 BadUSB.', a53: 'Phone cannot be USB HID without root. ESP32 BadUSB bridge.', actions: ['Payload library', 'Run', 'Edit script', 'Save to Vault'] },
  { id: 'badble', name: 'BadBLE / Bad KB', icon: '⌨️', category: 'RF & Wireless', capability: 'esp32', flipper: 'Bad BLE', desc: 'BLE keyboard injection, HID over GATT, via ESP32.', a53: 'Needs ESP32 BLE HID.', actions: ['Payload library', 'Run', 'Save to Vault'] },
  { id: 'u2f', name: 'U2F / FIDO', icon: '🔑', category: 'RF & Wireless', capability: 'hybrid', flipper: 'U2F', desc: 'FIDO2 via NFC/BLE/USB, credential manager, test authenticator.', a53: 'Hybrid: NFC/BLE native, USB via ESP32.', actions: ['Test', 'Register', 'Authenticate', 'Save to Vault'] },

  // ESP32 Lab
  { id: 'flasher', name: 'ESP32 Flasher', icon: '⚡', category: 'ESP32 Lab', capability: 'esp32', flipper: '— (ESP32)', desc: 'Flash .bin via Web Serial / Web USB, baud select, partition info, erase, reset.', a53: 'USB-C OTG on A53. Chrome Web Serial/USB. Also BLE/WiFi OTA via bridge.', actions: ['Connect', 'Flash .bin', 'Erase', 'Reset', 'Info'] },
  { id: 'monitor', name: 'Serial Monitor', icon: '💻', category: 'ESP32 Lab', capability: 'esp32', flipper: '— (ESP32)', desc: 'Live UART console, baud 9600–921600, TX/RX, log export.', a53: 'Via USB serial / BLE / WiFi bridge.', actions: ['Connect', 'Send', 'Clear', 'Export log'] },
  { id: 'gpio', name: 'GPIO Lab', icon: '🔌', category: 'ESP32 Lab', capability: 'esp32', flipper: 'GPIO', desc: 'Digital/analog IO, PWM, pin map for ESP32 / S3 / C3, logic levels.', a53: 'No GPIO on phone. ESP32 bridge only.', actions: ['Set pin', 'Read pin', 'PWM', 'Save preset'] },
  { id: 'i2c', name: 'I2C / SPI / UART', icon: '🔗', category: 'ESP32 Lab', capability: 'esp32', flipper: 'GPIO', desc: 'Bus scanner, register read/write, SPI transfer, UART sniff via bridge.', a53: 'ESP32 bridge only.', actions: ['Scan bus', 'Read reg', 'Write reg', 'Sniff UART'] },
  { id: 'cc1101', name: 'CC1101 Lab', icon: '📻', category: 'ESP32 Lab', capability: 'esp32', flipper: 'Sub-GHz', desc: 'CC1101 config: freq, BW, deviation, packet mode, raw TX/RX.', a53: 'ESP32 + CC1101 only.', actions: ['Configure', 'TX raw', 'RX raw', 'Save preset'] },
  { id: 'pn532', name: 'PN532 Lab', icon: '💳', category: 'ESP32 Lab', capability: 'esp32', flipper: 'NFC', desc: 'PN532 NFC bridge: read/write, MIFARE, ISO14443 via ESP32.', a53: 'ESP32 + PN532 only (phone NFC covers most cases).', actions: ['Scan', 'Read', 'Write', 'Save to Vault'] },

  // Network Pentest — native on A53
  { id: 'portscan', name: 'Port Scanner', icon: '🔍', category: 'Network Pentest', capability: 'native', flipper: '— (Pentest)', desc: 'TCP/UDP port scan, banner grab, service fingerprint, export report.', a53: 'Native: HTTP/WebSocket connect checks + DoH. Raw TCP via native bridge.', actions: ['Scan host', 'Banner', 'Export'] },
  { id: 'pingdns', name: 'Ping & DNS', icon: '🌐', category: 'Network Pentest', capability: 'native', flipper: '— (Pentest)', desc: 'HTTP ping timing, DNS-over-HTTPS lookup (A/AAAA/MX/TXT), reverse DNS.', a53: 'Native: real DoH + fetch timing.', actions: ['Ping', 'Lookup', 'Reverse', 'Export'] },
  { id: 'httpinspector', name: 'HTTP / TLS Inspector', icon: '🔒', category: 'Network Pentest', capability: 'native', flipper: '— (Pentest)', desc: 'Headers, status, TLS cert, cipher, HSTS, security headers, redirect chain.', a53: 'Native: fetch + DoH + cert via native bridge where available.', actions: ['Inspect', 'TLS check', 'Export'] },
  { id: 'subnet', name: 'Subnet Scanner', icon: '🕸️', category: 'Network Pentest', capability: 'native', flipper: '— (Pentest)', desc: 'CIDR sweep, live host discovery, MAC/OUI, open-port summary.', a53: 'Native HTTP sweep. ARP via native bridge.', actions: ['Sweep', 'Export'] },
  { id: 'banner', name: 'Banner Grab', icon: '🪧', category: 'Network Pentest', capability: 'native', flipper: '— (Pentest)', desc: 'Grab service banners, version fingerprint, CVE hints.', a53: 'Native HTTP banner + bridge for raw.', actions: ['Grab', 'Export'] },

  // Recon
  { id: 'wifiscan', name: 'WiFi Scanner', icon: '📡', category: 'Recon', capability: 'hybrid', flipper: 'WiFi', desc: 'SSID/BSSID, channel, RSSI, encryption, WPS, evil-twin hints. ESP32 monitor + phone analysis.', a53: 'Hybrid: ESP32 scan; phone shows native WiFi info.', actions: ['Scan', 'Map', 'Export'] },
  { id: 'blescan', name: 'BLE Scanner', icon: '🔵', category: 'Recon', capability: 'native', flipper: 'Bluetooth', desc: 'BLE advertisements, RSSI, service UUIDs, manufacturer data.', a53: 'Native Web Bluetooth where supported; sim fallback.', actions: ['Scan', 'GATT', 'Export'] },
  { id: 'qrcode', name: 'QR / Barcode', icon: '⬛', category: 'Recon', capability: 'native', flipper: '—', desc: 'Scan QR/barcode via camera (BarcodeDetector), generate QR, history.', a53: 'Native camera + BarcodeDetector.', actions: ['Scan', 'Generate', 'History'] },
  { id: 'whois', name: 'IP / Whois / OSINT', icon: '🕵️', category: 'Recon', capability: 'native', flipper: '—', desc: 'IP geolocation, ASN, whois, headers, OSINT helpers. Authorized use only.', a53: 'Native HTTPS APIs.', actions: ['Lookup', 'Export'] },

  // Crypto & Encoding
  { id: 'hash', name: 'Hash & Crypto', icon: '🧮', category: 'Crypto & Encoding', capability: 'native', flipper: '—', desc: 'SHA-256/384/512 (WebCrypto), MD5, HMAC, AES-GCM encrypt/decrypt.', a53: 'Native WebCrypto.', actions: ['Hash', 'HMAC', 'Encrypt', 'Decrypt'] },
  { id: 'encode', name: 'Encode / Decode', icon: '🔤', category: 'Crypto & Encoding', capability: 'native', flipper: '—', desc: 'Base64, Hex, URL, HTML, ROT13, Morse, JWT decoder.', a53: 'Native.', actions: ['Encode', 'Decode', 'JWT'] },
  { id: 'passgen', name: 'Password Lab', icon: '🎲', category: 'Crypto & Encoding', capability: 'native', flipper: '—', desc: 'Strong password generator, strength meter, passphrase, PIN.', a53: 'Native crypto.getRandomValues.', actions: ['Generate', 'Copy', 'Strength'] },
  { id: 'keyfiles', name: 'Key Files', icon: '🗝️', category: 'Crypto & Encoding', capability: 'native', flipper: 'NFC / RFID', desc: 'MIFARE key dictionaries, Proxmark keys, .keys editor, import/export.', a53: 'Native file handling.', actions: ['Import', 'Edit', 'Export'] },

  // Sensors
  { id: 'compass', name: 'Compass', icon: '🧭', category: 'Sensors', capability: 'native', flipper: 'Sensors', desc: 'Heading, pitch/roll, calibration, via DeviceOrientation.', a53: 'Native sensors on A53.', actions: ['Start', 'Calibrate', 'Export'] },
  { id: 'motion', name: 'Motion / Gyro', icon: '🌀', category: 'Sensors', capability: 'native', flipper: 'Sensors', desc: 'Accelerometer, gyroscope, step, shake detection.', a53: 'Native.', actions: ['Start', 'Export'] },
  { id: 'light', name: 'Light / Proximity', icon: '💡', category: 'Sensors', capability: 'native', flipper: 'Sensors', desc: 'Ambient light, proximity, screen lux meter.', a53: 'Native where supported.', actions: ['Start', 'Export'] },
  { id: 'mic', name: 'Mic Level', icon: '🎙️', category: 'Sensors', capability: 'native', flipper: '—', desc: 'Live dB meter, spectrum, record level (no upload).', a53: 'Native mic via getUserMedia.', actions: ['Start', 'Stop'] },
  { id: 'vibrate', name: 'Vibration / Flash', icon: '📳', category: 'Sensors', capability: 'native', flipper: '—', desc: 'Vibration patterns, camera torch strobe, Morse TX via flash/vibration.', a53: 'Native vibrate + torch.', actions: ['Pattern', 'Strobe', 'Morse'] },

  // Files & Payloads
  { id: 'files', name: 'File Browser', icon: '📁', category: 'Files & Payloads', capability: 'native', flipper: 'File Browser', desc: 'Virtual FS: captures, payloads, keys, firmware. Import/export, search.', a53: 'Native IndexedDB vault.', actions: ['Browse', 'Import', 'Export', 'Search'] },
  { id: 'payloads', name: 'Payload Library', icon: '📚', category: 'Files & Payloads', capability: 'hybrid', flipper: 'Bad USB / IR / Sub-GHz', desc: 'DuckyScript, .ir remotes, Sub-GHz captures, NFC dumps. One-tap run via ESP32.', a53: 'Hybrid: library native, TX via ESP32.', actions: ['Browse', 'Run', 'Edit', 'Save'] },
  { id: 'captures', name: 'Captures', icon: '💾', category: 'Files & Payloads', capability: 'native', flipper: '—', desc: 'WiFi/BLE/NFC/Sub-GHz capture manager, pcap/.sub/.nfc export.', a53: 'Native vault.', actions: ['Browse', 'Export', 'Delete'] },
  { id: 'apps', name: 'Apps / Plugins', icon: '🧩', category: 'Files & Payloads', capability: 'native', flipper: 'Apps', desc: 'Plugin manifests, JS tools, shortcuts. Install from Vault.', a53: 'Native.', actions: ['Install', 'Run', 'Remove'] },
]

export const CAP_LABEL: Record<Capability, string> = {
  native: 'Native • A53',
  esp32: 'Needs ESP32',
  hybrid: 'Hybrid',
}

export const CAP_COLOR: Record<Capability, string> = {
  native: '#3DD68C',
  esp32: '#EF5DA8',
  hybrid: '#7879F1',
}
