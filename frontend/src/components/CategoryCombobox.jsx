import { useState, useRef, useEffect } from 'react'
import { FiChevronDown, FiCheck } from 'react-icons/fi'

const DEFAULT_CATEGORIES = [
  'FMCG',
  'Grocery & Staples',
  'Beverages',
  'Personal Care',
  'Cleaning & Household',
  'Dairy & Bakery',
  'Snacks & Packaged Foods',
  'Local Manufacturers'
]

export default function CategoryCombobox({
  label = 'Category',
  name = 'category',
  value = '',
  onChange,
  error,
  placeholder = 'Select or search category...',
  options = DEFAULT_CATEGORIES
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes((value || '').toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    if (onChange) onChange(e)
    setIsOpen(true)
  }

  const handleSelectOption = (option) => {
    if (onChange) {
      onChange({ target: { name, value: option } })
    }
    setIsOpen(false)
  }

  return (
    <div className="form-field combobox-field" ref={containerRef} style={{ position: 'relative' }}>
      <label htmlFor={`combobox-${name}`} style={{ display: 'block' }}>
        <span>{label}</span>
      </label>
      <div className="combobox-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          autoComplete="off"
          className={error ? 'input-error' : ''}
          id={`combobox-${name}`}
          name={name}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{ width: '100%', paddingRight: '2.5rem' }}
          type="text"
          value={value}
        />
        <button
          aria-label="Toggle category dropdown"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            position: 'absolute',
            right: '0.75rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-muted, #64748b)'
          }}
          tabIndex={-1}
          type="button"
        >
          <FiChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {isOpen && (
        <ul
          className="combobox-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: '0.25rem',
            maxHeight: '200px',
            overflowY: 'auto',
            background: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '0.375rem 0',
            listStyle: 'none'
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = (value || '').trim().toLowerCase() === option.toLowerCase()
              return (
                <li
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f8fafc)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  style={{
                    padding: '0.5rem 0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                    backgroundColor: isSelected ? 'var(--bg-active, #f1f5f9)' : 'transparent',
                    fontWeight: isSelected ? '600' : '400'
                  }}
                >
                  <span>{option}</span>
                  {isSelected && <FiCheck style={{ color: 'var(--color-primary, #2563eb)' }} />}
                </li>
              )
            })
          ) : (
            <li
              style={{
                padding: '0.5rem 0.875rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted, #64748b)',
                fontStyle: 'italic'
              }}
            >
              Use custom category: "{value}"
            </li>
          )}
        </ul>
      )}
      {error && <small className="field-error" style={{ color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>{error}</small>}
    </div>
  )
}
