import { useState, useEffect, useRef } from 'react'
import {
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiShield,
  FiShoppingBag,
  FiShoppingCart,
  FiTruck,
  FiVolume2,
  FiVolumeX,
  FiZap,
} from 'react-icons/fi'
import { useLocale } from '../context/LocaleContext.jsx'

export default function InteractivePhoneMockup() {
  const { locale } = useLocale()
  const [activeTab, setActiveTab] = useState('compare') // 'compare' | 'cart' | 'auth'
  const [isMuted, setIsMuted] = useState(true) // STRICT: Muted by default
  const [addedSupplier, setAddedSupplier] = useState(1)
  const [isHovered, setIsHovered] = useState(false)
  const audioContextRef = useRef(null)

  // Gentle Web Audio API synthesizer for optional click sound (only if unmuted by user)
  const playSoftClick = () => {
    if (isMuted) return
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (AudioCtx) audioContextRef.current = new AudioCtx()
      }
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        const osc = audioContextRef.current.createOscillator()
        const gain = audioContextRef.current.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(580, audioContextRef.current.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, audioContextRef.current.currentTime + 0.05)
        gain.gain.setValueAtTime(0.05, audioContextRef.current.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.05)
        osc.connect(gain)
        gain.connect(audioContextRef.current.destination)
        osc.start()
        osc.stop(audioContextRef.current.currentTime + 0.05)
      }
    } catch {
      // Audio autoplay gracefully handled
    }
  }

  // Auto-advance tabs slowly unless hovered or user interacted
  useEffect(() => {
    if (isHovered) return
    const tabs = ['compare', 'cart', 'auth']
    const timer = setInterval(() => {
      setActiveTab((curr) => {
        const nextIndex = (tabs.indexOf(curr) + 1) % tabs.length
        return tabs[nextIndex]
      })
    }, 6000)
    return () => clearInterval(timer)
  }, [isHovered])

  // Localized mockup content
  const texts = {
    en: {
      compareTab: '1. Compare',
      cartTab: '2. Unified Cart',
      authTab: '3. 1-Tap OTP',
      productName: 'Fortune Sunlite Sunflower Oil 15L Tin',
      category: 'Edible Oils • Wholesale Pack',
      mrp: 'MRP: ₹1,850',
      bestMargin: 'Best Margin (+13%)',
      moq: 'MOQ',
      etaToday: 'ETA Today',
      etaTomorrow: 'ETA Tomorrow',
      addBtn: 'Added',
      supplier1: 'Shreeji Agro Distributors',
      supplier2: 'Gujarat FMCG Wholesalers',
      supplier3: 'Apex Logistics & Supplies',
      savingsAlert: 'You save ₹240/tin with Shreeji Agro',
      nextToCart: 'Consolidate into 1 Cart →',
      cartTitle: 'Unified Kirana Cart (2 Suppliers)',
      splitNotice: 'Split into 2 direct distributor dispatches',
      item1: '5x Fortune Sunflower Oil 15L',
      item2: '2x Aashirvaad Shudh Chakki Atta 10kg',
      item3: '4x Parle-G Wholesale Box (48pk)',
      item4: '2x Wagh Bakri CTC Tea 1kg',
      subtotal: 'Gross Subtotal',
      discounts: 'Multi-Supplier Margin Savings',
      totalPayable: 'Total Payable',
      checkoutBtn: 'Place 1-Tap Order (COD / Credit)',
      authTitle: 'Instant Kirana Verification',
      authSubtitle: 'Fast 1-tap OTP without passwords',
      phoneLabel: 'Registered Mobile Number',
      otpVerified: 'OTP Verified Successfully',
      storeName: 'Radhe Kirana & General Store',
      storeLoc: 'Navrangpura, Ahmedabad • ID: #KRN-4821',
      creditApproved: 'Wholesale Credit Line: ₹50,000 Active',
    },
    gu: {
      compareTab: '1. ભાવ સરખામણી',
      cartTab: '2. સંયુક્ત કાર્ટ',
      authTab: '3. ઓટીપી લોગિન',
      productName: 'ફોર્ચ્યુન સનલાઇટ સૂર્યમુખી તેલ 15L ડબ્બો',
      category: 'ખાદ્ય તેલ • જથ્થાબંધ પેક',
      mrp: 'MRP: ₹1,850',
      bestMargin: 'શ્રેષ્ઠ માર્જિન (+13%)',
      moq: 'ઓછામાં ઓછો ઓર્ડર',
      etaToday: 'ડિલિવરી આજે',
      etaTomorrow: 'ડિલિવરી કાલે',
      addBtn: 'ઉમેરાયેલ',
      supplier1: 'શ્રીજી એગ્રો ડિસ્ટ્રિબ્યુટર્સ',
      supplier2: 'ગુજરાત FMCG હોલસેલર્સ',
      supplier3: 'એપેક્સ લોજિસ્ટિક્સ એન્ડ સપ્લાય',
      savingsAlert: 'શ્રીજી એગ્રો સાથે તમે ડબ્બા દીઠ ₹240 બચાવો છો',
      nextToCart: 'એક જ કાર્ટમાં ભેગા કરો →',
      cartTitle: 'સંયુક્ત કિરાણા કાર્ટ (2 સપ્લાયર્સ)',
      splitNotice: '2 અલગ ડિસ્ટ્રિબ્યુટરથી સીધી ડિલિવરી',
      item1: '5x ફોર્ચ્યુન સૂર્યમુખી તેલ 15L',
      item2: '2x આશીર્વાદ શુદ્ધ ચક્કી લોટ 10kg',
      item3: '4x પાર્લે-જી હોલસેલ બોક્સ (48pk)',
      item4: '2x વાઘ બકરી સીટીસી ચા 1kg',
      subtotal: 'કુલ સબટોટલ',
      discounts: 'મલ્ટી-સપ્લાયર માર્જિન બચત',
      totalPayable: 'ચૂકવવાપાત્ર કુલ રકમ',
      checkoutBtn: '1-ક્લિક ઓર્ડર આપો (COD / ઉધાર)',
      authTitle: 'ઝડપી કિરાણા વેરિફિકેશન',
      authSubtitle: 'પાસવર્ડ વગર માત્ર 1-ટેપ OTP',
      phoneLabel: 'રજિસ્ટર્ડ મોબાઇલ નંબર',
      otpVerified: 'ઓટીપી સફળતાપૂર્વક ચકાસાયો',
      storeName: 'રાધે કિરાણા એન્ડ જનરલ સ્ટોર',
      storeLoc: 'નવરંગપુરા, અમદાવાદ • ID: #KRN-4821',
      creditApproved: 'જથ્થાબંધ ક્રેડિટ લિમિટ: ₹50,000 સક્રિય',
    },
    hi: {
      compareTab: '1. रेट कम्पेरिजन',
      cartTab: '2. कंबाइंड कार्ट',
      authTab: '3. 1-टैप OTP',
      productName: 'फॉर्च्यून सनलाइट सनफ्लावर ऑयल 15L टिन',
      category: 'खाद्य तेल • थोक पैक',
      mrp: 'MRP: ₹1,850',
      bestMargin: 'बेस्ट मार्जिन (+13%)',
      moq: 'न्यूनतम ऑर्डर',
      etaToday: 'डिलीवरी आज',
      etaTomorrow: 'डिलीवरी कल',
      addBtn: 'जोड़ा गया',
      supplier1: 'श्रीजी एग्रो डिस्ट्रीब्यूटर्स',
      supplier2: 'गुजरात FMCG होलसेलर्स',
      supplier3: 'एपेक्स लॉजिस्टिक्स एंड सप्लाइज',
      savingsAlert: 'श्रीजी एग्रो से प्रति टिन ₹240 की सीधी बचत',
      nextToCart: 'सिंगल कार्ट में जोड़ें →',
      cartTitle: 'कंबाइंड किराना कार्ट (2 सप्लायर्स)',
      splitNotice: '2 डिस्ट्रीब्यूटर्स से डायरेक्ट अलग डिस्पैच',
      item1: '5x फॉर्च्यून सनफ्लावर ऑयल 15L',
      item2: '2x आशीर्वाद शुद्ध चक्की आटा 10kg',
      item3: '4x पारले-जी होलसेल बॉक्स (48pk)',
      item4: '2x वाघ बकरी सीटीसी चाय 1kg',
      subtotal: 'ग्रॉस सबटोटल',
      discounts: 'मल्टी-सप्लायर मार्जिन बचत',
      totalPayable: 'कुल देय राशि',
      checkoutBtn: '1-टैप ऑर्डर प्लेस करें (COD / क्रेडिट)',
      authTitle: 'त्वरित किराना वेरिफिकेशन',
      authSubtitle: 'बिना पासवर्ड सिर्फ 1-टैप OTP',
      phoneLabel: 'रजिस्टर्ड मोबाइल नंबर',
      otpVerified: 'OTP सफलतापूर्वक सत्यापित',
      storeName: 'राधे किराना एवं जनरल स्टोर',
      storeLoc: 'नवरंगपुरा, अहमदाबाद • ID: #KRN-4821',
      creditApproved: 'थोक क्रेडिट लिमिट: ₹50,000 एक्टिव',
    },
  }

  const t = texts[locale] || texts.en

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    playSoftClick()
  }

  const toggleSound = () => {
    if (isMuted && !audioContextRef.current) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (AudioCtx) audioContextRef.current = new AudioCtx()
      } catch {
        // Safe audio fallback
      }
    }
    setIsMuted(!isMuted)
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ambient background glow behind device */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/10 rounded-[3.5rem] blur-2xl opacity-75 pointer-events-none -z-10" />

      {/* Universal Android Hardware Frame (Minimal Punch-Hole, Slim Bezel, Dark Hardware) */}
      <div className="relative w-[310px] sm:w-[350px] md:w-[365px] h-[610px] sm:h-[650px] rounded-[2.8rem] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(16,185,129,0.18)] border border-slate-700/80 ring-1 ring-emerald-500/25 flex flex-col">
        
        {/* Subtle glass reflection highlight */}
        <div className="absolute inset-x-8 top-3 h-28 bg-gradient-to-b from-white/10 to-transparent rounded-t-[2.2rem] pointer-events-none z-30" />

        {/* Screen Bezel */}
        <div className="relative w-full h-full rounded-[2.2rem] bg-slate-950 overflow-hidden flex flex-col border border-slate-800/90 text-slate-100 shadow-inner">
          
          {/* Android Minimal Center Punch-Hole Camera */}
          <div className="w-full flex items-center justify-between px-5 pt-2.5 pb-1 z-30 bg-slate-950/80 backdrop-blur-xs">
            <span className="text-[10px] font-semibold text-slate-400 font-mono">10:42</span>
            
            {/* Minimal Punch-Hole camera */}
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700/80 shadow-inner flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-slate-950" />
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="font-mono text-[9px] font-bold text-emerald-400">5G</span>
              <div className="w-4 h-2 rounded-[2px] border border-slate-500 flex items-center p-0.5">
                <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* App Top Bar */}
          <div className="px-3.5 py-2 border-b border-slate-800/90 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                C
              </span>
              <div>
                <span className="block text-[11px] font-bold text-white leading-none">Connekto B2B</span>
                <span className="block text-[9px] text-emerald-400 font-medium">Ahmedabad Hub • Verified</span>
              </div>
            </div>

            {/* Audio Toggle (Strictly muted by default) */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isMuted
                  ? 'border-slate-800 text-slate-500 hover:text-slate-300'
                  : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
              }`}
              title={isMuted ? 'Sound muted (click to unmute)' : 'Sound enabled (click to mute)'}
              aria-label={isMuted ? 'Unmute preview sound' : 'Mute preview sound'}
            >
              {isMuted ? <FiVolumeX className="w-3.5 h-3.5" /> : <FiVolume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Workflow Step Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1.5 bg-slate-900/60 border-b border-slate-800/80">
            {[
              { id: 'compare', label: t.compareTab },
              { id: 'cart', label: t.cartTab },
              { id: 'auth', label: t.authTab },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-center truncate ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Mockup Screen Content Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            
            {/* ── SCREEN 1: SUPPLIER PRICE COMPARISON ── */}
            {activeTab === 'compare' && (
              <div className="space-y-2.5 animate-in fade-in duration-200">
                {/* Product Card Header */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {t.category}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">{t.mrp}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight">{t.productName}</h4>
                </div>

                {/* Savings Callout */}
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium flex items-center gap-1.5">
                  <FiZap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{t.savingsAlert}</span>
                </div>

                {/* 3 Verified Suppliers Side-by-Side Comparison */}
                <div className="space-y-1.5">
                  {/* Supplier 1: Shreeji Agro (Best Margin) */}
                  <div
                    onClick={() => {
                      setAddedSupplier(1)
                      playSoftClick()
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      addedSupplier === 1
                        ? 'bg-slate-900 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-1">
                          <strong className="text-[11px] font-bold text-white">{t.supplier1}</strong>
                          <FiCheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        </div>
                        <span className="inline-block text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded mt-0.5">
                          {t.bestMargin}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400">₹1,610</span>
                        <span className="block text-[9px] text-slate-400">/ tin</span>
                      </div>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                      <span>{t.moq}: 5 Tins</span>
                      <span className="text-emerald-300 font-semibold flex items-center gap-1">
                        <FiClock className="w-2.5 h-2.5" /> {t.etaToday}, 3 PM
                      </span>
                    </div>
                  </div>

                  {/* Supplier 2: Gujarat FMCG Wholesalers */}
                  <div
                    onClick={() => {
                      setAddedSupplier(2)
                      playSoftClick()
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      addedSupplier === 2
                        ? 'bg-slate-900 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-1">
                          <strong className="text-[11px] font-bold text-slate-200">{t.supplier2}</strong>
                          <FiCheckCircle className="w-3 h-3 text-slate-400 shrink-0" />
                        </div>
                        <span className="block text-[9px] text-slate-400 mt-0.5">+10.8% Margin</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-200">₹1,645</span>
                        <span className="block text-[9px] text-slate-400">/ tin</span>
                      </div>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                      <span>{t.moq}: 2 Tins</span>
                      <span className="flex items-center gap-1">
                        <FiClock className="w-2.5 h-2.5" /> {t.etaTomorrow}, 10 AM
                      </span>
                    </div>
                  </div>

                  {/* Supplier 3: Apex Logistics */}
                  <div
                    onClick={() => {
                      setAddedSupplier(3)
                      playSoftClick()
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      addedSupplier === 3
                        ? 'bg-slate-900 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-1">
                          <strong className="text-[11px] font-bold text-slate-300">{t.supplier3}</strong>
                          <FiCheckCircle className="w-3 h-3 text-slate-400 shrink-0" />
                        </div>
                        <span className="block text-[9px] text-slate-400 mt-0.5">+9.2% Margin</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-300">₹1,680</span>
                        <span className="block text-[9px] text-slate-400">/ tin</span>
                      </div>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                      <span>{t.moq}: 10 Tins</span>
                      <span className="flex items-center gap-1">
                        <FiClock className="w-2.5 h-2.5" /> {t.etaToday}, 6 PM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA to Step 2 */}
                <button
                  type="button"
                  onClick={() => handleTabChange('cart')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  <span>{t.nextToCart}</span>
                </button>
              </div>
            )}

            {/* ── SCREEN 2: CONSOLIDATED MULTI-SUPPLIER CART ── */}
            {activeTab === 'cart' && (
              <div className="space-y-2.5 animate-in fade-in duration-200">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                    <FiShoppingCart className="w-3.5 h-3.5" />
                    <span>{t.cartTitle}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">{t.splitNotice}</p>
                </div>

                {/* Supplier 1 Group */}
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-teal-300 pb-1 border-b border-slate-800">
                    <span className="flex items-center gap-1">
                      <FiTruck className="w-3 h-3" /> {t.supplier1}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-semibold">{t.etaToday}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>{t.item1}</span>
                    <span className="font-mono font-bold text-white">₹8,050</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>{t.item2}</span>
                    <span className="font-mono font-bold text-white">₹820</span>
                  </div>
                </div>

                {/* Supplier 2 Group */}
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-cyan-300 pb-1 border-b border-slate-800">
                    <span className="flex items-center gap-1">
                      <FiTruck className="w-3 h-3" /> {t.supplier2}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">{t.etaTomorrow}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>{t.item3}</span>
                    <span className="font-mono font-bold text-white">₹1,440</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>{t.item4}</span>
                    <span className="font-mono font-bold text-white">₹960</span>
                  </div>
                </div>

                {/* Consolidated Order Summary */}
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1 text-[10px]">
                  <div className="flex justify-between text-slate-400">
                    <span>{t.subtotal}</span>
                    <span className="font-mono">₹11,270</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>{t.discounts}</span>
                    <span className="font-mono">-₹1,380</span>
                  </div>
                  <div className="pt-1 border-t border-emerald-500/20 flex justify-between font-bold text-xs text-white">
                    <span>{t.totalPayable}</span>
                    <span className="font-mono text-emerald-400 font-black">₹9,890</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTabChange('auth')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  <span>{t.checkoutBtn}</span>
                </button>
              </div>
            )}

            {/* ── SCREEN 3: FAST AUTH / OTP VERIFICATION ── */}
            {activeTab === 'auth' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="text-center space-y-1 p-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <FiShield className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">{t.authTitle}</h4>
                  <p className="text-[10px] text-slate-400">{t.authSubtitle}</p>
                </div>

                {/* Mobile Input mockup */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <span className="block text-[9px] text-slate-400 font-medium">{t.phoneLabel}</span>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950 border border-slate-700/80 text-[11px] font-mono text-white">
                    <span className="text-emerald-400 font-bold">🇮🇳 +91</span>
                    <span>98765 43210</span>
                  </div>
                </div>

                {/* OTP Auto-fill indicators */}
                <div className="flex justify-center gap-2">
                  {['9', '4', '2', '8'].map((digit, i) => (
                    <div
                      key={i}
                      className="w-8 h-9 rounded-lg bg-slate-900 border border-emerald-500/60 text-emerald-400 font-mono font-black text-sm flex items-center justify-center shadow-xs"
                    >
                      {digit}
                    </div>
                  ))}
                </div>

                {/* Verified Kirana Business Card */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>{t.otpVerified}</span>
                  </div>
                  <strong className="block text-[11px] font-bold text-white">{t.storeName}</strong>
                  <span className="block text-[9px] text-slate-400">{t.storeLoc}</span>
                  <span className="inline-block text-[9px] font-semibold text-teal-300 bg-teal-950/50 px-2 py-0.5 rounded mt-1 border border-teal-500/30">
                    {t.creditApproved}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleTabChange('compare')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>← Back to Live Wholesale Rates</span>
                </button>
              </div>
            )}

          </div>

          {/* Android Navigation Bar Pill at bottom */}
          <div className="py-2 flex items-center justify-center bg-slate-950">
            <div className="w-24 h-1 bg-slate-700 rounded-full" />
          </div>

        </div>
      </div>
    </div>
  )
}
