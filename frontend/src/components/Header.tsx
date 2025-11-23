'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-2xl">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <span className="bg-gradient-cosmic bg-clip-text text-transparent">
              CosmicCreator
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-gray-300">
            <Link href="/dashboard" className="hover:text-white transition">
              Dashboard
            </Link>
            <Link href="/mint" className="hover:text-white transition">
              Mint NFT
            </Link>
            <Link href="/milestones" className="hover:text-white transition">
              Milestones
            </Link>
            <Link href="/leaderboard" className="hover:text-white transition">
              Leaderboard
            </Link>
          </nav>

          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
