import { useLocale } from '../context/LocaleContext.jsx'

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  onKeyDown,
  options,
  children,
  ...props
}) {
  const { t } = useLocale()
  const isSelect = type === 'select' || Boolean(options) || Boolean(children)

  return (
    <label className="form-field flex flex-col gap-1 text-left w-full">
      <span className="text-xs font-semibold text-slate-700">{label || t(name)}</span>
      {isSelect ? (
        <select
          aria-label={label || t(name)}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors duration-150 outline-none appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1em_1em] ${
            error
              ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
              : 'border-slate-200 bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
          }`}
          name={name}
          onChange={onChange}
          value={value ?? ''}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => {
                const optVal = typeof opt === 'object' && opt !== null ? opt.value : opt
                const optLabel = typeof opt === 'object' && opt !== null ? opt.label : opt
                return (
                  <option key={optVal} value={optVal}>
                    {optLabel}
                  </option>
                )
              })
            : children}
        </select>
      ) : (
        <input
          autoComplete={autoComplete}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors duration-150 outline-none ${
            error
              ? 'border-rose-300 bg-rose-50/40 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
              : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
          }`}
          name={name}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          type={type}
          value={value}
          {...props}
        />
      )}
      {error && <small className="text-[11px] font-medium text-rose-600 mt-0.5">{error}</small>}
    </label>
  )
}
