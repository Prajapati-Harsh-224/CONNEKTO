import { useState } from 'react'
import FormField from './FormField.jsx'
import { useLocale } from '../context/LocaleContext.jsx'

export default function PasswordField({ value, onChange, error, name = 'password', label, placeholder, autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false)
  const { t } = useLocale()
  const resolvedLabel = label || t('password')

  return (
    <div className="password-field-wrap">
      <FormField
        autoComplete={autoComplete}
        error={error}
        label={resolvedLabel}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={visible ? 'text' : 'password'}
        value={value}
      />
      <button className="password-toggle" onClick={() => setVisible((isVisible) => !isVisible)} type="button" aria-label={visible ? t('hide') : t('show')}>
        {visible ? t('hide') : t('show')}
      </button>
    </div>
  )
}
