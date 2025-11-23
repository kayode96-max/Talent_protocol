import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * Get user profile
 */
router.get('/:walletAddress', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: req.params.walletAddress.toLowerCase() },
      include: {
        skillNFTs: {
          include: {
            milestones: {
              where: { status: 'Verified' }
            }
          }
        },
        milestones: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user profile
 */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;

    const user = await prisma.user.update({
      where: { id: req.session.userId! },
      data: {
        username,
        email
      }
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user stats
 */
router.get('/:walletAddress/stats', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: req.params.walletAddress.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [totalSkillNFTs, totalMilestones, verifiedMilestones] = await Promise.all([
      prisma.skillNFT.count({ where: { ownerId: user.id } }),
      prisma.milestone.count({ where: { builderId: user.id } }),
      prisma.milestone.count({
        where: { builderId: user.id, status: 'Verified' }
      })
    ]);

    const totalXP = await prisma.skillNFT.aggregate({
      where: { ownerId: user.id },
      _sum: { xp: true }
    });

    res.json({
      stats: {
        totalSkillNFTs,
        totalMilestones,
        verifiedMilestones,
        totalXP: totalXP._sum.xp || 0,
        builderScore: user.builderScore
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
