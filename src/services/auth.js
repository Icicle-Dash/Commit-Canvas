import { githubService } from './github.js';

class AuthService {
  constructor() {
    this.initialized = false;
    this.authCallbacks = [];
  }

  // Initialize authentication state
  async init() {
    if (this.initialized) return;
    
    // Check if we have an auth callback in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code) {
      try {
        await this.handleAuthCallback(code, state);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Auth callback error:', error);
        this.notifyAuthChange({ authenticated: false, error });
      }
    } else if (githubService.isAuthenticated()) {
      // Validate existing token
      try {
        await githubService.getUserProfile();
        this.notifyAuthChange({ authenticated: true });
      } catch (error) {
        console.error('Token validation failed:', error);
        this.logout();
      }
    }
    
    this.initialized = true;
  }

  // Start OAuth flow
  async login() {
    try {
      const authUrl = await githubService.initiateOAuth();
      
      // Generate state parameter for security
      const state = this.generateState();
      sessionStorage.setItem('oauth_state', state);
      
      const url = new URL(authUrl);
      url.searchParams.set('state', state);
      
      window.location.href = url.toString();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Handle OAuth callback
  async handleAuthCallback(code, state) {
    const storedState = sessionStorage.getItem('oauth_state');
    
    if (state && state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    
    sessionStorage.removeItem('oauth_state');
    
    const token = await githubService.exchangeCodeForToken(code);
    
    // Get user profile to validate token
    const user = await githubService.getUserProfile();
    
    this.notifyAuthChange({ 
      authenticated: true, 
      user,
      token 
    });
    
    return { token, user };
  }

  // Logout
  logout() {
    githubService.clearAuthToken();
    this.notifyAuthChange({ authenticated: false });
  }

  // Register auth state change callback
  onAuthChange(callback) {
    this.authCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authCallbacks.indexOf(callback);
      if (index > -1) {
        this.authCallbacks.splice(index, 1);
      }
    };
  }

  // Notify all callbacks of auth state change
  notifyAuthChange(state) {
    this.authCallbacks.forEach(callback => callback(state));
  }

  // Get current auth state
  getAuthState() {
    return {
      authenticated: githubService.isAuthenticated(),
    };
  }

  // Generate random state for OAuth
  generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Check if we're in auth callback state
  isAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') || urlParams.has('error');
  }

  // Get auth error from callback
  getAuthError() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      return {
        error,
        description: errorDescription || 'Unknown authentication error',
      };
    }
    
    return null;
  }
}

export const authService = new AuthService();
