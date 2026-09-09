import { useLocale } from '../context/LocaleContext.jsx'
import ProductImage from './ProductImage.jsx'
import FormField from './FormField.jsx'

export default function ProductManagementForm({ form, errors, onChange, onSubmit, onCancel, isSubmitting, submitLabel }) {
  const { t } = useLocale()

  return (
    <form className="product-management-form" noValidate onSubmit={onSubmit}>
      <div className="product-form-visual">
        <div className="product-form-preview-card">
          <span className="product-form-preview-label">Preview</span>
          <ProductImage
            alt={form.name || 'Product preview'}
            className="product-form-preview-art"
            fallbackText={(form.name || 'P').slice(0, 1).toUpperCase()}
            src={form.imageUrl || ''}
          />
        </div>
      </div>

      <div className="form-grid">
        <FormField error={errors.name} label={t('productName')} name="name" onChange={onChange} placeholder="e.g. Daily Grain Rice" value={form.name} />
        <FormField error={errors.brand} label={t('brand')} name="brand" onChange={onChange} placeholder="Fictional or generic brand" value={form.brand} />
        <FormField error={errors.category} label={t('category')} name="category" onChange={onChange} placeholder="e.g. Staples" value={form.category} />
        <FormField error={errors.packSize} label={t('packSize')} name="packSize" onChange={onChange} placeholder="e.g. 1 kg" value={form.packSize} />
        <FormField error={errors.price} label={`${t('price')} (Rs)`} name="price" onChange={onChange} placeholder="0" type="number" value={form.price} />
        <FormField error={errors.minimumQuantity} label={t('minimumQuantity')} name="minimumQuantity" onChange={onChange} placeholder="1" type="number" value={form.minimumQuantity} />
        <FormField error={errors.imageUrl} label={t('imageUrlOptional')} name="imageUrl" onChange={onChange} placeholder="https://..." value={form.imageUrl} />
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
