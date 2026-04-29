'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'hi'

interface LanguageContextType {
  lang: Language
  toggleLang: () => void
  t: (key: string, replacements?: Record<string, string | number>) => string
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.catalog': 'Catalog',
    'nav.my_bids': 'My Bids',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',
    'nav.login': 'Login to Bid',
    'nav.switch_lang': 'हिंदी',
    
    'home.title': 'Electronics Auction',
    'home.subtitle': '{count} items · Bid live, win big',
    'home.search': 'Search items...',
    'home.all_items': 'All items',
    'home.open_only': 'Open only',
    'home.closed_only': 'Closed only',
    'home.no_items': 'No items found',

    'card.starting_price': 'Starting price',
    'card.top_bid': 'Top bid',
    'card.no_bids': 'No bids yet — be first!',
    'card.min_next': 'Min next bid: ₹{amount}',
    'card.closed': 'CLOSED',

    'item.back': '← Back to catalog',
    'item.auction_closed': 'AUCTION CLOSED',
    'item.starting_price': 'Starting price',
    'item.highest_bid': 'Highest bid',
    'item.no_bids': 'No bids yet',
    'item.min_increment': 'Min increment: ₹{amount}',
    'item.next_min': 'Next min bid:',
    'item.place_bid': 'Place Bid',
    'item.placing': 'Placing…',
    'item.bidding_as': 'Bidding as',
    'item.login_to_bid': 'Login to Place a Bid',
    'item.closed_msg': 'This item is closed. Contact the auctioneer for the winning bid result.',
    'item.bid_history': 'Bid History ({count})',
    'item.no_bids_yet': 'No bids yet. Be the first!',
    'item.bidder': 'Bidder',
    'item.amount': 'Amount',
    'item.time': 'Time',
    'item.leading': 'Leading',

    'login.title': 'Login to Bid',
    'login.subtitle': 'Enter your email or phone to get started',
    'login.contact': 'Email or Phone Number',
    'login.shop': 'Shop / Business Name',
    'login.btn': 'Login',
    'login.logging_in': 'Logging in…',
    'login.privacy': 'Your identity is kept private from other bidders.',

    'timer.ends_in': 'Ends in',
    'timer.auction_ended': 'Auction Ended',
    'timer.starting_soon': 'Starting Soon',
    'timer.not_live': 'Auction not yet live — stay tuned',
    'timer.ended': 'Auction has ended',
    'timer.live_no_end': 'Auction is live — no end time set',
    'timer.closes_in': 'Closes in',
    
    'mybids.title': 'My Bids',
    'mybids.leading': 'Leading',
    'mybids.outbid': 'Outbid',
    
    'admin.dashboard': 'Admin Dashboard',
  },
  hi: {
    'nav.catalog': 'कैटलॉग',
    'nav.my_bids': 'मेरी बोलियां',
    'nav.admin': 'व्यवस्थापक',
    'nav.logout': 'लॉग आउट',
    'nav.login': 'बोली लगाने के लिए लॉगिन करें',
    'nav.switch_lang': 'English',
    
    'home.title': 'इलेक्ट्रॉनिक्स नीलामी',
    'home.subtitle': '{count} आइटम · लाइव बोली लगाएं, जीतें',
    'home.search': 'आइटम खोजें...',
    'home.all_items': 'सभी आइटम',
    'home.open_only': 'केवल खुले',
    'home.closed_only': 'केवल बंद',
    'home.no_items': 'कोई आइटम नहीं मिला',

    'card.starting_price': 'शुरुआती कीमत',
    'card.top_bid': 'सबसे बड़ी बोली',
    'card.no_bids': 'कोई बोली नहीं — पहले बनें!',
    'card.min_next': 'अगली न्यूनतम बोली: ₹{amount}',
    'card.closed': 'बंद',

    'item.back': '← कैटलॉग पर वापस जाएं',
    'item.auction_closed': 'नीलामी बंद',
    'item.starting_price': 'शुरुआती कीमत',
    'item.highest_bid': 'सबसे बड़ी बोली',
    'item.no_bids': 'कोई बोली नहीं',
    'item.min_increment': 'न्यूनतम वृद्धि: ₹{amount}',
    'item.next_min': 'अगली न्यूनतम बोली:',
    'item.place_bid': 'बोली लगाएं',
    'item.placing': 'लगा रहे हैं…',
    'item.bidding_as': 'बोली लगाने वाले:',
    'item.login_to_bid': 'बोली लगाने के लिए लॉगिन करें',
    'item.closed_msg': 'यह आइटम बंद है। जीतने वाली बोली के लिए व्यवस्थापक से संपर्क करें।',
    'item.bid_history': 'बोली का इतिहास ({count})',
    'item.no_bids_yet': 'कोई बोली नहीं। पहले बनें!',
    'item.bidder': 'बोली लगाने वाला',
    'item.amount': 'राशि',
    'item.time': 'समय',
    'item.leading': 'आगे',

    'login.title': 'बोली लगाने के लिए लॉगिन करें',
    'login.subtitle': 'शुरू करने के लिए अपना ईमेल या फोन दर्ज करें',
    'login.contact': 'ईमेल या फोन नंबर',
    'login.shop': 'दुकान / व्यवसाय का नाम',
    'login.btn': 'लॉगिन',
    'login.logging_in': 'लॉगिन कर रहे हैं…',
    'login.privacy': 'आपकी पहचान अन्य बोलीदाताओं से गुप्त रखी जाती है।',

    'timer.ends_in': 'समाप्त',
    'timer.auction_ended': 'नीलामी समाप्त',
    'timer.starting_soon': 'जल्द शुरू',
    'timer.not_live': 'नीलामी अभी लाइव नहीं है — बने रहें',
    'timer.ended': 'नीलामी समाप्त हो गई है',
    'timer.live_no_end': 'नीलामी लाइव है — कोई समाप्ति समय सेट नहीं है',
    'timer.closes_in': 'में बंद होगा',
    
    'mybids.title': 'मेरी बोलियां',
    'mybids.leading': 'आगे',
    'mybids.outbid': 'पीछे',
    
    'admin.dashboard': 'व्यवस्थापक डैशबोर्ड',
  }
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  toggleLang: () => {},
  t: (key) => key
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Language
    if (saved === 'en' || saved === 'hi') {
      setLang(saved)
    }
  }, [])

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'hi' : 'en'
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }

  const t = (key: string, replacements?: Record<string, string | number>) => {
    let str = translations[lang][key] || translations['en'][key] || key
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
