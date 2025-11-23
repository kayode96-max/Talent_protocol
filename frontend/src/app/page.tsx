'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Sparkles, Trophy, Target } from 'lucide-react';

export default function HomePage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="inline-block mb-6">
          <Sparkles className="w-20 h-20 text-purple-400 animate-pulse-slow" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-cosmic bg-clip-text text-transparent">
          CosmicCreator
        </h1>
        <p className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Verify your skills, document milestones, and evolve your builder reputation on-chain
        </p>
        <div className="flex gap-4 justify-center">
          {isConnected ? (
            <>
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gradient-cosmic text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/mint"
                className="px-8 py-4 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition border border-white/20"
              >
                Mint Skill NFT
              </Link>
            </>
          ) : (
            <ConnectButton />
          )}
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <FeatureCard
          icon={<Trophy className="w-12 h-12" />}
          title="Skill NFTs"
          description="Dynamic NFTs that evolve as you complete milestones and gain XP"
        />
        <FeatureCard
          icon={<Target className="w-12 h-12" />}
          title="Milestone Verification"
          description="Submit your achievements and get verified by the community"
        />
        <FeatureCard
          icon={<Sparkles className="w-12 h-12" />}
          title="Talent Protocol Integration"
          description="Automatically sync your achievements to boost your Builder Score"
        />
      </section>

      {/* Stats */}
      <section className="bg-white/5 rounded-2xl p-12 max-w-4xl mx-auto backdrop-blur-sm border border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <StatItem label="Skill NFTs" value="1,234" />
          <StatItem label="Milestones" value="5,678" />
          <StatItem label="Builders" value="890" />
          <StatItem label="Total XP" value="1.2M" />
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="space-y-6">
          <Step
            number={1}
            title="Connect Wallet"
            description="Sign in with your Ethereum wallet using Sign-In with Ethereum (SIWE)"
          />
          <Step
            number={2}
            title="Mint Skill NFT"
            description="Choose your skill category and mint a dynamic NFT that represents your expertise"
          />
          <Step
            number={3}
            title="Submit Milestones"
            description="Document your achievements with proof links (GitHub commits, project URLs, etc.)"
          />
          <Step
            number={4}
            title="Get Verified"
            description="Community endorsements or oracle verification awards XP to your Skill NFT"
          />
          <Step
            number={5}
            title="Level Up"
            description="As you gain XP, your NFT levels up, changes rarity, and boosts your Talent Protocol score"
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 card-hover">
      <div className="text-purple-400 mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-white mb-2">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6 items-start bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-cosmic rounded-full flex items-center justify-center text-white font-bold text-xl">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  );
}
