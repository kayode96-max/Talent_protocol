import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TALENT_API_BASE = 'https://api.talentprotocol.com/api/v2';

interface BuilderData {
  walletAddress: string;
  milestones: any[];
  skillNFTs: any[];
}

class TalentProtocolService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TALENT_PROTOCOL_API_KEY || '';
  }

  /**
   * Sync builder achievements to Talent Protocol
   */
  async syncBuilder(user: BuilderData) {
    try {
      // Format achievements for Talent Protocol
      const achievements = user.milestones
        .filter((m: any) => m.status === 'Verified')
        .map((m: any) => ({
          title: m.title,
          description: m.description,
          type: m.type,
          url: m.proofUrl,
          date: m.verifiedAt
        }));

      // Submit to Talent Protocol
      const response = await axios.post(
        `${TALENT_API_BASE}/contributions`,
        {
          wallet_address: user.walletAddress,
          contributions: achievements
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      // Fetch updated builder score
      const builderScore = await this.getBuilderScore(user.walletAddress);

      return {
        success: true,
        builderScore: builderScore.score,
        syncedMilestones: achievements.length
      };
    } catch (error: any) {
      console.error('Error syncing to Talent Protocol:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Builder Score for a wallet
   */
  async getBuilderScore(walletAddress: string) {
    try {
      const response = await axios.get(
        `${TALENT_API_BASE}/passports/${walletAddress}`,
        {
          headers: {
            'X-API-KEY': this.apiKey
          }
        }
      );

      return {
        score: response.data.score || 0,
        passport: response.data
      };
    } catch (error: any) {
      console.error('Error fetching builder score:', error.response?.data || error.message);
      return {
        score: 0,
        passport: null
      };
    }
  }

  /**
   * Get Talent Passport data
   */
  async getPassport(walletAddress: string) {
    try {
      const response = await axios.get(
        `${TALENT_API_BASE}/passports/${walletAddress}`,
        {
          headers: {
            'X-API-KEY': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching passport:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Submit milestone as contribution
   */
  async submitMilestone(walletAddress: string, milestone: any) {
    try {
      const response = await axios.post(
        `${TALENT_API_BASE}/contributions`,
        {
          wallet_address: walletAddress,
          title: milestone.title,
          description: milestone.description,
          url: milestone.proofUrl,
          type: milestone.type.toLowerCase(),
          date: milestone.verifiedAt
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error submitting milestone:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const talentProtocolService = new TalentProtocolService();
