import { useLocale } from '../context/LocaleContext.jsx'
import ProductImage from './ProductImage.jsx'
import FormField from './FormField.jsx'

export default function ProductManagementForm({ form, errors, onChange, onSubmit, onCancel, isSubmitting, submitLabel }) {
  const { t } = useLocale()

  return (
    <form className="product-management-form" noValidate onSubmit={onSubmit}>
      <div className="product-form-visual">
        <div className="product-form-preview-card">
          <div className="product-form-preview-header">
            <span className="product-form-preview-label">Preview</span>
            {form.imageUrl && form.imageUrl.trim() ? (
              <span className="product-form-preview-badge">Live Preview</span>
            ) : null}
          </div>
          <ProductImage
            alt={form.name || 'Product preview'}
            className="product-form-preview-art"
            fallbackText={(form.name || 'P').slice(0, 1).toUpperCase()}
            src={form.imageUrl || ''}
          />
          <span className="product-form-preview-hint">
            {form.imageUrl && form.imageUrl.trim()
              ? 'Showing image from URL'
              : 'Paste an image URL below to fetch preview'}
          </span>
        </div>
      </div>

      <div className="form-grid">
        <FormField error={errors.name} label={t('productName')} name="name" onChange={onChange} placeholder="e.g. Daily Grain Rice" value={form.name} />
        <FormField error={errors.brand} label={t('brand')} name="brand" onChange={onChange} placeholder="Fictional or generic brand" value={form.brand} />
        <FormField error={errors.category} label={t('category')} name="category" onChange={onChange} placeholder="e.g. Staples" value={form.category} />
        <FormField error={errors.packSize} label={t('packSize')} name="packSize" onChange={onChange} placeholder="e.g. 1 kg" value={form.packSize} />
        <FormField error={errors.price} label={`${t('price')} (Rs)`} name="price" onChange={onChange} placeholder="0" type="number" value={form.price} />
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

      {errors.form && <p className="form-message error" role="alert">{errors.form}</p>}

      <div className="form-actions">
        <button className="button primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? t('saving') : submitLabel}
        </button>
        {onCancel && (
          <button className="button secondary" onClick={onCancel} type="button">
            {t('cancel')}
          </button>
        )}
      </div>
    </form>
  )
}
