import { BaseEmail } from './Base'

interface Props {
  title: string
  intro?: string
  rows?: [string, string | null | undefined][]
  body?: string
  ctaText?: string
  ctaHref?: string
  note?: string
}

/** Generic branded notification — heading, optional intro, key/value rows + CTA. */
export function NotificationEmail({ title, intro, rows, body, ctaText, ctaHref, note }: Props) {
  const filled = (rows ?? []).filter(([, v]) => v != null && String(v).trim() !== '')
  return (
    <BaseEmail preview={title}>
      <h2>{title}</h2>
      {intro && <p>{intro}</p>}
      {body && <p style={{ whiteSpace: 'pre-line' }}>{body}</p>}
      {filled.length > 0 && (
        <div className="card-box">
          {filled.map(([k, v], i) => (
            <div key={i} style={{ marginTop: i ? 10 : 0 }}>
              <span className="label">{k}</span>
              <div className="value" style={{ fontWeight: 600 }}>{String(v)}</div>
            </div>
          ))}
        </div>
      )}
      {ctaText && ctaHref && (
        <p style={{ marginTop: 22 }}><a href={ctaHref} className="btn-dark">{ctaText}</a></p>
      )}
      {note && <p className="muted">{note}</p>}
    </BaseEmail>
  )
}
