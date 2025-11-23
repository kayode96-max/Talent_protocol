'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { skillNFTApi } from '@/lib/api';
import { Trophy, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const SKILL_CATEGORIES = [
  { value: 'SolidityDev', label: 'Solidity Developer', icon: '⚡', color: 'from-blue-500 to-cyan-500' },
  { value: 'FrontendDev', label: 'Frontend Developer', icon: '🎨', color: 'from-pink-500 to-rose-500' },
  { value: 'BackendDev', label: 'Backend Developer', icon: '⚙️', color: 'from-green-500 to-emerald-500' },
  { value: 'AIEngineer', label: 'AI Engineer', icon: '🤖', color: 'from-purple-500 to-violet-500' },
  { value: 'DataScience', label: 'Data Scientist', icon: '📊', color: 'from-yellow-500 to-orange-500' },
  { value: 'Designer', label: 'Designer', icon: '🎭', color: 'from-indigo-500 to-blue-500' },
  { value: 'ProductManager', label: 'Product Manager', icon: '📱', color: 'from-red-500 to-pink-500' },
  { value: 'Auditor', label: 'Security Auditor', icon: '🔒', color: 'from-gray-500 to-slate-500' },
];

export default function MintPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minting, setMinting] = useState(false);

  const handleMint = async () => {
    if (!selectedCategory) {
      toast.error('Please select a skill category');
      return;
    }

    setMinting(true);
    try {
      const response = await skillNFTApi.mint(selectedCategory);
      toast.success('Skill NFT minted successfully!');
      router.push(`/nft/${response.data.skillNFT.tokenId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mint NFT');
    } finally {
      setMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-20 h-20 text-purple-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Connect Your Wallet
        </h1>
        <p className="text-gray-300">
          Please connect your wallet to mint a Skill NFT
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Mint Your Skill NFT
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Choose your skill category and mint a dynamic NFT that evolves as you complete
          milestones and gain experience
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SKILL_CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedCategory === category.value
                ? 'border-purple-400 bg-purple-500/20 scale-105'
                : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
            }`}
          >
            <div className="text-5xl mb-3">{category.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {category.label}
            </h3>
            <div
              className={`h-1 rounded-full bg-gradient-to-r ${category.color}`}
            />
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">NFT Preview</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className={`rounded-xl p-8 bg-gradient-to-br ${
              SKILL_CATEGORIES.find((c) => c.value === selectedCategory)?.color
            }`}>
              <div className="text-center text-white">
                <div className="text-6xl mb-4">
                  {SKILL_CATEGORIES.find((c) => c.value === selectedCategory)?.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {SKILL_CATEGORIES.find((c) => c.value === selectedCategory)?.label}
                </h3>
                <p className="text-white/80 mb-4">Level 1</p>
                <div className="bg-white/20 rounded-full h-4 mb-2">
                  <div className="bg-white rounded-full h-4 w-0" />
                </div>
                <p className="text-sm text-white/80">0 / 100 XP</p>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Initial Stats</h3>
                <div className="space-y-1 text-gray-300">
                  <p>• Level: 1</p>
                  <p>• XP: 0</p>
                  <p>• Rarity: Common</p>
                  <p>• Milestones: 0</p>
                </div>
              </div>

              <button
                onClick={handleMint}
                disabled={minting}
                className="w-full px-8 py-4 bg-gradient-cosmic text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {minting ? 'Minting...' : 'Mint Skill NFT'}
              </button>

              <p className="text-sm text-gray-400 text-center">
                Your NFT will evolve as you complete milestones and gain XP
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
