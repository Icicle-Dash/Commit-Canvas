import React, { useState, useEffect } from 'react';
import { useGitHubData } from '../../hooks/useGitHubData.js';

export default function RepoSelector({ onRepositorySelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const {
    repositories,
    loading,
    error,
    fetchRepositories,
    clear: clearData,
  } = useGitHubData();

  // Initialize and fetch repositories
  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  // Filter repositories based on search
  useEffect(() => {
    let filtered = repositories;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = repositories.filter(repo =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query)
      );
    }
    
    // Sort by last updated
    filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    setFilteredRepos(filtered);
  }, [repositories, searchQuery]);

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    onRepositorySelect?.(repo);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = Math.floor(repositories.length / 30) + 1;
      await fetchRepositories(nextPage);
    } catch (err) {
      console.error('Failed to load more repositories:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    clearData();
    fetchRepositories();
    setSearchQuery('');
    setFilteredRepos([]);
  };

  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      'C#': '#555555',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      Rust: '#dea584',
      Swift: '#ffac45',
      Kotlin: '#A97BFF',
      Dart: '#00B4AB',
    };
    return colors[language] || '#6c757d';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Repositories</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-black">
      {/* Repository List */}
      <div className="w-full max-w-2xl border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-4">Select Repository</h1>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div className="absolute left-10 pl-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Stats */}
          {repositories.length > 0 && (
            <div className="mt-4 text-sm text-gray-400">
              Showing {filteredRepos.length} of {repositories.length} repositories
            </div>
          )}
        </div>

        {/* Repository List */}
        <div className="flex-1 overflow-y-auto">
          {loading && filteredRepos.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4 mx-auto"></div>
                <p className="text-gray-400">Loading repositories...</p>
              </div>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-400">No repositories found</p>
                {searchQuery && (
                  <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => handleRepoSelect(repo)}
                  className={`p-4 hover:bg-gray-900 cursor-pointer transition-colors ${
                    selectedRepo?.id === repo.id ? 'bg-gray-900' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold truncate">
                          {repo.owner.login} / {repo.name}
                        </h3>
                        {repo.fork && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                            Fork
                          </span>
                        )}
                        {repo.private && (
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      {repo.description && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          {repo.language && (
                            <>
                              <span 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: getLanguageColor(repo.language) }}
                              />
                              {repo.language}
                            </>
                          )}
                        </div>
                        
                        {repo.stargazers_count > 0 && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {repo.stargazers_count.toLocaleString()}
                          </div>
                        )}
                        
                        {repo.fork_count > 0 && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                            {repo.fork_count.toLocaleString()}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          Updated {formatDate(repo.updated_at)}
                        </div>
                      </div>
                    </div>
                    
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {repositories.length > 0 && repositories.length % 30 === 0 && (
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Welcome Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-gray-400 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Select a Repository</h2>
          <p className="text-gray-400 mb-6">
            Choose a repository from the list to start visualizing its commit history as beautiful generative art.
          </p>
          <div className="space-y-3 text-sm text-gray-500 text-left">
            <div className="flex items-center gap-3">
              <span className="text-blue-400">📊</span>
              <span>View commit patterns over time</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-purple-400">🎨</span>
              <span>See colored particles for each author</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">🔗</span>
              <span>Explore commit relationships</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
