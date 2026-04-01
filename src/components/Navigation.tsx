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
    <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-lg tracking-tight hover:text-white transition-colors"
          >
            <span className="text-2xl">🏓</span>
            <span className="hidden sm:block text-white">BUREAU PPL</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Current player */}
          <div className="flex items-center gap-2">
            {currentPlayer ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/player/${encodeURIComponent(currentPlayer)}`)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition-colors px-3 py-1.5 rounded-lg text-sm font-semibold"
                >
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-xs text-white font-black">
                    {currentPlayer[0]}
                  </span>
                  <div className="hidden sm:flex flex-col items-start">
                    <span>{currentPlayer}</span>
                    {currentEntreprise && <span className="text-xs text-gray-400 font-normal">{currentEntreprise}</span>}
                  </div>
                </button>
                <button
                  onClick={clearPlayer}
                  className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1.5"
                  title="Changer de joueur"
                >
                  ✕
                </button>
              </div>
            ) : (
              <Link
                href="/"
                className="text-sm font-semibold text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
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
