import axios from 'axios';

const GITHUB_API_URL = import.meta.env.VITE_GITHUB_API_URL || 'https://api.github.com';

class GitHubService {
  constructor() {
    this.client = axios.create({
      baseURL: GITHUB_API_URL,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('github_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // OAuth flow methods
  async initiateOAuth() {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(import.meta.env.VITE_APP_CALLBACK_URL);
    const scope = 'public_repo read:user user:email';
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    return authUrl;
  }

  async exchangeCodeForToken(code) {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET;
    const redirectUri = import.meta.env.VITE_APP_CALLBACK_URL;

    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }, {
        headers: {
          'Accept': 'application/json',
        },
      });

      const token = response.data.access_token;
      localStorage.setItem('github_token', token);
      return token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  // Repository methods
  async getUserRepositories(page = 1, perPage = 30) {
    try {
      const response = await this.client.get('/user/repos', {
        params: {
          page,
          per_page: perPage,
          sort: 'updated',
          direction: 'desc',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user repositories:', error);
      throw error;
    }
  }

  async getRepository(owner, repo) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching repository:', error);
      throw error;
    }
  }

  async getRepositoryCommits(owner, repo, options = {}) {
    const { page = 1, perPage = 100, since, until, sha = 'main' } = options;
    
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/commits`, {
        params: {
          page,
          per_page: perPage,
          since,
          until,
          sha,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching commits:', error);
      throw error;
    }
  }

  async getRepositoryStats(owner, repo) {
    try {
      const [contributors, languages, commits] = await Promise.all([
        this.client.get(`/repos/${owner}/${repo}/contributors`),
        this.client.get(`/repos/${owner}/${repo}/languages`),
        this.getRepositoryCommits(owner, repo, { perPage: 1 }),
      ]);

      return {
        contributorsCount: contributors.data.length,
        languages: languages.data,
        totalCommits: commits.headers['x-total-commits'] || commits.length,
      };
    } catch (error) {
      console.error('Error fetching repository stats:', error);
      throw error;
    }
  }

  async getCommitDetails(owner, repo, sha) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/commits/${sha}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching commit details:', error);
      throw error;
    }
  }

  async getUserProfile() {
    try {
      const response = await this.client.get('/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // GraphQL methods for more complex queries
  async fetchCommitsWithStats(owner, repo, since, until, maxCommits = 500) {
    const query = `
      query($owner: String!, $repo: String!, $since: GitTimestamp, $until: GitTimestamp, $maxCommits: Int!) {
        repository(owner: $owner, name: $repo) {
          defaultBranchRef {
            target {
              ... on Commit {
                history(since: $since, until: $until, first: $maxCommits) {
                  edges {
                    node {
                      oid
                      message
                      author {
                        name
                        email
                        date
                      }
                      additions
                      deletions
                      changedFiles
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.post('/graphql', {
        query,
        variables: { owner, repo, since, until, maxCommits },
      });
      
      const history = response.data.data.repository.defaultBranchRef.target.history;
      return history.edges.map(edge => edge.node);
    } catch (error) {
      console.error('Error fetching commits with stats:', error);
      throw error;
    }
  }

  // Rate limiting info
  async getRateLimit() {
    try {
      const response = await this.client.get('/rate_limit');
      return response.data;
    } catch (error) {
      console.error('Error fetching rate limit:', error);
      throw error;
    }
  }

  clearAuthToken() {
    localStorage.removeItem('github_token');
  }

  isAuthenticated() {
    return !!localStorage.getItem('github_token');
  }
}

export const githubService = new GitHubService();
