import { useNavigate } from 'react-router-dom'
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
      <div className="profile-heading">
        <div>
          <div className="eyebrow">{roleLabel}</div>
          <h1>{t('profile')}</h1>
          <p>{t('profileDescription')}</p>
        </div>
        <div className="profile-avatar" aria-hidden="true">{(user?.name || '?').slice(0, 1).toUpperCase()}</div>
      </div>

      <section className="profile-panel" aria-labelledby="profile-details-heading">
        <div className="section-heading">
          <div>
            <div className="section-kicker">{t('accountDetails')}</div>
            <h2 id="profile-details-heading">{user?.name || t('profile')}</h2>
          </div>
        </div>
        <dl className="profile-details">
          <div><dt>{t('fullName')}</dt><dd>{user?.name || '-'}</dd></div>
          {isShopOwner ? <>
            <div><dt>{t('shopName')}</dt><dd>{user?.shop?.name || '-'}</dd></div>
            <div><dt>{t('shopAddress')}</dt><dd>{user?.shop?.address || '-'}</dd></div>
            <div><dt>{t('area')}</dt><dd>{user?.shop?.area || '-'}</dd></div>
            <div><dt>{t('phoneNumber')}</dt><dd>{user?.phone || '-'}</dd></div>
            <div><dt>{t('optionalEmail')}</dt><dd>{user?.email || t('notProvided')}</dd></div>
          </> : <div><dt>{t('contact')}</dt><dd>{contact}</dd></div>}
          <div><dt>{t('role')}</dt><dd>{roleLabel}</dd></div>
          <div><dt>{t('memberSince')}</dt><dd>{joinedDate}</dd></div>
        </dl>
        <button className="button secondary profile-signout" onClick={handleSignOut} type="button">{t('signOut')}</button>
      </section>
    </section>
  )
}
