type Props = {
  title: string
  body: string
  primary: { label: string; onClick: () => void }
  secondary?: { label: string; onClick: () => void }
}

export function Overlay({ title, body, primary, secondary }: Props) {
  return (
    <div className="veil" role="dialog" aria-modal="false" aria-labelledby="overlay-title">
      <div className="card mx-4 max-w-[300px] px-5 py-5 text-center" style={{ rotate: '-1.2deg' }}>
        <h2 id="overlay-title" className="font-serif numerals text-3xl leading-none text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">{body}</p>
        <div className="mt-4 flex justify-center gap-2">
          {secondary && (
            <button type="button" className="btn" onClick={secondary.onClick}>
              {secondary.label}
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={primary.onClick} autoFocus>
            {primary.label}
          </button>
        </div>
      </div>
    </div>
  )
}
