import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import type { ToolDef } from '../data/tools'
import { bridge, QUICK_COMMANDS } from '../lib/esp32'
import { vaultAdd, vaultList, downloadText, type VaultItem } from '../lib/vault'
import {
  aesGcmDecrypt, aesGcmEncrypt, b64Decode, b64Encode, fromMorse, hexDecode, hexEncode,
  hmacSha256, jwtDecode, md5, passwordStrength, randomPassword, rot13, sha, toMorse,
} from '../lib/crypto'
import { dohLookup, httpInspect, httpPing, ipInfo, portScan, subnetSweep } from '../lib/network'
import { Button, Field, LogBox } from './ui'

async function save(name: string, type: string, data: string, toolId: string) {
  await vaultAdd({ name, type, data, toolId })
}

export function ToolPanel({ tool }: { tool: ToolDef }) {
  switch (tool.id) {
    case 'hash': return <CryptoPanel tool={tool} />
    case 'encode': return <EncodePanel tool={tool} />
    case 'passgen': return <PasswordPanel tool={tool} />
    case 'pingdns': case 'httpinspector': case 'portscan': case 'subnet': case 'banner': case 'whois': return <NetworkPanel tool={tool} />
    case 'qrcode': return <QrPanel tool={tool} />
    case 'compass': case 'motion': case 'light': case 'mic': case 'vibrate': return <SensorsPanel tool={tool} />
    case 'files': case 'captures': case 'payloads': case 'apps': case 'keyfiles': return <FilesPanel tool={tool} />
    default: return <GenericPanel tool={tool} />
  }
}

function CryptoPanel({ tool }: { tool: ToolDef }) {
  const [text, setText] = useState('flipper-lab')
  const [algo, setAlgo] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256')
  const [out, setOut] = useState('')
  const [key, setKey] = useState('secret')
  const [password, setPassword] = useState('correct horse battery staple')
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<string>) => {
    setBusy(true)
    try { setOut(await fn()) } catch (e) { setOut(`Error: ${e instanceof Error ? e.message : String(e)}`) } finally { setBusy(false) }
  }

  return (
    <div className="stack">
      <Field label="Input" value={text} onChange={setText} mono rows={3} />
      <div className="row">
        <select className="input" style={{ maxWidth: 180 }} value={algo} onChange={(e) => setAlgo(e.target.value as typeof algo)}>
          <option>SHA-256</option><option>SHA-384</option><option>SHA-512</option>
        </select>
        <Button disabled={busy} onClick={() => run(() => sha(algo, text))}>Hash {algo}</Button>
        <Button variant="soft" disabled={busy} onClick={() => run(async () => md5(text))}>MD5</Button>
      </div>
      <Field label="HMAC key" value={key} onChange={setKey} mono />
      <Button variant="soft" disabled={busy} onClick={() => run(() => hmacSha256(key, text))}>HMAC-SHA256</Button>
      <Field label="AES-GCM password" value={password} onChange={setPassword} mono />
      <div className="row">
        <Button disabled={busy} onClick={() => run(() => aesGcmEncrypt(password, text))}>Encrypt</Button>
        <Button variant="ghost" disabled={busy} onClick={() => run(() => aesGcmDecrypt(password, out))}>Decrypt output</Button>
        <Button variant="ghost" onClick={() => void save(`${tool.name} result`, 'crypto', out, tool.id)}>Save to Vault</Button>
      </div>
      <Field label="Output" value={out} onChange={setOut} mono rows={5} />
    </div>
  )
}

function EncodePanel({ tool }: { tool: ToolDef }) {
  const [input, setInput] = useState('Hello Flipper')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState('base64')

  const apply = () => {
    try {
      if (mode === 'base64') setOutput(b64Encode(input))
      else if (mode === 'base64d') setOutput(b64Decode(input))
      else if (mode === 'hex') setOutput(hexEncode(input))
      else if (mode === 'hexd') setOutput(hexDecode(input))
      else if (mode === 'rot13') setOutput(rot13(input))
      else if (mode === 'morse') setOutput(toMorse(input))
      else if (mode === 'morsed') setOutput(fromMorse(input))
      else if (mode === 'jwt') setOutput(jwtDecode(input))
      else if (mode === 'url') setOutput(encodeURIComponent(input))
      else if (mode === 'urld') setOutput(decodeURIComponent(input))
    } catch (e) {
      setOutput(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div className="stack">
      <Field label="Input" value={input} onChange={setInput} mono rows={4} />
      <div className="row">
        <select className="input" style={{ maxWidth: 220 }} value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="base64">Base64 encode</option>
          <option value="base64d">Base64 decode</option>
          <option value="hex">Hex encode</option>
          <option value="hexd">Hex decode</option>
          <option value="rot13">ROT13</option>
          <option value="morse">Text → Morse</option>
          <option value="morsed">Morse → Text</option>
          <option value="jwt">JWT decode</option>
          <option value="url">URL encode</option>
          <option value="urld">URL decode</option>
        </select>
        <Button onClick={apply}>Run</Button>
        <Button variant="ghost" onClick={() => void save(`${tool.name} result`, 'encoding', output, tool.id)}>Save to Vault</Button>
      </div>
      <Field label="Output" value={output} onChange={setOutput} mono rows={5} />
    </div>
  )
}

function PasswordPanel({ tool }: { tool: ToolDef }) {
  const [length, setLength] = useState(16)
  const [symbols, setSymbols] = useState(true)
  const [pw, setPw] = useState('')
  const strength = passwordStrength(pw)

  const gen = () => setPw(randomPassword(length, symbols))
  useEffect(() => { gen() }, [])

  return (
    <div className="stack">
      <div className="row">
        <Field label="Length" value={String(length)} onChange={(v) => setLength(Math.max(4, Math.min(64, parseInt(v || '16', 10))))} type="number" />
        <label className="row small"><input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} /> Symbols</label>
        <Button onClick={gen}>Generate</Button>
      </div>
      <Field label="Password" value={pw} onChange={setPw} mono />
      <div className="row">
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>{strength.label} • {strength.score}/4</span>
        <Button variant="soft" onClick={() => void navigator.clipboard?.writeText(pw)}>Copy</Button>
        <Button variant="ghost" onClick={() => void save('Generated password', 'secret', pw, tool.id)}>Save to Vault</Button>
      </div>
      <p className="caption">Generated locally with crypto.getRandomValues. Never upload passwords to a server.</p>
    </div>
  )
}

function NetworkPanel({ tool }: { tool: ToolDef }) {
  const [target, setTarget] = useState(tool.id === 'subnet' ? '192.168.1.0/24' : 'example.com')
  const [type, setType] = useState('A')
  const [lines, setLines] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const push = (s: string) => setLines((prev) => [...prev, s])

  const runDns = async () => {
    setBusy(true); push(`> DNS ${type} ${target}`)
    try { (await dohLookup(target, type)).forEach((r) => push(`${r.name} ${r.type} TTL=${r.TTL} ${r.data}`)) }
    catch (e) { push(`Error: ${e instanceof Error ? e.message : String(e)}`) } finally { setBusy(false) }
  }
  const runPing = async () => {
    setBusy(true); push(`> ping ${target}`)
    try { const p = await httpPing(target); push(`${p.url} → ${p.ms} ms (status ${p.status})`) }
    catch (e) { push(`Error: ${e instanceof Error ? e.message : String(e)}`) } finally { setBusy(false) }
  }
  const runHttp = async () => {
    setBusy(true); push(`> inspect ${target}`)
    try {
      const info = await httpInspect(target)
      push(`status ${info.status} in ${info.timingMs} ms`)
      push(`final ${info.finalUrl}`)
      Object.entries(info.headers).forEach(([k, v]) => push(`${k}: ${v}`))
      push(info.note)
    } catch (e) { push(`Error: ${e instanceof Error ? e.message : String(e)}`) } finally { setBusy(false) }
  }
  const runPorts = async () => {
    setBusy(true); push(`> port scan ${target}`)
    try { (await portScan(target)).forEach((r) => push(`${r.port}/tcp ${r.open ? 'OPEN' : 'closed'} — ${r.banner}`)) }
    catch (e) { push(`Error: ${e instanceof Error ? e.message : String(e)}`) } finally { setBusy(false) }
  }
  const runSubnet = async () => {
    setBusy(true); push(`> subnet sweep ${target}`)
    try {
      const alive = await subnetSweep(target, (ip, ok) => { if (ok) push(`alive ${ip}`) })
      push(`done: ${alive.length} live host(s)`)
    } catch (e) { push(`Error: ${e instanceof Error ? e.message : String(e)}`) } finally { setBusy(false) }
  }
  const runWhois = async () => {
    setBusy(true); push(`> ip info ${target}`)
    try { const info = await ipInfo(target); Object.entries(info).forEach(([k, v]) => push(`${k}: ${String(v)}`)) }
    catch (e) { push(`Error: ${e instanceof Error ? e.message : String(e)}`) } finally { setBusy(false) }
  }

  return (
    <div className="stack">
      <Field label={tool.id === 'subnet' ? 'CIDR' : 'Host / IP / URL'} value={target} onChange={setTarget} mono />
      <div className="row">
        {(tool.id === 'pingdns' || tool.id === 'whois') && (
          <>
            <select className="input" style={{ maxWidth: 120 }} value={type} onChange={(e) => setType(e.target.value)}>
              <option>A</option><option>AAAA</option><option>MX</option><option>TXT</option><option>CNAME</option>
            </select>
            <Button disabled={busy} onClick={() => void runDns()}>DNS lookup</Button>
          </>
        )}
        {(tool.id === 'pingdns' || tool.id === 'httpinspector' || tool.id === 'banner') && <Button disabled={busy} onClick={() => void runPing()}>Ping</Button>}
        {(tool.id === 'httpinspector' || tool.id === 'banner') && <Button disabled={busy} onClick={() => void runHttp()}>Inspect HTTP</Button>}
        {(tool.id === 'portscan' || tool.id === 'banner') && <Button disabled={busy} onClick={() => void runPorts()}>Port scan</Button>}
        {tool.id === 'subnet' && <Button disabled={busy} onClick={() => void runSubnet()}>Sweep subnet</Button>}
        {tool.id === 'whois' && <Button disabled={busy} onClick={() => void runWhois()}>IP / ASN lookup</Button>}
        <Button variant="ghost" onClick={() => downloadText(`${tool.id}-report.txt`, lines.join('\n'))}>Export</Button>
        <Button variant="ghost" onClick={() => void save(`${tool.name} report`, 'network', lines.join('\n'), tool.id)}>Save to Vault</Button>
      </div>
      <LogBox lines={lines} empty="Browser network tools are CORS-limited. Raw TCP/UDP, ARP and TLS cert details need the native bridge or ESP32." />
    </div>
  )
}

function QrPanel({ tool }: { tool: ToolDef }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState('')
  const [genText, setGenText] = useState('https://example.com')
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(genText || ' ', { width: 360, margin: 1 }).then(setQrUrl).catch(() => setQrUrl(''))
  }, [genText])

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  const scan = async () => {
    try {
      const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector
      if (!Detector) { setResult('BarcodeDetector is not available in this browser. Use Chrome on Android, or paste a value manually.'); return }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanning(true)
      const detector = new Detector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a'] })
      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0) { setResult(codes[0].rawValue); stop(); return }
        } catch { /* keep trying */ }
        if (streamRef.current) requestAnimationFrame(() => void tick())
      }
      void tick()
    } catch (e) {
      setResult(`Camera error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  useEffect(() => stop, [])

  return (
    <div className="stack">
      <div className="row">
        <Button onClick={() => void scan()}>Scan QR / barcode</Button>
        <Button variant="ghost" onClick={stop} disabled={!scanning}>Stop</Button>
        <Button variant="ghost" onClick={() => void save('QR scan result', 'qr', result, tool.id)} disabled={!result}>Save scan</Button>
      </div>
      {scanning && <video ref={videoRef} className="video-box" playsInline muted />}
      {!scanning && <video ref={videoRef} className="video-box" style={{ display: 'none' }} playsInline muted />}
      <Field label="Scan result" value={result} onChange={setResult} mono rows={2} />
      <Field label="Generate QR for" value={genText} onChange={setGenText} mono />
      {qrUrl && <img className="qr-img" src={qrUrl} alt="Generated QR code" />}
    </div>
  )
}

function SensorsPanel({ tool }: { tool: ToolDef }) {
  const [lines, setLines] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const push = (s: string) => setLines((prev) => [...prev.slice(-80), s])

  const stop = () => {
    setRunning(false)
    window.removeEventListener('deviceorientation', onOrient as EventListener)
    window.removeEventListener('devicemotion', onMotion as EventListener)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }

  const onOrient = (e: DeviceOrientationEvent) => {
    push(`heading=${e.alpha?.toFixed(1) ?? 'n/a'}° beta=${e.beta?.toFixed(1) ?? 'n/a'} gamma=${e.gamma?.toFixed(1) ?? 'n/a'}`)
  }
  const onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity
    push(`ax=${a?.x?.toFixed(2) ?? 'n/a'} ay=${a?.y?.toFixed(2) ?? 'n/a'} az=${a?.z?.toFixed(2) ?? 'n/a'}`)
  }

  const start = async () => {
    try {
      const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      if (typeof DOE.requestPermission === 'function') await DOE.requestPermission()
      if (tool.id === 'compass' || tool.id === 'light') window.addEventListener('deviceorientation', onOrient as EventListener)
      if (tool.id === 'motion') window.addEventListener('devicemotion', onMotion as EventListener)
      if (tool.id === 'mic') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const ctx = new AudioContext()
        const src = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        src.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)
        const loop = () => {
          analyser.getByteFrequencyData(data)
          const avg = data.reduce((a, b) => a + b, 0) / data.length
          push(`level=${avg.toFixed(1)}`)
          rafRef.current = requestAnimationFrame(loop)
        }
        loop()
      }
      if (tool.id === 'vibrate') {
        navigator.vibrate?.([120, 80, 120, 80, 300])
        push('vibration pattern sent')
      }
      setRunning(true)
    } catch (e) {
      push(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  useEffect(() => stop, [])

  return (
    <div className="stack">
      <div className="row">
        <Button onClick={() => void start()} disabled={running}>Start</Button>
        <Button variant="ghost" onClick={stop} disabled={!running}>Stop</Button>
        <Button variant="ghost" onClick={() => downloadText(`${tool.id}-sensor.txt`, lines.join('\n'))}>Export</Button>
      </div>
      <LogBox lines={lines} empty="Sensors stream here. Grant permission when prompted." />
    </div>
  )
}

function FilesPanel({ tool }: { tool: ToolDef }) {
  const [items, setItems] = useState<VaultItem[]>([])
  const [query, setQuery] = useState('')
  const [importText, setImportText] = useState('')

  const refresh = () => vaultList().then(setItems).catch(() => setItems([]))
  useEffect(() => { void refresh() }, [])

  const filtered = items.filter((i) => `${i.name} ${i.type} ${i.data}`.toLowerCase().includes(query.toLowerCase()))

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    await save(file.name, file.name.split('.').pop() ?? 'file', text, tool.id)
    await refresh()
  }

  return (
    <div className="stack">
      <Field label="Search vault" value={query} onChange={setQuery} placeholder="capture, payload, key…" />
      <div className="row">
        <label className="btn btn-soft" style={{ cursor: 'pointer' }}>
          Import file
          <input type="file" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
        </label>
        <Button variant="ghost" onClick={() => downloadText('vault-export.json', JSON.stringify(items, null, 2), 'application/json')}>Export all</Button>
      </div>
      <Field label="Paste payload / key file" value={importText} onChange={setImportText} mono rows={3} placeholder="DuckyScript, .ir, .sub, .nfc, .keys…" />
      <Button variant="soft" onClick={() => { if (importText.trim()) { void save('Pasted payload', 'payload', importText, tool.id).then(refresh) } }}>Save pasted payload</Button>
      <div className="stack">
        {filtered.map((item) => (
          <div key={item.id} className="card" style={{ padding: 12 }}>
            <div className="row-between">
              <strong>{item.name}</strong>
              <span className="caption">{item.type} • {new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <p className="mono" style={{ color: 'var(--text-2)', marginTop: 6 }}>{item.data.slice(0, 220)}</p>
            <div className="row" style={{ marginTop: 8 }}>
              <Button variant="ghost" onClick={() => downloadText(item.name.replace(/[^\w.-]+/g, '_') || 'vault-item.txt', item.data)}>Download</Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="caption">No vault items match.</p>}
      </div>
    </div>
  )
}

function GenericPanel({ tool }: { tool: ToolDef }) {
  const [cmd, setCmd] = useState(tool.actions[0] ?? 'PING')
  const [lines, setLines] = useState<string[]>([])
  const [status, setStatus] = useState(bridge.status)

  useEffect(() => bridge.subscribeStatus((s) => setStatus(s)), [])
  useEffect(() => bridge.subscribe((logs) => setLines(logs.map((l) => `${l.dir === 'tx' ? '>' : l.dir === 'rx' ? '<' : '#'} ${l.text}`))), [])

  const send = async () => {
    await bridge.send(cmd)
  }

  const quick = QUICK_COMMANDS.filter((q) => q.cmd.toLowerCase().includes(tool.id.split('')[0] ?? '') || tool.capability !== 'native')

  return (
    <div className="stack">
      <dl className="kv">
        <dt>Flipper parity</dt><dd>{tool.flipper}</dd>
        <dt>A53 capability</dt><dd>{tool.a53}</dd>
        <dt>Bridge</dt><dd>{status === 'connected' ? 'Connected — commands will transmit.' : 'Not connected — open ESP32 tab to connect, or use Sim mode.'}</dd>
      </dl>
      <div className="row">
        {tool.actions.map((a) => (
          <button key={a} className="chip" onClick={() => setCmd(a.toUpperCase())}>{a}</button>
        ))}
      </div>
      <Field label="ESP32 command" value={cmd} onChange={setCmd} mono />
      <div className="row">
        <Button onClick={() => void send()}>Send to bridge</Button>
        <Button variant="ghost" onClick={() => void save(`${tool.name} capture`, 'capture', `${tool.name}\n${cmd}\n${lines.join('\n')}`, tool.id)}>Save capture</Button>
      </div>
      {quick.length > 0 && (
        <div className="row">
          {quick.slice(0, 6).map((q) => (
            <button key={q.cmd} className="chip" onClick={() => setCmd(q.cmd)}>{q.label}</button>
          ))}
        </div>
      )}
      <LogBox lines={lines} empty="Bridge log will appear here." />
    </div>
  )
}
