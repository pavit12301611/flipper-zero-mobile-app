import { useEffect, useState } from 'react'
import { bridge, QUICK_COMMANDS, type BridgeMode, type BridgeStatus } from '../lib/esp32'
import { Button, Card, Field, LogBox, SectionTitle, Stat } from '../components/ui'

export function Esp32() {
  const [status, setStatus] = useState<BridgeStatus>(bridge.status)
  const [mode, setMode] = useState<BridgeMode>(bridge.mode)
  const [baud, setBaud] = useState(115200)
  const [wsUrl, setWsUrl] = useState('ws://192.168.4.1:81')
  const [cmd, setCmd] = useState('PING')
  const [lines, setLines] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => bridge.subscribeStatus((s, m) => { setStatus(s); setMode(m) }), [])
  useEffect(() => bridge.subscribe((logs) => setLines(logs.map((l) => `${new Date(l.at).toLocaleTimeString()} ${l.dir === 'tx' ? '>' : l.dir === 'rx' ? '<' : '#'} ${l.text}`))), [])

  const wrap = async (fn: () => Promise<void>) => {
    setError('')
    try { await fn() } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }

  return (
    <div className="stack">
      <SectionTitle title="ESP32 bridge" sub="USB serial (OTG), WebSocket over LAN, or Sim mode for testing without hardware." />

      <div className="grid grid-3">
        <Stat label="Status" value={status} accent={status === 'connected' ? 'var(--ok)' : status === 'error' ? 'var(--danger)' : 'var(--warn)'} />
        <Stat label="Mode" value={mode} />
        <Stat label="Serial" value={bridge.isSerialSupported() ? 'Supported' : 'Not in this browser'} accent={bridge.isSerialSupported() ? 'var(--ok)' : 'var(--warn)'} />
      </div>

      {error && <div className="card" style={{ borderColor: 'rgba(255,92,122,.5)' }}><strong>Connection error</strong><p className="small">{error}</p></div>}

      <Card>
        <h3>Connect</h3>
        <p className="small">Flash <span className="mono">firmware/esp32_bridge/esp32_bridge.ino</span> to your ESP32 first. The bridge exposes a line-based command protocol on Serial and WebSocket.</p>
        <div className="row" style={{ marginTop: 12 }}>
          <select className="input" style={{ maxWidth: 160 }} value={baud} onChange={(e) => setBaud(parseInt(e.target.value, 10))}>
            <option value={9600}>9600</option>
            <option value={57600}>57600</option>
            <option value={115200}>115200</option>
            <option value={230400}>230400</option>
            <option value={460800}>460800</option>
            <option value={921600}>921600</option>
          </select>
          <Button disabled={!bridge.isSerialSupported() || status === 'connecting'} onClick={() => void wrap(() => bridge.connectSerial(baud))}>Connect USB serial</Button>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <Field label="WebSocket URL" value={wsUrl} onChange={setWsUrl} mono />
          <Button variant="soft" disabled={status === 'connecting'} onClick={() => void wrap(() => bridge.connectWebSocket(wsUrl))}>Connect WebSocket</Button>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => bridge.connectSim()}>Use Sim mode</Button>
          <Button variant="danger" onClick={() => void bridge.disconnect()} disabled={status === 'disconnected'}>Disconnect</Button>
          <Button variant="ghost" onClick={() => bridge.clearLogs()}>Clear log</Button>
        </div>
      </Card>

      <Card>
        <h3>Command console</h3>
        <p className="small">Line protocol: <span className="mono">HELP, PING, SUBGHZ SCAN, IR TX NEC 0x20DF10EF, RFID READ, WIFI SCAN, BLE SCAN, GPIO SET 2 1, I2C SCAN, CC1101 TX DEADBEEF, BADUSB LIST</span></p>
        <div className="row" style={{ marginTop: 10 }}>
          <Field label="Command" value={cmd} onChange={setCmd} mono />
          <Button onClick={() => void bridge.send(cmd)}>Send</Button>
        </div>
        <div className="chips" style={{ marginTop: 10 }}>
          {QUICK_COMMANDS.map((q) => (
            <button key={q.cmd} className="chip" onClick={() => void bridge.send(q.cmd)}>{q.label}</button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <LogBox lines={lines} empty="Connect the bridge and send a command." />
        </div>
      </Card>

      <Card>
        <h3>Hardware wiring (reference)</h3>
        <dl className="kv">
          <dt>CC1101</dt><dd>SPI: MOSI GPIO23, MISO GPIO19, SCK GPIO18, CS GPIO5, GDO0 GPIO21, GDO2 GPIO22. 433/868/915 MHz antenna.</dd>
          <dt>IR</dt><dd>TX LED via 220Ω + NPN on GPIO4. RX receiver on GPIO15 (38 kHz).</dd>
          <dt>RFID</dt><dd>T5577 / Proxmark-style reader on UART2 (GPIO16/17) or SPI. 125 kHz antenna.</dd>
          <dt>NFC</dt><dd>PN532 I2C SDA GPIO21, SCL GPIO22, IRQ GPIO14, RST GPIO27 (address 0x24).</dd>
          <dt>BadUSB</dt><dd>Use ESP32-S2/S3/C3 for native USB HID. Classic ESP32 cannot do USB HID.</dd>
          <dt>WiFi/BLE</dt><dd>Onboard ESP32 radio. Monitor/inject needs a promiscuous-mode build.</dd>
        </dl>
      </Card>
    </div>
  )
}
