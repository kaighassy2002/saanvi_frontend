import React from 'react'

/** Split "Main message — call to action" for two-tone strip layout. */
function ServiceBarStripContent({ text }) {
  const normalized = String(text || '').trim()
  if (!normalized) return null

  const parts = normalized.split(/\s*[—–]\s*|\s+-\s+/)
  if (parts.length >= 2) {
    const lead = parts[0].trim()
    const accent = parts.slice(1).join(' — ').trim()
    return (
      <p className="jewelsium-services__strip-inner">
        <span className="jewelsium-services__strip-lead">{lead}</span>
        <span className="jewelsium-services__strip-separator" aria-hidden>
          ·
        </span>
        <span className="jewelsium-services__strip-accent">{accent}</span>
      </p>
    )
  }

  return <p className="jewelsium-services__strip-inner">{normalized}</p>
}

export default function ServiceBarStrip({ text }) {
  if (!String(text || '').trim()) return null

  return (
    <div className="jewelsium-services__strip" role="note">
      <div className="jewelsium-services__strip-glow" aria-hidden />
      <ServiceBarStripContent text={text} />
    </div>
  )
}
