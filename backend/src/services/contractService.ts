import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// ABIs (simplified for demo - include full ABIs in production)
const SKILL_NFT_ABI = [
  'function mint(address to, uint8 category) external returns (uint256)',
  'function getSkill(uint256 tokenId) external view returns (tuple(uint8 category, uint256 level, uint256 xp, uint256 totalMilestones, uint8 rarity, uint256 createdAt, uint256 lastUpdated))',
  'function tokenURI(uint256 tokenId) external view returns (string)'
];

const MILESTONE_VERIFIER_ABI = [
  'function createMilestone(uint256 skillNftId, uint8 milestoneType, string title, string description, string proofUrl) external returns (uint256)',
  'function verifyMilestone(uint256 milestoneId, uint256 xpMultiplier) external',
  'function endorseMilestone(uint256 milestoneId) external',
  'function getMilestone(uint256 milestoneId) external view returns (tuple(address builder, uint256 skillNftId, uint8 milestoneType, string title, string description, string proofUrl, uint256 xpAwarded, uint8 status, uint256 createdAt, uint256 verifiedAt, address verifier, uint256 endorsements, uint256 challenges))'
];

class ContractService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private skillNFT: ethers.Contract;
  private milestoneVerifier: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY || '', this.provider);
    
    this.skillNFT = new ethers.Contract(
      process.env.SKILL_NFT_ADDRESS || '',
      SKILL_NFT_ABI,
      this.wallet
    );
    
    this.milestoneVerifier = new ethers.Contract(
      process.env.MILESTONE_VERIFIER_ADDRESS || '',
      MILESTONE_VERIFIER_ABI,
      this.wallet
    );
  }

  /**
   * Mint a new Skill NFT
   */
  async mintSkillNFT(to: string, category: string): Promise<number> {
    const categoryIndex = this.getCategoryIndex(category);
    const tx = await this.skillNFT.mint(to, categoryIndex);
    const receipt = await tx.wait();
    
    // Parse SkillMinted event to get token ID
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = this.skillNFT.interface.parseLog(log);
        return parsed?.name === 'SkillMinted';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = this.skillNFT.interface.parseLog(event);
      return Number(parsed?.args.tokenId);
    }
    
    throw new Error('Failed to get token ID from mint transaction');
  }

  /**
   * Get Skill NFT data
   */
  async getSkillNFT(tokenId: number) {
    const skill = await this.skillNFT.getSkill(tokenId);
    const metadataUri = await this.skillNFT.tokenURI(tokenId);
    
    return {
      category: this.getCategoryName(skill.category),
      level: Number(skill.level),
      xp: Number(skill.xp),
      totalMilestones: Number(skill.totalMilestones),
      rarity: this.getRarityName(skill.rarity),
      createdAt: Number(skill.createdAt),
      lastUpdated: Number(skill.lastUpdated),
      metadataUri
    };
  }

  /**
   * Create a milestone on-chain
   */
  async createMilestone(
    skillNftId: number,
    type: string,
    title: string,
    description: string,
    proofUrl: string
  ): Promise<number> {
    const typeIndex = this.getMilestoneTypeIndex(type);
    const tx = await this.milestoneVerifier.createMilestone(
      skillNftId,
      typeIndex,
      title,
      description,
      proofUrl
    );
    const receipt = await tx.wait();
    
    // Parse MilestoneCreated event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = this.milestoneVerifier.interface.parseLog(log);
        return parsed?.name === 'MilestoneCreated';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = this.milestoneVerifier.interface.parseLog(event);
      return Number(parsed?.args.milestoneId);
    }
    
    throw new Error('Failed to get milestone ID from transaction');
  }

  /**
   * Verify a milestone
   */
  async verifyMilestone(milestoneId: number, xpMultiplier: number = 100) {
    const tx = await this.milestoneVerifier.verifyMilestone(milestoneId, xpMultiplier);
    await tx.wait();
  }

  /**
   * Endorse a milestone
   */
  async endorseMilestone(milestoneId: number) {
    const tx = await this.milestoneVerifier.endorseMilestone(milestoneId);
    await tx.wait();
  }

  // Helper methods
  private getCategoryIndex(category: string): number {
    const categories = [
      'SolidityDev',
      'FrontendDev',
      'BackendDev',
      'AIEngineer',
      'DataScience',
      'Designer',
      'ProductManager',
      'Auditor'
    ];
    return categories.indexOf(category);
  }

  private getCategoryName(index: number): string {
    const categories = [
      'SolidityDev',
      'FrontendDev',
      'BackendDev',
      'AIEngineer',
      'DataScience',
      'Designer',
      'ProductManager',
      'Auditor'
    ];
    return categories[index] || 'Unknown';
  }

  private getRarityName(index: number): string {
    const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    return rarities[index] || 'Unknown';
  }

  private getMilestoneTypeIndex(type: string): number {
    const types = [
      'GitHubCommit',
      'HackathonProject',
      'CourseCompleted',
      'FeatureShipped',
      'ContractDeployed',
      'AuditCompleted',
      'CommunityContribution',
      'Custom'
    ];
    return types.indexOf(type);
  }
}

export const contractService = new ContractService();
