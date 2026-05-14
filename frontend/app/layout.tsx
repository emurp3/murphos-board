import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'S.A. — Executive Command | MurphBoard',
  description: 'Super Assistant Executive AI Chief of Staff for the MurphBoard Ecosystem',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-space-900 text-white antialiased font-sans min-h-screen">
        <div className="flex h-screen overflow-hidden">
          {/* Left navigation sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto bg-space-900 bg-grid-pattern bg-grid p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
