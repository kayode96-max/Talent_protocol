# CosmicCreator Development Guide

## Quick Start Commands

### Development
```bash
# Root level - run everything
npm run dev

# Individual services
npm run dev:contracts  # Watch mode for contract tests
npm run dev:backend    # Start API server
npm run dev:frontend   # Start Next.js dev server
```

### Building
```bash
npm run build          # Build everything
npm run build:contracts
npm run build:backend
npm run build:frontend
```

### Testing
```bash
npm run test           # Run all tests
npm run test:contracts # Foundry tests with gas reports
npm run test:backend   # Backend unit tests
```

## Architecture Overview

### Smart Contracts Layer

**SkillNFT.sol**
- ERC-721 dynamic NFT representing builder skills
- On-chain SVG generation for metadata
- Level and XP system with exponential curves
- Rarity tiers that upgrade with level
- Only MilestoneVerifier can add XP

**MilestoneVerifier.sol**
- Creates and validates milestones
- Community endorsement system (3 endorsements = auto-verify)
- Challenge system for disputed milestones
- Oracle-based verification with signatures
- Configurable XP rewards per milestone type

**ReputationMarket.sol**
- Tip builders to award reputation
- Stake on builders' success
- Reputation-weighted governance
- Builder seasons with leaderboards

### Backend Layer

**Core Services:**
- `contractService.ts` - Blockchain interactions via ethers.js
- `talentProtocolService.ts` - Talent Protocol API integration
- `githubService.ts` - GitHub verification

**API Routes:**
- `/api/auth` - SIWE authentication
- `/api/milestones` - CRUD for milestones
- `/api/skill-nft` - NFT operations
- `/api/talent` - Talent Protocol sync
- `/api/user` - User profiles and stats

**Database (Prisma):**
- Users with wallet addresses
- SkillNFTs (synced from blockchain)
- Milestones with verification data
- Endorsements tracking
- TalentSync logs

### Frontend Layer

**Pages:**
- `/` - Landing page with features
- `/dashboard` - User stats, NFTs, milestones
- `/mint` - Mint new Skill NFT
- `/nft/[id]` - Individual NFT view
- `/milestones` - Browse and create milestones
- `/profile/[address]` - Public user profile

**Key Components:**
- `Header.tsx` - Navigation with wallet connection
- `SkillNFTCard.tsx` - Display NFT with progress
- `MilestoneCard.tsx` - Milestone display with status
- Web3 providers (Wagmi + RainbowKit)

## Database Schema

```prisma
User {
  id: String
  walletAddress: String (unique)
  builderScore: Int
  skillNFTs: SkillNFT[]
  milestones: Milestone[]
}

SkillNFT {
  id: String
  tokenId: Int (unique)
  owner: User
  category: String
  level: Int
  xp: Int
  rarity: String
}

Milestone {
  id: String
  onChainId: Int
  builder: User
  skillNFT: SkillNFT
  type: String
  title: String
  description: String
  status: String (Pending/Verified/Rejected)
  xpAwarded: Int
  endorsements: Endorsement[]
}
```

## Environment Setup

### Required API Keys

1. **Alchemy** - RPC provider
   - Sign up: https://www.alchemy.com/
   - Create app on Sepolia/Base Sepolia

2. **Talent Protocol**
   - Get API key: https://docs.talentprotocol.com/
   - Required for Builder Score integration

3. **GitHub Token** (optional)
   - For commit verification
   - Settings → Developer settings → Personal access tokens

4. **WalletConnect Project ID**
   - Required for RainbowKit
   - https://cloud.walletconnect.com/

### Database Setup

**PostgreSQL Installation:**

Windows:
```bash
# Using Chocolatey
choco install postgresql

# Or download from postgresql.org
```

**Create Database:**
```bash
psql -U postgres
CREATE DATABASE cosmic_creator;
\q
```

**Run Migrations:**
```bash
cd backend
npm run prisma:migrate
```

## Talent Protocol Integration

### How it Works

1. User completes milestone → gets verified
2. Backend calls `/api/talent/sync`
3. Verified milestones formatted as "contributions"
4. Posted to Talent Protocol API
5. Builder Score fetched and updated in DB
6. Dashboard displays updated score

### API Endpoints Used

- `POST /api/v2/contributions` - Submit achievements
- `GET /api/v2/passports/:address` - Get Builder Score

### Example Integration
```typescript
// Sync after milestone verification
await talentProtocolService.syncBuilder({
  walletAddress: user.address,
  milestones: verifiedMilestones
});

// Fetch updated score
const score = await talentProtocolService.getBuilderScore(address);
```

## Testing Guide

### Contract Testing

**Run specific test:**
```bash
forge test --match-test testMintSkillNFT -vvv
```

**Gas reporting:**
```bash
forge test --gas-report
```

**Coverage:**
```bash
forge coverage --report lcov
```

**Fork testing:**
```bash
forge test --fork-url $SEPOLIA_RPC_URL
```

### Integration Testing

Test the full flow:
1. Deploy contracts locally (Anvil)
2. Start backend with local RPC
3. Run frontend
4. Test wallet connection → mint → milestone → verify

## Common Issues & Solutions

### Issue: "Cannot find module 'winston'"
**Solution:** 
```bash
cd backend && npm install
```

### Issue: Contract deployment fails
**Solution:**
- Check wallet has ETH on testnet
- Verify RPC URL is correct
- Check gas price isn't too low

### Issue: Prisma client not generated
**Solution:**
```bash
cd backend
npm run prisma:generate
```

### Issue: Frontend can't connect to contracts
**Solution:**
- Verify contract addresses in `.env.local`
- Check correct network selected in wallet
- Ensure contracts are deployed on that network

## Performance Optimization

### Smart Contracts
- Use custom errors (saves gas)
- Batch operations where possible
- Minimize storage writes
- Use events for off-chain indexing

### Backend
- Cache Talent Protocol responses
- Use database indexes on frequently queried fields
- Implement rate limiting
- Use connection pooling for database

### Frontend
- Code splitting with Next.js dynamic imports
- Image optimization
- Lazy load components below fold
- Cache API responses with React Query

## Security Considerations

### Smart Contracts
- Owner-only functions for admin operations
- Reentrancy guards on financial functions
- Input validation on all parameters
- Rate limiting on minting/verifications

### Backend
- SIWE for secure authentication
- Session management with secure cookies
- Input validation with Zod
- Rate limiting on API endpoints
- SQL injection prevention with Prisma

### Frontend
- Sanitize user inputs
- Validate signatures client-side
- HTTPS only in production
- CSP headers configured

## Deployment Checklist

- [ ] Audit smart contracts
- [ ] Test on testnet for 1 week
- [ ] Deploy contracts to mainnet
- [ ] Verify contracts on Etherscan
- [ ] Configure production database
- [ ] Set all environment variables
- [ ] Deploy backend to hosting
- [ ] Deploy frontend to Vercel
- [ ] Test full user flow on production
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure analytics
- [ ] Prepare incident response plan

## Support

For development questions:
- Check GitHub Issues
- Join Discord #dev-help channel
- Read inline code documentation
