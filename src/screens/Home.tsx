import { useEffect, useState } from 'react'
import { TOOLS, type ToolDef } from '../data/tools'
import { bridge, type BridgeStatus } from '../lib/esp32'
import { vaultList, type VaultItem } from '../lib/vault'
import { CapBadge, Card, SectionTitle, Stat } from '../components/ui'

export function Home({ onOpenTool, onGo }: { onOpenTool: (tool: ToolDef) => void; onGo: (tab: string) => void }) {
  const [status, setStatus] = useState<BridgeStatus>(bridge.status)
  const [items, setItems] = useState<VaultItem[]>([])

  useEffect(() => bridge.subscribeStatus((s) => setStatus(s)), [])
  useEffect(() => {
    vaultList().then(setItems).catch(() => setItems([]))
  }, [])

  const native = TOOLS.filter((t) => t.capability === 'native')
  const esp32 = TOOLS.filter((t) => t.capability === 'esp32')
  const hybrid = TOOLS.filter((t) => t.capability === 'hybrid')
  const quick = TOOLS.filter((t) => ['nfc', 'hash', 'encode', 'pingdns', 'qrcode', 'passgen', 'portscan', 'compass'].includes(t.id))

  return (
    <div className="stack">
      <section className="hero">
        <div className="caption" style={{ color: 'var(--iris-60)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Flipper Zero parity • ESP32 bridge • Galaxy A53 5G
        </div>
        <h1 className="h1">One lab app for phone-native pentesting + ESP32 RF hardware.</h1>
        <p className="body">
          Built from your Figma tokens (Fuschia / Iris, Work Sans). Native tools run on the A53 today; Sub-GHz, IR, RFID, BadUSB and monitor-mode WiFi route through the ESP32 bridge over USB serial, BLE or WiFi.
        </p>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={() => onGo('tools')}>Open tool grid</button>
          <button className="btn" onClick={() => onGo('esp32')}>Connect ESP32</button>
          <button className="btn btn-ghost" onClick={() => onGo('vault')}>Vault ({items.length})</button>
        </div>
      </section>

      <div className="grid grid-4">
        <Stat label="Native on A53" value={String(native.length)} accent="var(--ok)" />
        <Stat label="Needs ESP32" value={String(esp32.length)} accent="var(--fuschia-100)" />
        <Stat label="Hybrid" value={String(hybrid.length)} accent="var(--iris-80)" />
        <Stat label="Bridge" value={status === 'connected' ? 'Online' : status} accent={status === 'connected' ? 'var(--ok)' : 'var(--warn)'} />
      </div>

      <Card>
        <div className="row-between">
          <div>
            <h3>Galaxy A53 5G capability profile</h3>
            <p className="small">The app never pretends the phone has radios it does not. Each tool is labelled by what the A53 can do natively vs what needs the ESP32.</p>
          </div>
          <CapBadge capability="native" />
        </div>
        <dl className="kv" style={{ marginTop: 12 }}>
          <dt>Native</dt><dd>NFC 13.56 MHz, BLE 5.1 scan/GATT, WiFi 5 analysis, camera QR, sensors, mic, vibration/torch, WebCrypto, DoH/network checks.</dd>
          <dt>ESP32</dt><dd>Sub-GHz CC1101, 125 kHz RFID, IR TX/RX, BadUSB/BadBLE HID, WiFi monitor/inject, GPIO/I2C/SPI/UART, PN532 NFC.</dd>
          <dt>Bridge</dt><dd>USB-C OTG Web Serial, WebSocket over LAN, or simulated mode for UI testing.</dd>
        </dl>
      </Card>

      <SectionTitle title="Quick actions" sub="Most-used native tools — no hardware required." />
      <div className="grid grid-3">
        {quick.map((tool) => (
          <button key={tool.id} className="card tool-card" onClick={() => onOpenTool(tool)}>
            <div className="tool-top">
              <div className="tool-icon">{tool.icon}</div>
              <CapBadge capability={tool.capability} />
            </div>
            <div className="tool-name" style={{ marginTop: 10 }}>{tool.name}</div>
            <div className="tool-desc">{tool.desc}</div>
          </button>
        ))}
      </div>

      <SectionTitle title="Recent vault" sub="Captures, payloads and keys saved on-device." />
      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">💾</div>
          <div className="empty-title">Vault is empty</div>
          <div className="caption">Save a hash, capture, payload or key from any tool and it will appear here.</div>
        </div>
      ) : (
        <div className="grid grid-2">
          {items.slice(0, 4).map((item) => (
            <Card key={item.id}>
              <div className="row-between">
                <strong>{item.name}</strong>
                <span className="caption">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <p className="mono" style={{ marginTop: 8, color: 'var(--text-2)' }}>{item.data.slice(0, 160)}</p>
              <div className="caption" style={{ marginTop: 6 }}>{item.type}</div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <h3>Authorized use only</h3>
        <p className="small">
          Use this lab only on networks, tags and devices you own or have explicit written permission to test. RF transmissions, deauth, evil-twin and HID injection can disrupt other people’s devices and may be illegal in your jurisdiction.
        </p>
      </Card>
    </div>
  )
}
