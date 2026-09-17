export default function RoleCard({ role, selected, onSelect }) {
  const toneColors = {
    orange: {
      border: 'border-orange-200 hover:border-orange-300',
      activeRing: 'ring-2 ring-orange-500 border-orange-500 shadow-orange-100/70',
      badge: 'text-orange-600 bg-orange-50',
      check: 'text-orange-500',
    },
    green: {
      border: 'border-emerald-200 hover:border-emerald-300',
      activeRing: 'ring-2 ring-emerald-600 border-emerald-600 shadow-emerald-100/70',
      badge: 'text-emerald-700 bg-emerald-50',
      check: 'text-emerald-600',
    },
    purple: {
      border: 'border-purple-200 hover:border-purple-300',
      activeRing: 'ring-2 ring-purple-600 border-purple-600 shadow-purple-100/70',
      badge: 'text-purple-700 bg-purple-50',
      check: 'text-purple-600',
    },
  }

  const tone = toneColors[role.tone] || toneColors.orange

  return (
    <button
      className={`group w-full text-left rounded-2xl overflow-hidden border transition-all duration-200 p-3.5 sm:p-4 bg-white shadow-sm hover:shadow-md cursor-pointer flex flex-col ${
        selected
          ? `${tone.activeRing} shadow-lg -translate-y-0.5`
          : `${tone.border} hover:-translate-y-0.5`
      }`}
      onClick={() => onSelect(role.value)}
      type="button"
      aria-pressed={selected}
    >
      <div className="w-full rounded-xl overflow-hidden aspect-[3/2] relative bg-slate-100 shrink-0">
        <img
          src={role.image}
          alt={role.imageAlt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col flex-1 pt-3">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <strong className="text-base sm:text-lg font-bold text-slate-900 font-serif">
            {role.title}
          </strong>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tone.badge}`}>
            {role.value.replace('_', ' ')}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed min-h-[2.4rem] mb-3">
          {role.description}
        </p>

        <div className="space-y-1.5 pt-2 border-t border-slate-100 mt-auto">
          {role.benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2 text-xs text-slate-700">
              <span className={`shrink-0 font-bold ${tone.check}`} aria-hidden="true">✓</span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  )
}
