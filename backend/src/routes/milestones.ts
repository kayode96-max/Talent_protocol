import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';
import { contractService } from '../services/contractService';
import { githubService } from '../services/githubService';

const router = Router();

// Validation schemas
const createMilestoneSchema = z.object({
  skillNftId: z.number().int().positive(),
  type: z.enum([
    'GitHubCommit',
    'HackathonProject',
    'CourseCompleted',
    'FeatureShipped',
    'ContractDeployed',
    'AuditCompleted',
    'CommunityContribution',
    'Custom'
  ]),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  proofUrl: z.string().url()
});

/**
 * Create a new milestone
 */
router.post('/create', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = createMilestoneSchema.parse(req.body);

    // Verify skill NFT ownership
    const skillNFT = await prisma.skillNFT.findFirst({
      where: {
        tokenId: data.skillNftId,
        ownerId: req.session.userId!
      }
    });

    if (!skillNFT) {
      return res.status(403).json({ error: 'You do not own this Skill NFT' });
    }

    // Create milestone on-chain
    const onChainId = await contractService.createMilestone(
      data.skillNftId,
      data.type,
      data.title,
      data.description,
      data.proofUrl
    );

    // Fetch GitHub data if it's a GitHub milestone
    let githubData = null;
    if (data.type === 'GitHubCommit' && data.proofUrl.includes('github.com')) {
      githubData = await githubService.fetchCommitData(data.proofUrl);
    }

    // Create milestone in database
    const milestone = await prisma.milestone.create({
      data: {
        onChainId,
        builderId: req.session.userId!,
        skillNFTId: skillNFT.id,
        type: data.type,
        title: data.title,
        description: data.description,
        proofUrl: data.proofUrl,
        githubData: githubData ? JSON.parse(JSON.stringify(githubData)) : null
      }
    });

    res.json({
      success: true,
      milestone: {
        id: milestone.id,
        onChainId: milestone.onChainId,
        type: milestone.type,
        title: milestone.title,
        status: milestone.status,
        createdAt: milestone.createdAt
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get milestone by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: req.params.id },
      include: {
        builder: {
          select: {
            walletAddress: true,
            username: true,
            builderScore: true
          }
        },
        skillNFT: {
          select: {
            tokenId: true,
            category: true,
            level: true
          }
        },
        endorsements: {
          include: {
            endorser: {
              select: {
                walletAddress: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    res.json({ milestone });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's milestones
 */
router.get('/user/:walletAddress', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: req.params.walletAddress.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const milestones = await prisma.milestone.findMany({
      where: { builderId: user.id },
      include: {
        skillNFT: {
          select: {
            tokenId: true,
            category: true,
            level: true
          }
        },
        endorsements: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ milestones });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endorse a milestone
 */
router.post('/:id/endorse', requireAuth, async (req: Request, res: Response) => {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: req.params.id }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Check if already endorsed
    const existingEndorsement = await prisma.endorsement.findUnique({
      where: {
        endorserId_milestoneId: {
          endorserId: req.session.userId!,
          milestoneId: milestone.id
        }
      }
    });

    if (existingEndorsement) {
      return res.status(400).json({ error: 'Already endorsed' });
    }

    // Create endorsement
    await prisma.endorsement.create({
      data: {
        endorserId: req.session.userId!,
        milestoneId: milestone.id
      }
    });

    // Endorse on-chain if milestone has on-chain ID
    if (milestone.onChainId !== null) {
      await contractService.endorseMilestone(milestone.onChainId);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify a milestone (Oracle only)
 */
router.post('/:id/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const { xpMultiplier = 100 } = req.body;

    // TODO: Check if user is oracle
    // For now, allowing anyone to verify for demo purposes

    const milestone = await prisma.milestone.findUnique({
      where: { id: req.params.id }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.status !== 'Pending') {
      return res.status(400).json({ error: 'Milestone already processed' });
    }

    // Verify on-chain
    if (milestone.onChainId !== null) {
      await contractService.verifyMilestone(milestone.onChainId, xpMultiplier);
    }

    // Update database
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        status: 'Verified',
        verifiedAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
