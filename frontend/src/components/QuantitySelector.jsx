import { useLocale } from '../context/LocaleContext.jsx'

export default function QuantitySelector({ value, minimum, onChange, error, isBox = false }) {
  const { t } = useLocale()
  const numVal = Number(value) || minimum

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
    <div className="quantity-field">
      <div className="quantity-control" aria-label={`${t('product')} ${t('quantity').toLowerCase()}`}>
        <button disabled={numVal <= minimum} onClick={decrease} type="button" aria-label={`${t('quantity')} -`}>-</button>
        {isBox ? (
          <span className="quantity-box-text">
            {boxDisplay}
          </span>
        ) : (
          <input
            aria-label={t('quantity')}
            min={minimum}
            onChange={(event) => onChange(event.target.value)}
            type="number"
            value={value}
          />
        )}
        <button onClick={increase} type="button" aria-label={`${t('quantity')} +`}>+</button>
      </div>
      <span className={error ? 'field-error' : 'quantity-hint'}>
        {error || `${isBox ? 'Min. order' : t('minimumQuantity')}: ${minDisplay}`}
      </span>
    </div>
  )
}

