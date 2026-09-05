import { useLocale } from '../context/LocaleContext.jsx'

export default function QuantitySelector({ value, minimum, onChange, error }) {
  const { t } = useLocale()
  function decrease() {
    onChange(Math.max(minimum, value - 1))
  }

  function increase() {
    onChange(value + 1)
  }

  return <div className="quantity-field">
    <div className="quantity-control" aria-label={`${t('product')} ${t('quantity').toLowerCase()}`}>
      <button onClick={decrease} type="button" aria-label={`${t('quantity')} -`}>-</button>
      <input aria-label={t('quantity')} min={minimum} onChange={(event) => onChange(event.target.value)} type="number" value={value} />
      <button onClick={increase} type="button" aria-label={`${t('quantity')} +`}>+</button>
    </div>
    <span className={error ? 'field-error' : 'quantity-hint'}>{error || `${t('minimumQuantity')}: ${minimum}`}</span>
  </div>
}
