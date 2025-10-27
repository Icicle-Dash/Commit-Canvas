import { useState, useEffect, useCallback, useRef } from 'react';
import { githubService } from '../services/github.js';

export function useGitHubData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [commits, setCommits] = useState([]);
  const [currentRepo, setCurrentRepo] = useState(null);
  const [repoStats, setRepoStats] = useState(null);
  const abortControllerRef = useRef(null);

  // Cancel any ongoing requests
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
  }, []);

  // Fetch user repositories
  const fetchRepositories = useCallback(async (page = 1) => {
    cancelRequests();
    setLoading(true);
    setError(null);

    try {
      const repos = await githubService.getUserRepositories(page);
      if (page === 1) {
        setRepositories(repos);
      } else {
        setRepositories(prev => [...prev, ...repos]);
      }
      return repos;
    } catch (err) {
      setError(err.message || 'Failed to fetch repositories');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cancelRequests]);

  // Fetch commits for a repository
  const fetchCommits = useCallback(async (owner, repo, options = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const commits = await githubService.fetchCommitsWithStats(
        owner, 
        repo, 
        options.since, 
        options.until, 
        options.maxCommits || 500
      );

      // Store repository info
      if (!currentRepo || currentRepo.full_name !== `${owner}/${repo}`) {
        const repoInfo = await githubService.getRepository(owner, repo);
        setCurrentRepo(repoInfo);
      }

      setCommits(commits);
      return commits;
    } catch (err) {
      setError(err.message || 'Failed to fetch commits');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentRepo]);

  // Fetch repository statistics
  const fetchRepoStats = useCallback(async (owner, repo) => {
    setLoading(true);
    setError(null);

    try {
      const stats = await githubService.getRepositoryStats(owner, repo);
      setRepoStats(stats);
      return stats;
    } catch (err) {
      setError(err.message || 'Failed to fetch repository stats');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search repositories by name
  const searchRepositories = useCallback(async (query) => {
    if (!query) {
      await fetchRepositories();
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      // This would require GitHub search API
      // For now, filter local repositories
      const filtered = repositories.filter(repo => 
        repo.name.toLowerCase().includes(query.toLowerCase()) ||
        repo.description?.toLowerCase().includes(query.toLowerCase())
      );
      return filtered;
    } catch (err) {
      setError(err.message || 'Failed to search repositories');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [repositories, fetchRepositories]);

  // Load commits with progress tracking
  const loadCommitsWithProgress = useCallback(async (owner, repo, onProgress) => {
    setLoading(true);
    setError(null);

    try {
      const allCommits = [];
      let page = 1;
      let hasMore = true;
      const maxPages = 10; // Limit to prevent excessive requests

      // First, get repository info
      const repoInfo = await githubService.getRepository(owner, repo);
      setCurrentRepo(repoInfo);

      while (hasMore && page <= maxPages) {
        try {
          const pageCommits = await githubService.getRepositoryCommits(owner, repo, {
            page,
            perPage: 100,
          });

          if (pageCommits.length === 0) {
            hasMore = false;
          } else {
            allCommits.push(...pageCommits);
            if (onProgress) {
              onProgress(allCommits.length, pageCommits.length);
            }
            page++;
          }
        } catch (err) {
          if (err.response?.status === 409) {
            // Empty repository
            hasMore = false;
          } else {
            throw err;
          }
        }
      }

      setCommits(allCommits);
      return allCommits;
    } catch (err) {
      setError(err.message || 'Failed to load commits');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get commits filtered by date range
  const getCommitsInDateRange = useCallback((startDate, endDate) => {
    if (!commits.length) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);

    return commits.filter(commit => {
      const date = new Date(commit.author.date);
      return date >= start && date <= end;
    });
  }, [commits]);

  // Get commits by author
  const getCommitsByAuthor = useCallback((authorEmail) => {
    if (!commits.length) return [];

    return commits.filter(commit => 
      commit.author.email === authorEmail || commit.author.name === authorEmail
    );
  }, [commits]);

  // Get commit statistics
  const getCommitStatistics = useCallback(() => {
    if (!commits.length) return {};

    const stats = {
      totalCommits: commits.length,
      totalAdditions: commits.reduce((sum, commit) => sum + (commit.additions || 0), 0),
      totalDeletions: commits.reduce((sum, commit) => sum + (commit.deletions || 0), 0),
      totalFiles: commits.reduce((sum, commit) => sum + (commit.changedFiles || 0), 0),
      authors: {},
      dateRange: { start: null, end: null },
    };

    // Calculate author stats
    commits.forEach(commit => {
      const authorId = commit.author.email || commit.author.name;
      
      if (!stats.authors[authorId]) {
        stats.authors[authorId] = {
          name: commit.author.name || commit.author.email,
          commits: 0,
          additions: 0,
          deletions: 0,
          files: 0,
        };
      }

      stats.authors[authorId].commits++;
      stats.authors[authorId].additions += commit.additions || 0;
      stats.authors[authorId].deletions += commit.deletions || 0;
      stats.authors[authorId].files += commit.changedFiles || 0;
    });

    // Calculate date range
    const dates = commits.map(c => new Date(c.author.date)).sort((a, b) => a - b);
    if (dates.length > 0) {
      stats.dateRange = {
        start: dates[0],
        end: dates[dates.length - 1],
      };
    }

    return stats;
  }, [commits]);

  // Refresh data
  const refresh = useCallback(async () => {
    if (currentRepo) {
      const [owner, repo] = currentRepo.full_name.split('/');
      await fetchCommits(owner, repo);
      await fetchRepoStats(owner, repo);
    }
  }, [currentRepo, fetchCommits, fetchRepoStats]);

  // Clear data
  const clear = useCallback(() => {
    cancelRequests();
    setCommits([]);
    setCurrentRepo(null);
    setRepoStats(null);
    setError(null);
  }, [cancelRequests]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRequests();
    };
  }, [cancelRequests]);

  return {
    // State
    loading,
    error,
    repositories,
    commits,
    currentRepo,
    repoStats,
    
    // Methods
    fetchRepositories,
    fetchCommits,
    fetchRepoStats,
    searchRepositories,
    loadCommitsWithProgress,
    getCommitsInDateRange,
    getCommitsByAuthor,
    getCommitStatistics,
    refresh,
    clear,
    
    // Computed state
    isAuthenticated: githubService.isAuthenticated(),
  };
}
