import { useNavigate } from 'react-router-dom'
import { FiMail, FiMapPin, FiPhone, FiShoppingBag } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'

const roleKeys = {
  'shop-owner': 'shopOwner',
  supplier: 'supplier',
  'gruh-udyog': 'gruhUdyog',
}

export default function ProfilePage({ role }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { t } = useLocale()
  const roleLabel = t(roleKeys[role] || 'profile')
  const contact = user?.email || user?.phone || '-'
  const isShopOwner = role === 'shop-owner'
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <section className="profile-page">
      <div className="profile-breadcrumb"><span>{t('shopOwner')}</span><span>›</span><span>{t('profile')}</span></div>
      <div className="profile-heading">
        <div>
          <div className="eyebrow">{roleLabel}</div>
          <h1>{t('profile')}</h1>
          <p>{t('profileDescription')}</p>
        </div>
      </div>

      <div className={`profile-layout${isShopOwner ? ' profile-layout--shop-owner' : ''}`}>
        <section className="profile-panel profile-account-panel" aria-labelledby="profile-details-heading">
          <div className="profile-card-heading">
            <span className="profile-card-icon" aria-hidden="true"><FiShoppingBag /></span>
            <div>
              <div className="section-kicker">{t('accountDetails')}</div>
              <h2 id="profile-details-heading">{user?.name || t('profile')}</h2>
            </div>
          </div>
          <dl className="profile-details">
            <div><dt>{t('fullName')}</dt><dd>{user?.name || '-'}</dd></div>
            {!isShopOwner && <div><dt>{t('contact')}</dt><dd>{contact}</dd></div>}
            <div><dt>{t('role')}</dt><dd>{roleLabel}</dd></div>
            <div><dt>{t('memberSince')}</dt><dd>{joinedDate}</dd></div>
          </dl>
          <button className="button secondary profile-signout" onClick={handleSignOut} type="button">{t('signOut')}</button>
        </section>

        {isShopOwner && <div className="profile-side-column">
          <section className="profile-identity-card" aria-label="Profile identity">
            <div className="profile-avatar" aria-hidden="true">{(user?.name || '?').slice(0, 1).toUpperCase()}</div>
            <div><strong>{user?.name || t('profile')}</strong><span>{roleLabel}</span></div>
          </section>
          <section className="profile-panel profile-shop-panel" aria-labelledby="shop-information-heading">
            <div className="profile-card-heading">
              <span className="profile-card-icon" aria-hidden="true"><FiShoppingBag /></span>
              <div>
                <div className="section-kicker">Workspace</div>
                <h2 id="shop-information-heading">Shop Information</h2>
              </div>
            </div>
            <dl className="profile-shop-details">
              <div><dt>{t('shopName')}</dt><dd>{user?.shop?.name || '-'}</dd></div>
              <div className="profile-shop-detail--wide"><dt>{t('shopAddress')}</dt><dd>{user?.shop?.address || '-'}</dd></div>
              <div><dt>{t('area')}</dt><dd><FiMapPin aria-hidden="true" />{user?.shop?.area || '-'}</dd></div>
              <div><dt>{t('phoneNumber')}</dt><dd><FiPhone aria-hidden="true" />{user?.phone || '-'}</dd></div>
              <div className="profile-shop-detail--wide"><dt>{t('optionalEmail')}</dt><dd><FiMail aria-hidden="true" />{user?.email || t('notProvided')}</dd></div>
            </dl>
          </section>
        </div>}
      </div>
    </section>
  )
}
