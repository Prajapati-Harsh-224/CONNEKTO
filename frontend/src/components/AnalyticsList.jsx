export default function AnalyticsList({ items, labelKey, valueKey, valueFormatter = (value) => value }) {
  const maximum = Math.max(...items.map((item) => item[valueKey]), 1)
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div className="space-y-1.5" key={item[labelKey]}>
          <div className="flex items-center justify-between text-xs">
            <strong className="text-slate-800 font-semibold truncate pr-2">{item[labelKey]}</strong>
            <span className="text-slate-500 shrink-0 font-medium">{valueFormatter(item[valueKey])}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-orange rounded-full transition-all duration-500"
              style={{ width: `${(item[valueKey] / maximum) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
