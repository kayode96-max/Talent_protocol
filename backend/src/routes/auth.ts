import { Router, Request, Response } from 'express';
import { SiweMessage } from 'siwe';
import { prisma } from '../utils/prisma';

const router = Router();

/**
 * Generate nonce for SIWE authentication
 */
router.get('/nonce', (req: Request, res: Response) => {
  const nonce = Math.random().toString(36).substring(2);
  req.session.nonce = nonce;
  res.json({ nonce });
});

/**
 * Verify SIWE message and create session
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { message, signature } = req.body;

    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature, nonce: req.session.nonce });

    if (fields.data.nonce !== req.session.nonce) {
      return res.status(422).json({ error: 'Invalid nonce' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: fields.data.address.toLowerCase() }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: fields.data.address.toLowerCase()
        }
      });
    }

    // Set session
    req.session.userId = user.id;
    req.session.walletAddress = user.walletAddress;

    res.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        builderScore: user.builderScore
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get current session
 */
router.get('/session', async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      builderScore: user.builderScore
    }
  });
});

/**
 * Logout
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true });
  });
});

export default router;
