import 'express-session';

declare module 'express-session' {
  interface SessionData {
    nonce?: string;
    userId?: number;
    walletAddress?: string;
  }
}
