import { useLocale } from '../context/LocaleContext.jsx'

export default function QuantitySelector({ value, minimum = 1, onChange, error, isBox = true }) {
  const { t } = useLocale()
  const numVal = Math.max(minimum, Number(value) || minimum)

  function decrease() {
    onChange(Math.max(minimum, numVal - 1))
  }

  function increase() {
    onChange(numVal + 1)
  }

  const boxDisplay = `${numVal} ${numVal === 1 ? 'Box' : 'Boxes'}`
  const minDisplay = isBox
    ? `${minimum} ${minimum === 1 ? 'Box' : 'Boxes'}`
    : minimum

  return (
    <div className="space-y-1.5">
      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label={`${t('product')} ${t('quantity').toLowerCase()}`}>
        <button 
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-slate-800 font-bold text-lg shadow-xs hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
          disabled={numVal <= minimum} 
          onClick={decrease} 
          type="button" 
          aria-label={`${t('quantity')} -`}
        >
          −
        </button>
        {isBox ? (
          <span className="px-4 text-xs sm:text-sm font-bold text-slate-900 text-center min-w-[80px]">
            {boxDisplay}
          </span>
        ) : (
          <input
            aria-label={t('quantity')}
            className="w-16 text-center bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden"
            min={minimum}
            onChange={(event) => onChange(event.target.value)}
            type="number"
            value={value}
          />
        )}
        <button 
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-slate-800 font-bold text-lg shadow-xs hover:bg-slate-100 transition-colors cursor-pointer"
          onClick={increase} 
          type="button" 
          aria-label={`${t('quantity')} +`}
        >
          +
        </button>
      </div>
      <span className={`block text-xs font-medium ${error ? 'text-rose-600' : 'text-slate-400'}`}>
        {error || `Min. order: ${minDisplay}`}
      </span>
    </div>
  )
}


