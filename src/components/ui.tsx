import type { ReactNode } from 'react'
import { CAP_COLOR, CAP_LABEL, type Capability } from '../data/tools'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export function CapBadge({ capability }: { capability: Capability }) {
  return (
    <span className="badge" style={{ borderColor: CAP_COLOR[capability], color: CAP_COLOR[capability] }}>
      {CAP_LABEL[capability]}
    </span>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'soft'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button type={type} className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
  rows,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  rows?: number
  type?: string
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {rows ? (
        <textarea className={mono ? 'input mono' : 'input'} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input className={mono ? 'input mono' : 'input'} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </label>
  )
}

export function LogBox({ lines, empty = 'No output yet.' }: { lines: string[]; empty?: string }) {
  return (
    <div className="logbox mono">
      {lines.length === 0 ? <div className="log-empty">{empty}</div> : lines.map((l, i) => <div key={i} className="log-line">{l}</div>)}
    </div>
  )
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="section-head">
      <h2 className="h2">{title}</h2>
      {sub ? <p className="caption">{sub}</p> : null}
    </div>
  )
}

export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub ? <div className="caption">{sub}</div> : null}
    </div>
  )
}

export function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="stat">
      <div className="stat-value" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="caption">{label}</div>
    </div>
  )
}
