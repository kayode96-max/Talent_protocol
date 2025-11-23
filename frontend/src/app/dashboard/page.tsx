'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { userApi, skillNFTApi, milestonesApi } from '@/lib/api';
import { Trophy, Target, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<any>(null);
  const [skillNFTs, setSkillNFTs] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadDashboardData();
    }
  }, [address]);

  const loadDashboardData = async () => {
    try {
      const [statsRes, nftsRes, milestonesRes] = await Promise.all([
        userApi.getStats(address!),
        skillNFTApi.getByUser(address!),
        milestonesApi.getByUser(address!),
      ]);

      setStats(statsRes.data.stats);
      setSkillNFTs(nftsRes.data.skillNFTs);
      setMilestones(milestonesRes.data.milestones);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-20 h-20 text-purple-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Connect Your Wallet
        </h1>
        <p className="text-gray-300 mb-8">
          Please connect your wallet to view your dashboard
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-purple-400 mx-auto"></div>
        <p className="text-gray-300 mt-4">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        <Link
          href="/mint"
          className="px-6 py-3 bg-gradient-cosmic text-white rounded-lg font-semibold hover:opacity-90 transition"
        >
          Mint New Skill NFT
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          icon={<Trophy className="w-8 h-8" />}
          label="Skill NFTs"
          value={stats?.totalSkillNFTs || 0}
        />
        <StatCard
          icon={<Target className="w-8 h-8" />}
          label="Total Milestones"
          value={stats?.totalMilestones || 0}
        />
        <StatCard
          icon={<Award className="w-8 h-8" />}
          label="Verified Milestones"
          value={stats?.verifiedMilestones || 0}
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8" />}
          label="Total XP"
          value={stats?.totalXP || 0}
        />
      </div>

      {/* Skill NFTs */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Your Skill NFTs</h2>
          <Link href="/mint" className="text-purple-400 hover:text-purple-300">
            View All →
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {skillNFTs.slice(0, 3).map((nft) => (
            <SkillNFTCard key={nft.id} nft={nft} />
          ))}
          {skillNFTs.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No Skill NFTs yet</p>
              <Link
                href="/mint"
                className="px-6 py-2 bg-gradient-cosmic text-white rounded-lg inline-block"
              >
                Mint Your First NFT
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recent Milestones */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Milestones</h2>
          <Link
            href="/milestones"
            className="text-purple-400 hover:text-purple-300"
          >
            View All →
          </Link>
        </div>
        <div className="space-y-4">
          {milestones.slice(0, 5).map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
          {milestones.length === 0 && (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No milestones yet</p>
              <Link
                href="/milestones/create"
                className="px-6 py-2 bg-gradient-cosmic text-white rounded-lg inline-block"
              >
                Create Your First Milestone
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="text-purple-400 mb-3">{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

function SkillNFTCard({ nft }: { nft: any }) {
  const getRarityColor = (rarity: string) => {
    const colors: any = {
      Common: 'text-gray-400',
      Uncommon: 'text-green-400',
      Rare: 'text-blue-400',
      Epic: 'text-purple-400',
      Legendary: 'text-yellow-400',
    };
    return colors[rarity] || 'text-gray-400';
  };

  return (
    <Link href={`/nft/${nft.tokenId}`}>
      <div className="bg-gradient-cosmic p-6 rounded-xl card-hover cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white">{nft.category}</h3>
          <span className={`text-sm font-semibold ${getRarityColor(nft.rarity)}`}>
            {nft.rarity}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-200">Level</span>
            <span className="text-white font-bold">{nft.level}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${(nft.xp / 100) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-300">
            <span>XP: {nft.xp}</span>
            <span>{nft.totalMilestones} milestones</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MilestoneCard({ milestone }: { milestone: any }) {
  const getStatusColor = (status: string) => {
    const colors: any = {
      Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Verified: 'bg-green-500/20 text-green-400 border-green-500/30',
      Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      Challenged: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <Link href={`/milestones/${milestone.id}`}>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-white">{milestone.title}</h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
              milestone.status
            )}`}
          >
            {milestone.status}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {milestone.description}
        </p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{milestone.type}</span>
          <span>{new Date(milestone.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
