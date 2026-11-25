export interface VaultItem {
  id: string
  name: string
  type: string
  data: string
  toolId?: string
  createdAt: number
}

const DB_NAME = 'flipper-lab-vault'
const STORE = 'items'
const LS_KEY = 'flipper-lab-vault-items'

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function lsRead(): VaultItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as VaultItem[]) : []
  } catch {
    return []
  }
}

function lsWrite(items: VaultItem[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  } catch {
    // storage full or unavailable — vault still works in-memory for the session
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function vaultList(): Promise<VaultItem[]> {
  try {
    const db = await openDb()
    const items = await new Promise<VaultItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).getAll()
      req.onsuccess = () => resolve((req.result as VaultItem[]) ?? [])
      req.onerror = () => reject(req.error)
    })
    db.close()
    return items.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return lsRead().sort((a, b) => b.createdAt - a.createdAt)
  }
}

export async function vaultAdd(item: Omit<VaultItem, 'id' | 'createdAt'>): Promise<VaultItem> {
  const full: VaultItem = { ...item, id: uid(), createdAt: Date.now() }
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(full)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    const items = lsRead()
    items.push(full)
    lsWrite(items)
  }
  return full
}

export async function vaultDelete(id: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    lsWrite(lsRead().filter((i) => i.id !== id))
  }
}

export async function vaultClear(): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    lsWrite([])
  }
}

export function vaultExportJson(items: VaultItem[]): string {
  return JSON.stringify({ app: 'flipper-lab-a53', version: 1, exportedAt: new Date().toISOString(), items }, null, 2)
}

export async function vaultImportJson(text: string): Promise<number> {
  const parsed = JSON.parse(text) as { items?: VaultItem[] } | VaultItem[]
  const items = Array.isArray(parsed) ? parsed : parsed.items ?? []
  let count = 0
  for (const it of items) {
    if (it && typeof it.name === 'string' && typeof it.data === 'string') {
      await vaultAdd({ name: it.name, type: it.type ?? 'capture', data: it.data, toolId: it.toolId })
      count++
    }
  }
  return count
}

export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
