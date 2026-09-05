import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext.jsx'
import heroReference from '../assets/connekto_hero_visual_reference.png'
import contactIllustration from '../assets/contact_illustration.svg'

export default function WelcomePage() {
  const { t } = useLocale()

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="home-page">

      {/* ── HERO SECTION ── */}
      <section className="home-hero" id="home" aria-label="Hero">
        <div className="home-hero-inner">

          {/* LEFT COLUMN */}
          <div className="home-hero-left">
            <p className="home-eyebrow">{t('heroEyebrow')}</p>
            <h1 className="home-heading">{t('heroHeading')}</h1>
            <p className="home-subtitle">{t('heroSubtitle')}</p>

            <div className="home-cta-row">
              <Link className="home-btn-primary" to="/role-selection">
                {t('getStarted')} →
              </Link>
              <button
                className="home-btn-video"
                onClick={() => scrollTo('how-it-works')}
                type="button"
              >
                <span className="home-play-icon" aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </span>
                {t('watchVideo')}
              </button>
            </div>

            {/* Value Points */}
            <div className="home-value-points">
              <div className="home-value-item">
                <span className="home-value-icon" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                </span>
                <div>
                  <strong>{t('wideNetwork')}</strong>
                  <span>{t('wideNetworkDesc')}</span>
                </div>
              </div>
              <div className="home-value-item">
                <span className="home-value-icon home-value-icon--green" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </span>
                <div>
                  <strong>{t('reliableSupply')}</strong>
                  <span>{t('reliableSupplyDesc')}</span>
                </div>
              </div>
              <div className="home-value-item">
                <span className="home-value-icon home-value-icon--orange" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                </span>
                <div>
                  <strong>{t('businessGrowth')}</strong>
                  <span>{t('businessGrowthDesc')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Uploaded Hero Reference */}
          <div className="home-hero-right">
            <img
              className="home-hero-reference"
              src={heroReference}
              alt="Local businesses connected through Connekto"
            />
          </div>
        </div>
      </section>

      {/* ── ROLE SELECTION (FOR BUSINESSES) ── */}
      <section className="home-roles" id="for-businesses" aria-labelledby="roles-heading">
        <div className="home-roles-inner">
          <p className="home-eyebrow">{t('chooseYourRoleEyebrow')}</p>
          <h2 id="roles-heading" className="home-roles-heading">{t('joinConnekto')}</h2>
          <p className="home-roles-sub">{t('joinConnektoDesc')}</p>
          <div className="home-role-cards">
            <Link className="home-role-card" to="/role-selection" aria-label={t('shopOwner')}>
              <span className="home-role-icon home-role-icon--orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </span>
              <div className="home-role-body">
                <strong>{t('shopOwner')}</strong>
                <span>{t('shopOwnerHomeDesc')}</span>
              </div>
              <span className="home-role-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </span>
            </Link>
            <Link className="home-role-card" to="/role-selection" aria-label={t('supplier')}>
              <span className="home-role-icon home-role-icon--green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              </span>
              <div className="home-role-body">
                <strong>{t('supplier')}</strong>
                <span>{t('supplierHomeDesc')}</span>
              </div>
              <span className="home-role-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </span>
            </Link>
            <Link className="home-role-card home-role-card--purple" to="/role-selection" aria-label={t('gruhUdyog')}>
              <span className="home-role-icon home-role-icon--purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M5.5 20a7 7 0 0 1 13 0" /></svg>
              </span>
              <div className="home-role-body">
                <strong>{t('gruhUdyog')}</strong>
                <span>{t('gruhUdyogHomeDesc')}</span>
              </div>
              <span className="home-role-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATISTICS STRIP ── */}
      <section className="home-stats" aria-label={t('platformStats')}>
        <div className="home-stats-inner">
          <div className="home-stat-item">
            <span className="home-stat-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4673f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </span>
            <div><strong className="home-stat-value">{t('stat1Value')}</strong><span className="home-stat-label">{t('stat1Label')}</span></div>
          </div>
          <div className="home-stat-divider" aria-hidden="true" />
          <div className="home-stat-item">
            <span className="home-stat-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4673f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
            </span>
            <div><strong className="home-stat-value">{t('stat2Value')}</strong><span className="home-stat-label">{t('stat2Label')}</span></div>
          </div>
          <div className="home-stat-divider" aria-hidden="true" />
          <div className="home-stat-item">
            <span className="home-stat-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4673f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </span>
            <div><strong className="home-stat-value">{t('stat3Value')}</strong><span className="home-stat-label">{t('stat3Label')}</span></div>
          </div>
          <div className="home-stat-divider" aria-hidden="true" />
          <div className="home-stat-item">
            <span className="home-stat-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4673f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            </span>
            <div><strong className="home-stat-value">{t('stat4Value')}</strong><span className="home-stat-label">{t('stat4Label')}</span></div>
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section className="home-about" id="about" aria-labelledby="about-heading">
        <div className="home-about-inner">
          <div className="home-about-left">
            <p className="home-eyebrow">{t('aboutEyebrow')}</p>
            <h2 id="about-heading" className="home-section-heading">{t('aboutHeading')}</h2>
            <p className="home-about-body">{t('aboutBody1')}</p>
            <p className="home-about-body">{t('aboutBody2')}</p>
            <p className="home-about-body">{t('aboutBody3')}</p>
            <p className="home-about-body">{t('aboutBody4')}</p>
            <p className="home-about-closing">{t('aboutClosing')}</p>
            <Link className="home-btn-primary home-btn-primary--sm" to="/role-selection">{t('getStarted')} →</Link>
          </div>
          <div className="home-about-right" aria-hidden="true">
            <div className="home-about-visual">
              {/* Background decorative blobs */}
              <div className="home-about-blob home-about-blob--1" />
              <div className="home-about-blob home-about-blob--2" />
              
              {/* Connection lines */}
              <svg className="home-about-connector-lines" viewBox="0 0 340 380" fill="none" aria-hidden="true">
                <path d="M 85 80 Q 170 100 170 190" stroke="#e5e2db" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />
                <path d="M 255 80 Q 170 100 170 190" stroke="#e5e2db" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />
                <path d="M 170 240 Q 170 300 170 320" stroke="#e5e2db" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />
              </svg>

              {/* Shop Owner - Top Left */}
              <div className="home-about-role-card home-about-role-card--shop">
                <span className="home-about-role-icon home-about-role-icon--orange">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                </span>
                <div className="home-about-role-text">
                  <strong>{t('shopOwner')}</strong>
                  <span>{t('aboutShopOwnerShort1')}</span>
                  <span>{t('aboutShopOwnerShort2')}</span>
                </div>
              </div>

              {/* Supplier - Top Right */}
              <div className="home-about-role-card home-about-role-card--supplier">
                <span className="home-about-role-icon home-about-role-icon--green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                </span>
                <div className="home-about-role-text">
                  <strong>{t('supplier')}</strong>
                  <span>{t('aboutSupplierShort1')}</span>
                  <span>{t('aboutSupplierShort2')}</span>
                </div>
              </div>

              {/* Gruh Udyog - Bottom Center */}
              <div className="home-about-role-card home-about-role-card--gruh">
                <span className="home-about-role-icon home-about-role-icon--purple">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M5.5 20a7 7 0 0 1 13 0" /></svg>
                </span>
                <div className="home-about-role-text">
                  <strong>{t('gruhUdyog')}</strong>
                  <span>{t('aboutGruhUdyogShort1')}</span>
                  <span>{t('aboutGruhUdyogShort2')}</span>
                </div>
              </div>

              {/* Central Connekto Platform Badge */}
              <div className="home-about-platform-badge">
                <span className="pub-brand-mark" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1rem' }}>C</span>
                <strong>Connekto</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="home-hiw" id="how-it-works" aria-labelledby="hiw-heading">
        <div className="home-hiw-inner">
          <p className="home-eyebrow">{t('hiwEyebrow')}</p>
          <h2 id="hiw-heading" className="home-section-heading">{t('hiwHeading')}</h2>
          <p className="home-roles-sub" style={{ marginBottom: '2.5rem' }}>{t('hiwSubtitle')}</p>
          <div className="home-hiw-steps">
            {[
              { num: '01', titleKey: 'hiwStep1Title', descKey: 'hiwStep1Desc', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
              { num: '02', titleKey: 'hiwStep2Title', descKey: 'hiwStep2Desc', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
              { num: '03', titleKey: 'hiwStep3Title', descKey: 'hiwStep3Desc', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg> },
              { num: '04', titleKey: 'hiwStep4Title', descKey: 'hiwStep4Desc', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
            ].map((step) => (
              <div key={step.num} className="home-hiw-step">
                <div className="home-hiw-step-num">{step.num}</div>
                <div className="home-hiw-step-icon" aria-hidden="true">{step.icon}</div>
                <strong className="home-hiw-step-title">{t(step.titleKey)}</strong>
                <p className="home-hiw-step-desc">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section className="home-contact" id="contact" aria-labelledby="contact-heading">
        <div className="home-contact-inner">
          <div className="home-contact-left">
            <p className="home-eyebrow">{t('contactEyebrow')}</p>
            <h2 id="contact-heading" className="home-section-heading">{t('contactHeading')}</h2>
            <p className="home-about-body">{t('contactSubtitle')}</p>
            <div className="home-contact-info">
              <div className="home-contact-info-item">
                <span className="home-contact-info-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4673f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </span>
                <a href="mailto:hello@connekto.example" className="home-contact-link">hello@connekto.example</a>
              </div>
              <div className="home-contact-info-item">
                <span className="home-contact-info-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4673f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                </span>
                <span>{t('contactLocation')}</span>
              </div>
            </div>
          </div>

          <div className="home-contact-right">
            <img 
              src={contactIllustration} 
              alt="Contact illustration showing email, questions, ideas, and partnerships" 
              className="home-contact-illustration"
            />
          </div>
        </div>
      </section>

    </div>
  )
}
