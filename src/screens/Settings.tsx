import { Card, SectionTitle, Stat } from '../components/ui'
import { TOOLS } from '../data/tools'

export function Settings() {
  const native = TOOLS.filter((t) => t.capability === 'native').length
  const esp32 = TOOLS.filter((t) => t.capability === 'esp32').length
  const hybrid = TOOLS.filter((t) => t.capability === 'hybrid').length

  return (
    <div className="stack">
      <SectionTitle title="Settings & about" sub="Design system, capability matrix and safety notes." />

      <div className="grid grid-3">
        <Stat label="Tools" value={String(TOOLS.length)} />
        <Stat label="Native" value={String(native)} accent="var(--ok)" />
        <Stat label="ESP32 / Hybrid" value={`${esp32} / ${hybrid}`} accent="var(--iris-80)" />
      </div>

      <Card>
        <h3>Figma design system</h3>
        <p className="small">Tokens extracted from “Pavit’s team library” (file MKaHE3j2iFBLntc4pDpVwz): Fuschia/100 #EF5DA8, Fuschia/80 #F178B6, Fuschia/60 #FCDEEC, Iris/100 #5D5FEF, Iris/80 #7879F1, Iris/60 #A5A6F6. Type: Work Sans Header 1 34/39.88, Header 2 20/23.46, Body 13/15.25. Dark hacker surfaces are derived for AMOLED legibility on the A53.</p>
        <div className="row" style={{ marginTop: 12 }}>
          {['#EF5DA8', '#F178B6', '#FCDEEC', '#5D5FEF', '#7879F1', '#A5A6F6'].map((c) => (
            <span key={c} className="badge" style={{ background: c, color: '#0B0B12', borderColor: c }}>{c}</span>
          ))}
        </div>
      </Card>

      <Card>
        <h3>Galaxy A53 5G notes</h3>
        <dl className="kv">
          <dt>Display</dt><dd>6.5″ 120 Hz AMOLED — dark theme, large touch targets, bottom nav for one-hand use.</dd>
          <dt>Radios</dt><dd>NFC + BLE 5.1 + WiFi 5 native. No Sub-GHz, no 125 kHz RFID, no IR blaster, no USB HID — those route via ESP32.</dd>
          <dt>Browser</dt><dd>Chrome Android for Web Serial / Web Bluetooth / BarcodeDetector. WebView in the APK may limit some Web APIs.</dd>
          <dt>Storage</dt><dd>Vault uses IndexedDB. Export JSON regularly — clearing app data wipes the vault.</dd>
        </dl>
      </Card>

      <Card>
        <h3>APK</h3>
        <p className="small">This web app is wrapped with Capacitor into a single Android APK (app id com.flipperlab.a53). Build locally with <span className="mono">npm run android:apk</span> or use the GitHub Actions workflow <span className="mono">build-apk.yml</span> which publishes <span className="mono">flipper-lab-a53.apk</span> to Releases.</p>
      </Card>

      <Card>
        <h3>Safety & legality</h3>
        <p className="small">Only test systems you own or have explicit authorization to test. RF jamming/deauth, evil-twin, credential capture and HID injection can harm third parties and violate wiretap, computer-misuse and radio regulations. Keep transmissions low-power, short and targeted.</p>
      </Card>
    </div>
  )
}
