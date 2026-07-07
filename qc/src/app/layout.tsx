import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { I18nProvider } from '@/lib/i18n'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FQMS — Food Quality Management',
  description: 'Sistem Manajemen Mutu Pangan — Nata de Coco & Mutiara Tapioka',
}

// Mobile-first: lock the viewport so the shop-floor layout stays single-column
// and buttons keep their touch size.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 text-foreground`}>
        <I18nProvider>
          {children}
          <Toaster richColors position="top-center" />
        </I18nProvider>
      </body>
    </html>
  )
}
