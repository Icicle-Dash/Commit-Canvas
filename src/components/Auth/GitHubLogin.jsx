import React, { useState } from 'react';
import { authService } from '../../services/auth.js';

export default function GitHubLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.login();
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to start authentication. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Commit Canvas
          </h1>
          <p className="text-gray-400">
            Transform your code history into beautiful generative art
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Connect to GitHub</h2>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              <p className="mb-2">We need GitHub access to visualize your commit history:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Read repository information</li>
                <li>Access commit history and metadata</li>
                <li>Analyze code changes and authorship</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:cursor-not-allowed text-white font-mono py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Connecting to GitHub...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Login with GitHub
                </>
              )}
            </button>

            <div className="text-xs text-gray-500 text-center">
              We only request read permissions and never store your credentials
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
