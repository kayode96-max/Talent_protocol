import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';
import { contractService } from '../services/contractService';

const router = Router();

/**
 * Mint a new Skill NFT
 */
router.post('/mint', requireAuth, async (req: Request, res: Response) => {
  try {
    const { category } = req.body;

    const validCategories = [
      'SolidityDev',
      'FrontendDev',
      'BackendDev',
      'AIEngineer',
      'DataScience',
      'Designer',
      'ProductManager',
      'Auditor'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId! }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mint on-chain
    const tokenId = await contractService.mintSkillNFT(user.walletAddress, category);

    // Save to database
    const skillNFT = await prisma.skillNFT.create({
      data: {
        tokenId,
        ownerId: user.id,
        category
      }
    });

    res.json({
      success: true,
      skillNFT: {
        id: skillNFT.id,
        tokenId: skillNFT.tokenId,
        category: skillNFT.category,
        level: skillNFT.level,
        xp: skillNFT.xp
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Skill NFT by token ID
 */
router.get('/:tokenId', async (req: Request, res: Response) => {
  try {
    const tokenId = parseInt(req.params.tokenId);

    const skillNFT = await prisma.skillNFT.findUnique({
      where: { tokenId },
      include: {
        owner: {
          select: {
            walletAddress: true,
            username: true,
            builderScore: true
          }
        },
        milestones: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!skillNFT) {
      return res.status(404).json({ error: 'Skill NFT not found' });
    }

    // Fetch on-chain data
    const onChainData = await contractService.getSkillNFT(tokenId);

    res.json({
      skillNFT: {
        ...skillNFT,
        onChainData
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's Skill NFTs
 */
router.get('/user/:walletAddress', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: req.params.walletAddress.toLowerCase() },
      include: {
        skillNFTs: {
          include: {
            milestones: {
              where: { status: 'Verified' },
              select: { id: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ skillNFTs: user.skillNFTs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync Skill NFT data from blockchain
 */
router.post('/:tokenId/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const tokenId = parseInt(req.params.tokenId);

    const skillNFT = await prisma.skillNFT.findUnique({
      where: { tokenId }
    });

    if (!skillNFT) {
      return res.status(404).json({ error: 'Skill NFT not found' });
    }

    // Fetch on-chain data
    const onChainData = await contractService.getSkillNFT(tokenId);

    // Update database
    await prisma.skillNFT.update({
      where: { tokenId },
      data: {
        level: onChainData.level,
        xp: onChainData.xp,
        rarity: onChainData.rarity,
        totalMilestones: onChainData.totalMilestones,
        metadataUri: onChainData.metadataUri
      }
    });

    res.json({ success: true, onChainData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
