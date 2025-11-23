# 🌌 CosmicCreator

**A Web3 Talent Verification & Skill Tokenization Protocol**

CosmicCreator is a decentralized platform where builders verify their skills, document milestones, receive endorsements, and mint "Skill NFTs" that evolve as they complete on-chain tasks. Built with deep integration into **Talent Protocol** to automatically boost your Builder Score.

---

## 🎯 Features

### 🏆 On-Chain Skill NFTs
- **Dynamic ERC-721 NFTs** representing skills (Solidity Dev, AI Engineer, Designer, etc.)
- **Evolving metadata** that updates as achievements are validated
- **Level system (1-100)** with exponential XP requirements
- **5 rarity tiers**: Common → Uncommon → Rare → Epic → Legendary
- **On-chain SVG generation** for fully decentralized metadata

### 📊 Milestone Proof Engine
- Submit milestones with proof (GitHub commits, hackathon projects, courses, etc.)
- **Community endorsements** for validation
- **Oracle verification** for official XP awards
- **Challenge system** for disputed milestones
- Each milestone triggers XP gain and NFT evolution

### 🔗 Talent Protocol Integration
- **Automatic syncing** of verified milestones to Talent Protocol
- **Builder Score updates** via contribution endpoints
- **Real-time dashboard** displaying your Talent Passport data
- Push achievements to boost your Web3 reputation

### 💰 Reputation Market
- **Tip builders** to show support and award reputation
- **Endorse skill NFTs** using reputation points
- **Stake on builders** to invest in their success
- **Reputation-weighted governance** for protocol decisions
- **Builder Seasons** with leaderboards and rewards

---

## 🛠 Tech Stack

### Smart Contracts
- **Solidity 0.8.24** - Latest stable version with custom errors
- **Foundry** - Fast, modern development framework
- **OpenZeppelin** - Battle-tested contract libraries
- **On-chain SVG** - Fully decentralized NFT metadata

### Backend
- **Node.js + TypeScript** - Type-safe server development
- **Express** - Fast, minimal web framework
- **Prisma** - Modern database ORM with type safety
- **PostgreSQL** - Robust relational database
- **Ethers.js v6** - Ethereum interaction library

### Frontend
- **Next.js 15** - React framework with App Router
- **TailwindCSS** - Utility-first styling
- **Wagmi v2** - React hooks for Ethereum
- **RainbowKit** - Beautiful wallet connection
- **Viem** - TypeScript Ethereum library

### Integrations
- **Talent Protocol API** - Builder Score synchronization
- **GitHub API** - Commit verification
- **IPFS/Pinata** - Decentralized storage (optional)
- **SIWE** - Sign-in with Ethereum authentication

---

## 📁 Project Structure

```
cosmic-creator/
├── contracts/              # Smart contracts (Foundry)
│   ├── src/
│   │   ├── SkillNFT.sol              # Dynamic skill NFTs
│   │   ├── MilestoneVerifier.sol      # Milestone validation
│   │   └── ReputationMarket.sol       # Reputation & staking
│   ├── script/
│   │   └── Deploy.s.sol               # Deployment script
│   ├── test/
│   │   └── CosmicCreator.t.sol        # Contract tests
│   └── foundry.toml
│
├── backend/                # API server (Node.js + TypeScript)
│   ├── src/
│   │   ├── routes/                     # API endpoints
│   │   ├── services/                   # Business logic
│   │   ├── middleware/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma              # Database schema
│   └── package.json
│
├── frontend/               # Next.js 15 application
│   ├── src/
│   │   ├── app/                        # App Router pages
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
└── docs/                   # Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+ and npm
- **PostgreSQL** database
- **Foundry** - Install: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cosmic-creator.git
   cd cosmic-creator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Foundry dependencies**
   ```bash
   cd contracts
   forge install OpenZeppelin/openzeppelin-contracts --no-commit
   cd ..
   ```

---

## 📦 Setup & Configuration

### 1. Smart Contracts Setup

```bash
cd contracts
cp .env.example .env
# Edit .env with your values
```

**Run tests:**
```bash
forge test -vvv
```

**Deploy to testnet (Sepolia):**
```bash
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

**Setup database:**
```bash
npm run prisma:migrate
npm run prisma:generate
```

**Start development server:**
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
```

**Start development server:**
```bash
npm run dev
```

Visit **http://localhost:3000**

---

## 🎮 Usage Guide

### For Builders

1. **Connect Wallet** - Sign message to authenticate
2. **Mint Skill NFT** - Choose your skill category
3. **Create Milestones** - Submit achievements with proof
4. **Get Verified** - Community endorsement or oracle verification
5. **Sync to Talent Protocol** - Boost your Builder Score automatically

### For Community Members

- **Endorse milestones** to help builders get verified
- **Challenge suspicious** milestones to maintain quality
- **Tip builders** to show support and award reputation
- **Stake on builders** to invest in their growth

---

## 🔧 API Documentation

### Authentication

**POST** `/api/auth/verify`
```json
{
  "message": "SIWE message",
  "signature": "0x..."
}
```

### Milestones

**POST** `/api/milestones/create`
```json
{
  "skillNftId": 1,
  "type": "GitHubCommit",
  "title": "Fixed bug",
  "description": "...",
  "proofUrl": "https://github.com/..."
}
```

**GET** `/api/milestones/user/:walletAddress`

### Skill NFTs

**POST** `/api/skill-nft/mint`
```json
{
  "category": "SolidityDev"
}
```

**GET** `/api/skill-nft/:tokenId`

### Talent Protocol

**POST** `/api/talent/sync`

**GET** `/api/talent/builder-score/:walletAddress`

---

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
forge test -vvv                    # Run all tests
forge coverage                      # Coverage report
```

---

## 🚢 Deployment

### Production Deployment

1. **Deploy contracts to mainnet**
   ```bash
   cd contracts
   forge script script/Deploy.s.sol:Deploy --rpc-url mainnet --broadcast --verify
   ```

2. **Deploy backend** - Configure production database and deploy to your hosting

3. **Deploy frontend**
   ```bash
   cd frontend
   npm run build
   # Deploy to Vercel/Netlify
   ```

---

## 🤝 Contributing

We welcome contributions! 

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgments

- **Talent Protocol** - For providing the Builder Score infrastructure
- **OpenZeppelin** - For secure smart contract libraries
- **Foundry** - For the amazing development toolkit
- **RainbowKit** - For beautiful wallet connections

---

## 🗺 Roadmap

- [x] Core smart contracts with dynamic NFTs
- [x] Milestone verification system
- [x] Talent Protocol integration
- [x] Frontend dashboard and NFT minting
- [ ] AI-powered milestone evaluation
- [ ] Mobile app (React Native)
- [ ] Cross-chain deployment (Base, Arbitrum, Optimism)
- [ ] DAO governance for protocol upgrades
- [ ] Builder marketplace
- [ ] Skill tree visualization

---

**Built with ❤️ for the builder community**

*Empowering builders to own their reputation on-chain.*
