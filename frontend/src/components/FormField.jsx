import { useLocale } from '../context/LocaleContext.jsx'

export default function FormField({ label, name, type = 'text', value, onChange, error, autoComplete, placeholder }) {
  const { t } = useLocale()
  return (
    <label className="form-field">
      <span>{label || t(name)}</span>
      <input
        autoComplete={autoComplete}
        className={error ? 'input-error' : ''}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}
