import { useEffect, useState } from 'react'
import { vaultClear, vaultDelete, vaultExportJson, vaultImportJson, vaultList, downloadText, type VaultItem } from '../lib/vault'
import { Button, EmptyState, Field, SectionTitle } from '../components/ui'

export function Vault() {
  const [items, setItems] = useState<VaultItem[]>([])
  const [query, setQuery] = useState('')
  const [importText, setImportText] = useState('')
  const [msg, setMsg] = useState('')

  const refresh = () => vaultList().then(setItems).catch(() => setItems([]))
  useEffect(() => { void refresh() }, [])

  const filtered = items.filter((i) => `${i.name} ${i.type} ${i.data}`.toLowerCase().includes(query.toLowerCase()))

  const doImport = async () => {
    try {
      const n = await vaultImportJson(importText)
      setMsg(`Imported ${n} item(s).`)
      setImportText('')
      await refresh()
    } catch (e) {
      setMsg(`Import failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div className="stack">
      <SectionTitle title="Vault" sub="On-device storage (IndexedDB with localStorage fallback). Captures, payloads, keys and reports." />
      <Field label="Search vault" value={query} onChange={setQuery} placeholder="name, type or content…" />
      <div className="row">
        <Button onClick={() => downloadText('flipper-lab-vault.json', vaultExportJson(items), 'application/json')}>Export JSON</Button>
        <Button variant="soft" onClick={() => void doImport()} disabled={!importText.trim()}>Import JSON</Button>
        <Button variant="danger" onClick={() => { void vaultClear().then(refresh) }} disabled={items.length === 0}>Clear vault</Button>
      </div>
      <Field label="Import JSON" value={importText} onChange={setImportText} mono rows={4} placeholder='{"items":[{"name":"…","type":"capture","data":"…"}]}' />
      {msg && <p className="caption">{msg}</p>}

      {filtered.length === 0 ? (
        <EmptyState icon="💾" title="Nothing here yet" sub="Save something from a tool, or import a vault JSON." />
      ) : (
        <div className="grid grid-2">
          {filtered.map((item) => (
            <div key={item.id} className="card">
              <div className="row-between">
                <strong>{item.name}</strong>
                <span className="caption">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <div className="row" style={{ marginTop: 6 }}>
                <span className="badge">{item.type}</span>
                {item.toolId && <span className="badge">{item.toolId}</span>}
              </div>
              <p className="mono" style={{ color: 'var(--text-2)', marginTop: 8 }}>{item.data.slice(0, 300)}</p>
              <div className="row" style={{ marginTop: 10 }}>
                <Button variant="ghost" onClick={() => downloadText(item.name.replace(/[^\w.-]+/g, '_') || 'vault-item.txt', item.data)}>Download</Button>
                <Button variant="danger" onClick={() => { void vaultDelete(item.id).then(refresh) }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
