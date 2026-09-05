export default function RoleCard({ role, selected, onSelect }) {
  return (
    <button
      className={`role-card role-card--${role.tone}${selected ? ' selected' : ''}`}
      onClick={() => onSelect(role.value)}
      type="button"
      aria-pressed={selected}
    >
      <span className="role-card-visual">
        <img src={role.image} alt={role.imageAlt} />
        <span className="role-card-overlay">{role.overlay}</span>
        <span className="role-card-selection" aria-hidden="true">{selected ? '✓' : ''}</span>
      </span>
      <span className="role-card-icon" aria-hidden="true">
        {role.tone === 'orange' && '▦'}
        {role.tone === 'green' && '▰'}
        {role.tone === 'purple' && '⌂'}
      </span>
      <span className="role-card-content">
        <span className="role-card-title-row"><strong>{role.title}</strong><span className="role-card-code">{role.value.replace('_', ' ')}</span></span>
        <span className="role-card-description">{role.description}</span>
        <span className="role-card-benefits">{role.benefits.map((benefit) => <span key={benefit}><i aria-hidden="true">✓</i>{benefit}</span>)}</span>
      </span>
    </button>
  )
}
