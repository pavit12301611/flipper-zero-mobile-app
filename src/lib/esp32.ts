export type BridgeMode = 'serial' | 'websocket' | 'sim'
export type BridgeStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface BridgeLog {
  id: number
  dir: 'tx' | 'rx' | 'sys'
  text: string
  at: number
}

type Listener = (logs: BridgeLog[]) => void
type StatusListener = (status: BridgeStatus, mode: BridgeMode) => void

let logSeq = 0

class Esp32Bridge {
  status: BridgeStatus = 'disconnected'
  mode: BridgeMode = 'sim'
  logs: BridgeLog[] = []
  private listeners = new Set<Listener>()
  private statusListeners = new Set<StatusListener>()
  private port: SerialPort | null = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private ws: WebSocket | null = null
  private simTimer: number | null = null

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  subscribeStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn)
    return () => this.statusListeners.delete(fn)
  }

  private emit() {
    const copy = [...this.logs].slice(-300)
    this.listeners.forEach((fn) => fn(copy))
  }

  private setStatus(status: BridgeStatus) {
    this.status = status
    this.statusListeners.forEach((fn) => fn(status, this.mode))
  }

  log(dir: BridgeLog['dir'], text: string) {
    this.logs.push({ id: ++logSeq, dir, text, at: Date.now() })
    if (this.logs.length > 500) this.logs = this.logs.slice(-500)
    this.emit()
  }

  clearLogs() {
    this.logs = []
    this.emit()
  }

  isSerialSupported(): boolean {
    return 'serial' in navigator
  }

  async connectSerial(baud = 115200): Promise<void> {
    if (!this.isSerialSupported()) throw new Error('Web Serial is not available in this browser. Use Chrome on Android with USB OTG, or use WebSocket / Sim mode.')
    this.mode = 'serial'
    this.setStatus('connecting')
    this.log('sys', `Opening serial port @ ${baud} baud…`)
    this.port = await navigator.serial.requestPort()
    await this.port.open({ baudRate: baud })
    this.writer = this.port.writable?.getWriter() ?? null
    this.reader = this.port.readable?.getReader() ?? null
    this.setStatus('connected')
    this.log('sys', 'Serial connected. ESP32 bridge ready.')
    void this.readLoop()
  }

  private async readLoop() {
    if (!this.reader) return
    const decoder = new TextDecoder()
    try {
      for (;;) {
        const { value, done } = await this.reader.read()
        if (done) break
        if (value) this.log('rx', decoder.decode(value))
      }
    } catch {
      // port closed
    }
  }

  async connectWebSocket(url: string): Promise<void> {
    this.mode = 'websocket'
    this.setStatus('connecting')
    this.log('sys', `Connecting WebSocket → ${url}`)
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      this.ws = ws
      ws.onopen = () => {
        this.setStatus('connected')
        this.log('sys', 'WebSocket connected.')
        resolve()
      }
      ws.onmessage = (ev) => this.log('rx', String(ev.data))
      ws.onerror = () => {
        this.setStatus('error')
        this.log('sys', 'WebSocket error. Check ESP32 IP and that the bridge is on the same network.')
        reject(new Error('WebSocket connection failed'))
      }
      ws.onclose = () => {
        if (this.status === 'connected') this.log('sys', 'WebSocket closed.')
        this.setStatus('disconnected')
      }
    })
  }

  connectSim(): void {
    this.mode = 'sim'
    this.setStatus('connected')
    this.log('sys', 'Simulated bridge connected. Commands are echoed locally — no hardware required.')
    this.log('rx', '[sim] ESP32 bridge ready. Send HELP for command list.')
    if (this.simTimer) window.clearInterval(this.simTimer)
    this.simTimer = window.setInterval(() => {
      if (this.status !== 'connected') return
      const tips = [
        '[sim] heartbeat ok',
        '[sim] CC1101 ready @ 433.92 MHz',
        '[sim] IR LED ready (GPIO4)',
        '[sim] PN532 ready (I2C 0x24)',
        '[sim] WiFi radio ready (monitor mode capable)',
      ]
      this.log('rx', tips[Math.floor(Math.random() * tips.length)])
    }, 9000)
  }

  async send(text: string): Promise<void> {
    const line = text.trim()
    if (!line) return
    this.log('tx', line)
    if (this.status !== 'connected') {
      this.log('sys', 'Not connected — command queued in log only. Connect the bridge first.')
      return
    }
    if (this.mode === 'serial' && this.writer) {
      await this.writer.write(new TextEncoder().encode(`${line}\n`))
    } else if (this.mode === 'websocket' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(line)
    } else if (this.mode === 'sim') {
      this.log('rx', `[sim] ack: ${line}`)
      if (/^HELP/i.test(line)) {
        this.log('rx', '[sim] commands: HELP, PING, SUBGHZ SCAN, IR TX <proto> <code>, RFID READ, WIFI SCAN, BLE SCAN, GPIO SET <pin> <0|1>, I2C SCAN, CC1101 TX <hex>, BADUSB RUN <name>')
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.simTimer) window.clearInterval(this.simTimer)
    this.simTimer = null
    try {
      this.ws?.close()
    } catch { /* noop */ }
    this.ws = null
    try {
      await this.reader?.cancel()
    } catch { /* noop */ }
    try {
      this.reader?.releaseLock()
    } catch { /* noop */ }
    try {
      this.writer?.releaseLock()
    } catch { /* noop */ }
    try {
      await this.port?.close()
    } catch { /* noop */ }
    this.reader = null
    this.writer = null
    this.port = null
    this.setStatus('disconnected')
    this.log('sys', 'Disconnected.')
  }
}

export const bridge = new Esp32Bridge()

export const QUICK_COMMANDS: { label: string; cmd: string }[] = [
  { label: 'Ping', cmd: 'PING' },
  { label: 'Help', cmd: 'HELP' },
  { label: 'Sub-GHz scan', cmd: 'SUBGHZ SCAN' },
  { label: 'WiFi scan', cmd: 'WIFI SCAN' },
  { label: 'BLE scan', cmd: 'BLE SCAN' },
  { label: 'RFID read', cmd: 'RFID READ' },
  { label: 'NFC read', cmd: 'NFC READ' },
  { label: 'IR test TX', cmd: 'IR TX NEC 0x20DF10EF' },
  { label: 'I2C scan', cmd: 'I2C SCAN' },
  { label: 'GPIO test', cmd: 'GPIO SET 2 1' },
  { label: 'CC1101 TX', cmd: 'CC1101 TX DEADBEEF' },
  { label: 'BadUSB list', cmd: 'BADUSB LIST' },
]
