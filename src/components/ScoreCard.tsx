type Props = { label: string; value: number; tilt?: string }

export function ScoreCard({ label, value, tilt = '0deg' }: Props) {
  return (
    <div className="card min-w-[84px] px-3 py-1.5 text-center" style={{ rotate: tilt }}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">{label}</div>
      <div className="font-serif numerals text-2xl leading-tight text-ink" aria-live={label === 'Score' ? 'polite' : undefined}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}
