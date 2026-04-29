import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { LanguageProvider } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Navkar Auction',
  description: 'Live electronics auction — place your best bid',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <LanguageProvider>
          <div className="bg-brand-gold text-brand-navy font-bold text-center py-2 text-sm px-4 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 shadow-sm relative z-50">
            <span>Navkar Services</span>
            <span className="hidden sm:inline">•</span>
            <span>Contact: +919602368928</span>
          </div>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-brand-navy text-white text-center py-4 text-sm mt-12">
            © {new Date().getFullYear()} Navkar Services. All rights reserved.
            {process.env.NODE_ENV === 'development' && (
              <span className="ml-4 opacity-60">
                <a href="/setup" className="underline">Setup guide</a>
              </span>
            )}
          </footer>
        </LanguageProvider>
      </body>
    </html>
  )
}
