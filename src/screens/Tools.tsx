import { useMemo, useState } from 'react'
import { CATEGORIES, TOOLS, type Category, type ToolDef } from '../data/tools'
import { CapBadge, EmptyState, Field, SectionTitle } from '../components/ui'
import { ToolPanel } from '../components/ToolPanels'

export function Tools({ selected, onSelect }: { selected: ToolDef | null; onSelect: (tool: ToolDef | null) => void }) {
  const [category, setCategory] = useState<'All' | Category>('All')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return TOOLS.filter((t) => {
      const inCat = category === 'All' || t.category === category
      const q = query.trim().toLowerCase()
      const inQuery = !q || `${t.name} ${t.desc} ${t.category} ${t.flipper}`.toLowerCase().includes(q)
      return inCat && inQuery
    })
  }, [category, query])

  return (
    <div className="stack">
      <SectionTitle title="Tool grid" sub={`${filtered.length} of ${TOOLS.length} tools. Tap a card to open its panel.`} />
      <Field label="Search tools" value={query} onChange={setQuery} placeholder="Sub-GHz, NFC, hash, WiFi…" />
      <div className="chips">
        <button className={`chip ${category === 'All' ? 'active' : ''}`} onClick={() => setCategory('All')}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No tools match" sub="Try a different search or category." />
      ) : (
        <div className="grid grid-3">
          {filtered.map((tool) => (
            <button key={tool.id} className="card tool-card" onClick={() => onSelect(tool)}>
              <div className="tool-top">
                <div className="tool-icon">{tool.icon}</div>
                <CapBadge capability={tool.capability} />
              </div>
              <div className="tool-name" style={{ marginTop: 10 }}>{tool.name}</div>
              <div className="tool-desc">{tool.desc}</div>
              <div className="tool-meta">
                <span className="badge">{tool.category}</span>
                <span className="badge">Flipper: {tool.flipper}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => onSelect(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="row">
                  <div className="tool-icon">{selected.icon}</div>
                  <div>
                    <h2 className="h2">{selected.name}</h2>
                    <div className="caption">{selected.category} • Flipper parity: {selected.flipper}</div>
                  </div>
                </div>
                <div className="row" style={{ marginTop: 8 }}>
                  <CapBadge capability={selected.capability} />
                  <span className="caption">{selected.a53}</span>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => onSelect(null)}>✕</button>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>{selected.desc}</p>
            <ToolPanel tool={selected} />
          </div>
        </div>
      )}
    </div>
  )
}
