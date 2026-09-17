export default function BarChart({ items, valueKey = 'value', labelKey = 'label', valueFormatter = (value) => value }) {
  const maximum = Math.max(...items.map((item) => item[valueKey]), 1)
  return (
    <div className="flex items-end justify-between gap-2 h-44 pt-4 px-2">
      {items.map((item) => {
        const heightPct = Math.round((item[valueKey] / maximum) * 100)
        return (
          <div className="flex-1 flex flex-col items-center gap-1.5 h-full group" key={item[labelKey]}>
            <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              {valueFormatter(item[valueKey])}
            </span>
            <div className="flex-1 w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end">
              <div
                className="w-full bg-brand-orange hover:bg-orange-600 rounded-t-lg transition-all duration-300"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-slate-600 truncate max-w-full text-center">
              {item[labelKey]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
