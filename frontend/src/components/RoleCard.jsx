export default function RoleCard({ role, selected, onSelect }) {
  const toneColors = {
    orange: {
      border: 'border-slate-200 hover:border-brand-orange/60',
      activeRing: 'ring-2 ring-brand-orange border-brand-orange shadow-lg shadow-orange-500/10 bg-gradient-to-b from-orange-50/20 to-white',
      badge: 'text-brand-orange bg-brand-orange-light border border-brand-orange/20',
      radioActive: 'border-brand-orange bg-brand-orange text-white',
      check: 'text-brand-orange',
      accent: 'bg-brand-orange',
    },
    green: {
      border: 'border-slate-200 hover:border-emerald-500/60',
      activeRing: 'ring-2 ring-emerald-600 border-emerald-600 shadow-lg shadow-emerald-500/10 bg-gradient-to-b from-emerald-50/20 to-white',
      badge: 'text-emerald-800 bg-emerald-50 border border-emerald-200',
      radioActive: 'border-emerald-600 bg-emerald-600 text-white',
      check: 'text-emerald-700',
      accent: 'bg-emerald-600',
    },
    purple: {
      border: 'border-slate-200 hover:border-purple-500/60',
      activeRing: 'ring-2 ring-purple-600 border-purple-600 shadow-lg shadow-purple-500/10 bg-gradient-to-b from-purple-50/20 to-white',
      badge: 'text-purple-800 bg-purple-50 border border-purple-200',
      radioActive: 'border-purple-600 bg-purple-600 text-white',
      check: 'text-purple-700',
      accent: 'bg-purple-600',
    },
  }

  const tone = toneColors[role.tone] || toneColors.orange

  return (
    <button
      className={`group w-full text-left rounded-2xl overflow-hidden border transition-all duration-200 p-3.5 sm:p-4 lg:p-4.5 xl:p-5 bg-white shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between h-full ${
        selected
          ? `${tone.activeRing} -translate-y-0.5`
          : `${tone.border} hover:-translate-y-0.5`
      }`}
      onClick={() => onSelect(role.value)}
      type="button"
      aria-pressed={selected}
    >
      {/* Image Container with Badges */}
      <div className="w-full rounded-xl overflow-hidden aspect-[16/10] lg:h-38 xl:h-44 relative bg-slate-100 shrink-0">
        <img
          src={role.image}
          alt={role.imageAlt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Role Type Pill on top-left */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tone.badge} shadow-xs backdrop-blur-xs`}>
            {role.value === 'SHOP_OWNER' ? 'Retail' : 'Wholesale'}
          </span>
        </div>
        {/* Selected indicator on top-right */}
        {selected && (
          <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1.5 border border-slate-100">
            <span className={`w-2 h-2 rounded-full ${tone.accent}`} />
            <span>Selected</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 justify-between pt-3 sm:pt-3.5 w-full">
        <div>
          <strong className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 font-serif block">
            {role.title}
          </strong>
          <p className="text-xs sm:text-[13px] text-slate-500 leading-snug mt-1">
            {role.description}
          </p>
        </div>

        {/* Benefits List */}
        <div className="space-y-1.5 sm:space-y-2 pt-2.5 sm:pt-3 border-t border-slate-100 mt-2.5 sm:mt-3">
          {role.benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700">
              <span className={`shrink-0 font-bold ${tone.check}`} aria-hidden="true">✓</span>
              <span className="leading-snug">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Bottom Selection Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs">
          <span className={selected ? 'font-semibold text-slate-800' : 'text-slate-400 font-medium'}>
            {selected ? 'Role selected' : 'Click to select'}
          </span>
          <span
            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold transition-all ${
              selected
                ? tone.radioActive
                : 'border-slate-300 bg-slate-50 text-transparent group-hover:border-slate-400'
            }`}
          >
            ✓
          </span>
        </div>
      </div>
    </button>
  )
}
