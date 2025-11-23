import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class GitHubService {
  private token: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || '';
  }

  /**
   * Fetch commit data from GitHub
   */
  async fetchCommitData(url: string) {
    try {
      // Parse GitHub URL to extract owner, repo, and commit SHA
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/commit\/([a-f0-9]+)/i);
      
      if (!match) {
        throw new Error('Invalid GitHub commit URL');
      }

      const [, owner, repo, sha] = match;

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );

      return {
        sha: response.data.sha,
        message: response.data.commit.message,
        author: response.data.commit.author.name,
        date: response.data.commit.author.date,
        stats: response.data.stats,
        filesChanged: response.data.files?.length || 0,
        additions: response.data.stats?.additions || 0,
        deletions: response.data.stats?.deletions || 0
      };
    } catch (error: any) {
      console.error('Error fetching GitHub data:', error.message);
      return null;
    }
  }

  /**
   * Verify GitHub repository exists
   */
  async verifyRepository(owner: string, repo: string): Promise<boolean> {
    try {
      await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get user's GitHub contributions
   */
  async getUserContributions(username: string) {
    try {
      const response = await axios.get(
        `https://api.github.com/users/${username}/events/public`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching GitHub contributions:', error.message);
      return [];
    }
  }
}

export const githubService = new GitHubService();
