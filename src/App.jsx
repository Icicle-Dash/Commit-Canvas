import React, { useState, useEffect, useCallback } from 'react';
import GitHubLogin from './components/Auth/GitHubLogin.jsx';
import RepoSelector from './components/Repository/RepoSelector.jsx';
import CanvasView from './components/Visualization/CanvasView.jsx';
import GraphView from './components/Visualization/GraphView.jsx';
import { useTheme } from './hooks/useTheme.js';
import { authService } from './services/auth.js';
import { useGitHubData } from './hooks/useGitHubData.js';

function App() {
  const [authState, setAuthState] = useState({ authenticated: false, user: null });
  const [currentView, setCurrentView] = useState('repo-selection');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('canvas');
  const { theme, toggleTheme, isDark, mounted } = useTheme();
  
  const {
    commits,
    loading,
    error,
    fetchCommits,
    getCommitStatistics,
    clear,
  } = useGitHubData();

  // Initialize auth
  useEffect(() => {
    return authService.onAuthChange(setAuthState);
  }, []);

  // Handle repository selection
  const handleRepositorySelect = useCallback(async (repo) => {
    setSelectedRepo(repo);
    setCurrentView('visualization');
    
    try {
      const [owner, repoName] = repo.full_name.split('/');
      await fetchCommits(owner, repoName, {
        maxCommits: 500,
      });
    } catch (error) {
      console.error('Failed to load commits:', error);
      // Show error to user
    }
  }, [fetchCommits]);

  // Handle export
  const handleExport = useCallback((dataUrl) => {
    const link = document.createElement('a');
    link.download = `${selectedRepo?.name || 'commit-canvas'}-${visualizationMode}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [selectedRepo, visualizationMode]);

  // Handle mode toggle
  const handleModeToggle = useCallback(() => {
    setVisualizationMode(prev => prev === 'canvas' ? 'graph' : 'canvas');
  }, []);

  // Handle back to repo selection
  const handleBackToRepos = useCallback(() => {
    setCurrentView('repo-selection');
    setSelectedRepo(null);
    clear();
  }, [clear]);

  // Handle logout
  const handleLogout = useCallback(() => {
    authService.logout();
  }, []);

  // Don't render until theme is mounted
  if (!mounted) {
    return null;
  }

  // GitHub Login Route
  if (!authState.authenticated) {
    return <GitHubLogin />;
  }

  // Repository Selection
  if (currentView === 'repo-selection') {
    return <RepoSelector onRepositorySelect={handleRepositorySelect} />;
  }

  // Visualization View
  if (currentView === 'visualization') {
    const stats = getCommitStatistics();

    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToRepos}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-xl font-bold">{selectedRepo?.full_name}</h1>
                <p className="text-sm text-gray-400">
                  {stats.totalCommits} commits from {Object.keys(stats.authors || {}).length} authors
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <button
                onClick={handleModeToggle}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {visualizationMode === 'canvas' ? '🎨 Canvas' : '🔗 Graph'}
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isDark ? '🌙' : '☀️'}
              </button>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Visualization */}
        <div className="h-[calc(100vh-73px)]">
          {visualizationMode === 'canvas' ? (
            <CanvasView commits={commits} onExport={handleExport} />
          ) : (
            <GraphView commits={commits} onExport={handleExport} />
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}

export default App
