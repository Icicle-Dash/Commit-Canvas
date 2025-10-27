import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // Check for saved theme or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved;
      }
      
      // Check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    
    return 'light';
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setLightTheme = () => {
    setTheme('light');
  };

  const setDarkTheme = () => {
    setTheme('dark');
  };

  // Prevent flash of unstyled content
  const themeColors = {
    light: {
      background: 'rgb(248, 250, 252)',
      foreground: 'rgb(255, 255, 255)',
      text: 'rgb(15, 23, 42)',
      muted: 'rgb(241, 245, 249)',
      border: 'rgb(226, 232, 240)',
    },
    dark: {
      background: 'rgb(15, 23, 42)',
      foreground: 'rgb(30, 41, 59)',
      text: 'rgb(248, 250, 252)',
      muted: 'rgb(30, 41, 59)',
      border: 'rgb(51, 65, 85)',
    }
  };

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    mounted,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    colors: themeColors[theme],
  };
}
