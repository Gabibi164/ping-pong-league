'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer'

const NAV_LINKS = [
  { href: '/standings', label: 'Classement' },
  { href: '/matches', label: 'Matchs' },
  { href: '/playoffs', label: 'Playoffs' },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentPlayer, currentEntreprise, clearPlayer } = useCurrentPlayer()

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="font-black text-sm tracking-widest uppercase wojo-text">Wojo PPL</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  pathname === href
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-gray-500 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Current player */}
          <div className="flex items-center gap-2">
            {currentPlayer ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => router.push(`/player/${encodeURIComponent(currentPlayer)}`)}
                  className="flex items-center gap-2 glass-btn px-3 py-1.5 rounded-xl text-sm font-semibold"
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black wojo-gradient shrink-0">
                    {currentPlayer[0]}
                  </span>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-white text-xs font-bold">{currentPlayer}</span>
                    {currentEntreprise && <span className="text-[10px] text-gray-500">{currentEntreprise}</span>}
                  </div>
                </button>
                <button
                  onClick={clearPlayer}
                  className="text-gray-600 hover:text-gray-400 text-xs px-1.5 py-1.5 transition-colors"
                  title="Changer de joueur"
                >
                  ✕
                </button>
              </div>
            ) : (
              <Link
                href="/"
                className="text-sm font-semibold text-gray-500 hover:text-white glass-btn px-3 py-1.5 rounded-xl"
              >
                Accueil
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
