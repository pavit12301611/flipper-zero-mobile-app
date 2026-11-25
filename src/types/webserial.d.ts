/**
 * Minimal Web Serial API type declarations (not yet in the default lib.dom).
 * Covers the surface used by src/lib/esp32.ts.
 */
interface SerialPortRequestOptions {
  /** DTR signal on open. */
  dataTerminalReady?: boolean
  /** RTS signal on open. */
  requestToSend?: boolean
}

interface SerialPort {
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
  open(options: SerialPortRequestOptions & { baudRate: number }): Promise<void>
  close(): Promise<void>
  drain(): Promise<void>
  getInfo(): { usbVendorId?: number; usbProductId?: number }
}

interface Serial {
  getPorts(): Promise<SerialPort[]>
  requestPort(): Promise<SerialPort>
}

interface Navigator {
  readonly serial: Serial
}

interface Window {
  SerialPort: unknown
}
