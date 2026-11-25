import SparkMD5 from 'spark-md5'

const enc = new TextEncoder()
const dec = new TextDecoder()

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return bytes as Uint8Array<ArrayBuffer>
}

export async function sha(algo: 'SHA-256' | 'SHA-384' | 'SHA-512', text: string): Promise<string> {
  const digest = await crypto.subtle.digest(algo, enc.encode(text))
  return toHex(digest)
}

export function md5(text: string): string {
  return SparkMD5.hash(text)
}

export async function hmacSha256(key: string, text: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(text))
  return toHex(sig)
}

export async function aesGcmEncrypt(password: string, text: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text))
  const payload = { v: 1, salt: btoa(String.fromCharCode(...salt)), iv: btoa(String.fromCharCode(...iv)), ct: toHex(ct) }
  return btoa(JSON.stringify(payload))
}

export async function aesGcmDecrypt(password: string, packed: string): Promise<string> {
  const payload = JSON.parse(atob(packed)) as { salt: string; iv: string; ct: string }
  const salt = Uint8Array.from(atob(payload.salt), (c) => c.charCodeAt(0))
  const iv = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0))
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, fromHex(payload.ct))
  return dec.decode(pt)
}

export function b64Encode(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
}

export function b64Decode(b64: string): string {
  return decodeURIComponent(escape(atob(b64.trim())))
}

export function hexEncode(text: string): string {
  return [...enc.encode(text)].map((b) => b.toString(16).padStart(2, '0')).join(' ')
}

export function hexDecode(hex: string): string {
  return dec.decode(fromHex(hex))
}

export function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': '/',
}
const MORSE_REV: Record<string, string> = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]))

export function toMorse(text: string): string {
  return text.toUpperCase().split('').map((c) => MORSE[c] ?? '·').join(' ')
}

export function fromMorse(morse: string): string {
  return morse.trim().split(/\s+/).map((code) => MORSE_REV[code] ?? '·').join('')
}

export function jwtDecode(token: string): string {
  const parts = token.trim().split('.')
  if (parts.length < 2) return 'Not a JWT (needs header.payload.signature)'
  const decodePart = (p: string) => {
    const b64 = p.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.stringify(JSON.parse(atob(b64)), null, 2)
  }
  return `HEADER:\n${decodePart(parts[0])}\n\nPAYLOAD:\n${decodePart(parts[1])}`
}

export function randomPassword(length = 16, symbols = true): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const syms = '!@#$%^&*()-_=+[]{}<>?'
  const pool = symbols ? chars + syms : chars
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return [...arr].map((n) => pool[n % pool.length]).join('')
}

export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Excellent']
  return { score: Math.min(score, 4), label: labels[Math.min(score, 4)] }
}
