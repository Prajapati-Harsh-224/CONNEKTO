import { useState, useMemo, useEffect } from 'react'
import { useLocale } from '../context/LocaleContext.jsx'
import ProductImage from './ProductImage.jsx'
import FormField from './FormField.jsx'

const STANDARD_CATEGORIES = [
  'FMCG',
  'Grocery & Staples',
  'Snacks & Biscuits',
  'Snacks & Packaged Foods',
  'Beverages',
  'Cooking Essentials',
  'Packaged Foods',
  'Dairy & Bakery',
  'Personal Care',
  'Cleaning & Household',
  'Local Manufacturers',
  'General'
]

const CUSTOM_VALUE = '__custom_category__'

export default function ProductManagementForm({
  form,
  errors,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  categories = []
}) {
  const { t } = useLocale()
  const [isCustomMode, setIsCustomMode] = useState(false)

  // Reset custom mode if switching product/form
  useEffect(() => {
    setIsCustomMode(false)
  }, [form.name, form.brand])

  const categoryOptions = useMemo(() => {
    const list = [...STANDARD_CATEGORIES]
    if (Array.isArray(categories)) {
      categories.forEach((cat) => {
        if (cat && !list.includes(cat)) {
          list.push(cat)
        }
      })
    }
    if (form.category && form.category.trim() && !list.includes(form.category.trim())) {
      list.push(form.category.trim())
    }
    return list
  }, [categories, form.category])

  const handleCategorySelectChange = (event) => {
    const val = event.target.value
    if (val === CUSTOM_VALUE) {
      setIsCustomMode(true)
      onChange({ target: { name: 'category', value: '' } })
    } else {
      onChange(event)
    }
  }

  const handleSwitchToDropdown = () => {
    setIsCustomMode(false)
    onChange({ target: { name: 'category', value: STANDARD_CATEGORIES[0] } })
  }

  return (
    <form className="space-y-6" noValidate onSubmit={onSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('preview') || 'Preview'}</span>
            {form.imageUrl && form.imageUrl.trim() ? (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                {t('livePreview') || 'Live Preview'}
              </span>
            ) : null}
          </div>
          <div className="w-36 h-36 rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white flex items-center justify-center">
            <ProductImage
              alt={form.name || 'Product preview'}
              className="w-full h-full object-cover"
              fallbackText={(form.name || 'P').slice(0, 1).toUpperCase()}
              src={form.imageUrl || ''}
            />
          </div>
          <span className="text-[11px] text-slate-400 text-center mt-3 font-medium">
            {form.imageUrl && form.imageUrl.trim()
              ? (t('showingImageFromUrl') || 'Showing image from URL')
              : (t('pasteImageUrlPrompt') || 'Paste an image URL below to fetch preview')}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField error={errors.name} label={t('productName')} name="name" onChange={onChange} placeholder="e.g. Daily Grain Rice" value={form.name} />
            <FormField error={errors.brand} label={t('brand')} name="brand" onChange={onChange} placeholder="Fictional or generic brand" value={form.brand} />
            
            {isCustomMode ? (
              <div>
                <FormField
                  error={errors.category}
                  label={t('category')}
                  name="category"
                  onChange={onChange}
                  placeholder="Enter custom category name..."
                  value={form.category}
                />
                <button
                  className="text-xs font-semibold text-brand-orange hover:text-brand-orange-dark cursor-pointer mt-1"
                  onClick={handleSwitchToDropdown}
                  type="button"
                >
                  ← {t('chooseFromCategoriesList') || 'Choose from categories list'}
                </button>
              </div>
            ) : (
              <FormField
                error={errors.category}
                label={t('category')}
                name="category"
                onChange={handleCategorySelectChange}
                type="select"
                value={form.category}
              >
                <option disabled value="">
                  {t('selectCategory') || 'Select a category'}
                </option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value={CUSTOM_VALUE}>{t('addCustomCategory') || '+ Add custom category...'}</option>
              </FormField>
            )}

            <FormField error={errors.packSize} label={t('packSize')} name="packSize" onChange={onChange} placeholder="e.g. 1 kg" value={form.packSize} />
            <FormField error={errors.price} label={`${t('price')} (₹)`} name="price" onChange={onChange} placeholder="0" type="number" value={form.price} />
            <FormField error={errors.minimumQuantity} label={t('minimumQuantity')} name="minimumQuantity" onChange={onChange} placeholder="1" type="number" value={form.minimumQuantity} />
            <FormField
              error={errors.availableStock}
              inputMode="numeric"
              label={t('availableStock')}
              min="0"
              name="availableStock"
              onChange={onChange}
              onKeyDown={(event) => {
                if (['e', 'E', '+', '-', '.'].includes(event.key)) {
                  event.preventDefault()
                }
              }}
              placeholder="0"
              step="1"
              type="number"
              value={form.availableStock}
            />
            <FormField error={errors.imageUrl} label={t('imageUrlOptional')} name="imageUrl" onChange={onChange} placeholder="https://... (direct image link)" value={form.imageUrl} />
          </div>

          {errors.form && (
            <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium" role="alert">
              {errors.form}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button 
              className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-sm shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer" 
              disabled={isSubmitting} 
              type="submit"
            >
              {isSubmitting ? t('saving') : submitLabel}
            </button>
            {onCancel && (
              <button 
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all cursor-pointer" 
                onClick={onCancel} 
                type="button"
              >
                {t('cancel')}
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
