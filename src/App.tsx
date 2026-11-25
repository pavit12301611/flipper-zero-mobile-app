import { useEffect, useState } from 'react'
import type { ToolDef } from './data/tools'
import { bridge, type BridgeStatus } from './lib/esp32'
import { Home } from './screens/Home'
import { Tools } from './screens/Tools'
import { Esp32 } from './screens/Esp32'
import { Vault } from './screens/Vault'
import { Settings } from './screens/Settings'

type Tab = 'home' | 'tools' | 'esp32' | 'vault' | 'settings'

const NAV: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'tools', icon: '🧰', label: 'Tools' },
  { id: 'esp32', icon: '⚡', label: 'ESP32' },
  { id: 'vault', icon: '💾', label: 'Vault' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

function statusDot(status: BridgeStatus): string {
  if (status === 'connected') return 'dot ok'
  if (status === 'error') return 'dot bad'
  if (status === 'connecting') return 'dot warn'
  return 'dot'
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null)
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>(bridge.status)

  useEffect(() => bridge.subscribeStatus((s) => setBridgeStatus(s)), [])

  const openTool = (tool: ToolDef) => {
    setSelectedTool(tool)
    setTab('tools')
  }

  const go = (next: string) => {
    setTab(next as Tab)
    if (next !== 'tools') setSelectedTool(null)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-row">
          <div className="brand">
            <div className="brand-mark">F</div>
            <div>
              <div className="brand-name">Flipper Lab</div>
              <div className="brand-sub">A53 • ESP32 pentest lab</div>
            </div>
          </div>
          <div className="pill" title="ESP32 bridge status">
            <span className={statusDot(bridgeStatus)} />
            ESP32 {bridgeStatus}
          </div>
        </div>
      </header>

      <main className="main">
        {tab === 'home' && <Home onOpenTool={openTool} onGo={go} />}
        {tab === 'tools' && <Tools selected={selectedTool} onSelect={setSelectedTool} />}
        {tab === 'esp32' && <Esp32 />}
        {tab === 'vault' && <Vault />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="bottom-nav" aria-label="Primary">
        <div className="bottom-nav-inner">
          {NAV.map((item) => (
            <button key={item.id} className={`nav-btn ${tab === item.id ? 'active' : ''}`} onClick={() => go(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
