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
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-xs font-semibold text-slate-700" htmlFor={`combobox-${name}`}>
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          autoComplete="off"
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
            error
              ? 'border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:ring-brand-orange/20 focus:border-brand-orange'
          }`}
          id={`combobox-${name}`}
          name={name}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        <button
          aria-label="Toggle category dropdown"
          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => setIsOpen((prev) => !prev)}
          tabIndex={-1}
          type="button"
        >
          <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <ul
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg list-none"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = (value || '').trim().toLowerCase() === option.toLowerCase()
              return (
                <li
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-orange-50 text-brand-orange font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{option}</span>
                  {isSelected && <FiCheck className="w-4 h-4 text-brand-orange" />}
                </li>
              )
            })
          ) : (
            <li className="px-3 py-2 text-xs text-slate-500 italic">
              Use custom category: &quot;{value}&quot;
            </li>
          )}
        </ul>
      )}
      {error && <small className="text-xs text-rose-500 font-medium">{error}</small>}
    </div>
  )
}
