import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';
import { talentProtocolService } from '../services/talentProtocolService';

const router = Router();

/**
 * Sync achievements to Talent Protocol
 */
router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId! },
      include: {
        milestones: {
          where: { status: 'Verified' }
        },
        skillNFTs: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Sync to Talent Protocol
    const result = await talentProtocolService.syncBuilder(user);

    // Save sync record
    await prisma.talentSync.create({
      data: {
        walletAddress: user.walletAddress,
        syncType: 'achievement_sync',
        data: JSON.parse(JSON.stringify(result)),
        success: result.success
      }
    });

    // Update builder score if successful
    if (result.success && result.builderScore) {
      await prisma.user.update({
        where: { id: user.id },
        data: { builderScore: result.builderScore }
      });
    }

    res.json({
      success: true,
      builderScore: result.builderScore,
      syncedMilestones: result.syncedMilestones
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Builder Score from Talent Protocol
 */
router.get('/builder-score/:walletAddress', async (req: Request, res: Response) => {
  try {
    const builderScore = await talentProtocolService.getBuilderScore(
      req.params.walletAddress
    );

    // Update in database
    const user = await prisma.user.findUnique({
      where: { walletAddress: req.params.walletAddress.toLowerCase() }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { builderScore: builderScore.score }
      });
    }

    res.json({ builderScore });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Talent Passport data
 */
router.get('/passport/:walletAddress', async (req: Request, res: Response) => {
  try {
    const passport = await talentProtocolService.getPassport(
      req.params.walletAddress
    );

    res.json({ passport });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
