export interface DohRecord {
  name: string
  type: number
  TTL: number
  data: string
}

export async function dohLookup(name: string, type = 'A'): Promise<DohRecord[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`
  const res = await fetch(url, { headers: { Accept: 'application/dns-json' } })
  if (!res.ok) throw new Error(`DoH request failed (${res.status})`)
  const json = (await res.json()) as { Answer?: DohRecord[] }
  return json.Answer ?? []
}

export async function httpPing(target: string): Promise<{ ms: number; status: number; url: string }> {
  const url = target.startsWith('http') ? target : `https://${target}`
  const start = performance.now()
  const res = await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
  return { ms: Math.round(performance.now() - start), status: res.status, url }
}

export interface HttpInfo {
  url: string
  status: number
  finalUrl: string
  headers: Record<string, string>
  timingMs: number
  note: string
}

export async function httpInspect(target: string): Promise<HttpInfo> {
  const url = target.startsWith('http') ? target : `https://${target}`
  const start = performance.now()
  const res = await fetch(url, { method: 'GET', redirect: 'follow' })
  const headers: Record<string, string> = {}
  res.headers.forEach((v, k) => {
    headers[k] = v
  })
  return {
    url,
    status: res.status,
    finalUrl: res.url,
    headers,
    timingMs: Math.round(performance.now() - start),
    note: 'Browser fetch exposes status + headers. TLS cert details need the native bridge or ESP32.',
  }
}

export interface PortResult {
  host: string
  port: number
  open: boolean
  banner: string
}

const COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 3306, 3389, 5432, 8080, 8443]

export async function portScan(host: string, ports = COMMON_PORTS): Promise<PortResult[]> {
  const results: PortResult[] = []
  for (const port of ports) {
    const scheme = port === 443 || port === 8443 ? 'https' : 'http'
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    try {
      const res = await fetch(`${scheme}://${host}:${port}/`, { method: 'GET', mode: 'no-cors', signal: controller.signal, cache: 'no-store' })
      results.push({ host, port, open: true, banner: `HTTP reachable (status ${res.status || 'opaque'})` })
    } catch {
      results.push({ host, port, open: false, banner: 'no HTTP response (filtered/closed or browser-blocked)' })
    } finally {
      clearTimeout(timer)
    }
  }
  return results
}

export function expandCidr(cidr: string): string[] {
  const [base, prefixStr] = cidr.split('/')
  const prefix = parseInt(prefixStr ?? '24', 10)
  const parts = base.split('.').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) return []
  const ip = ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
  const hostBits = 32 - prefix
  if (hostBits < 0 || hostBits > 16) return []
  const count = Math.min(2 ** hostBits, 256)
  const mask = hostBits === 32 ? 0 : (~((1 << hostBits) - 1)) >>> 0
  const network = (ip & mask) >>> 0
  const out: string[] = []
  for (let i = 1; i < count - 1 && out.length < 254; i++) {
    const n = (network + i) >>> 0
    out.push(`${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`)
  }
  return out
}

export async function subnetSweep(cidr: string, onHost?: (ip: string, alive: boolean) => void): Promise<string[]> {
  const hosts = expandCidr(cidr)
  const alive: string[] = []
  await Promise.all(
    hosts.map(async (ip) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 1500)
      try {
        await fetch(`http://${ip}/`, { method: 'GET', mode: 'no-cors', signal: controller.signal, cache: 'no-store' })
        alive.push(ip)
        onHost?.(ip, true)
      } catch {
        onHost?.(ip, false)
      } finally {
        clearTimeout(timer)
      }
    }),
  )
  return alive.sort()
}

export async function ipInfo(ip: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`)
  if (!res.ok) throw new Error(`ipapi failed (${res.status})`)
  return (await res.json()) as Record<string, unknown>
}
