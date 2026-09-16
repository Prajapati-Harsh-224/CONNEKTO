import { useLocale } from '../context/LocaleContext.jsx'

export default function FormField({ label, name, type = 'text', value, onChange, error, autoComplete, placeholder, onKeyDown, ...props }) {
  const { t } = useLocale()
  return (
    <label className="form-field">
      <span>{label || t(name)}</span>
      <input
        autoComplete={autoComplete}
        className={error ? 'input-error' : ''}
        name={name}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        type={type}
        value={value}
        {...props}
      />
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}
