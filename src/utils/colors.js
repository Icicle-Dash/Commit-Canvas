// Simple string hash function
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate unique color palette per author
export function generateAuthorPalette(authorEmail, authorName) {
  const combinedInput = `${authorEmail || ''}${authorName || ''}`;
  const hash = hashString(combinedInput);
  const hue = (hash % 360);
  
  // Generate consistent palette based on author identity
  const saturation = 60 + (hash % 30); // 60-90%
  const lightness = 45 + (hash % 20); // 45-65%
  
  return {
    primary: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    secondary: `hsl(${(hue + 120) % 360}, ${saturation - 10}%, ${lightness + 10}%)`,
    accent: `hsl(${(hue + 240) % 360}, ${saturation + 10}%, ${lightness - 10}%)`,
    hue,
    saturation,
    lightness,
  };
}

// Generate color for commit based on properties
export function generateCommitColor(authorPalette, commit) {
  const { additions = 0, deletions = 0, changedFiles = 1 } = commit;
  const totalChanges = additions + deletions;
  
  // Modify color based on commit activity
  const intensity = Math.min(1, totalChanges / 1000); // Normalize to 0-1
  const lightness = authorPalette.lightness * (0.5 + intensity * 0.5);
  const saturation = authorPalette.saturation * (0.8 + intensity * 0.2);
  
  return `hsl(${authorPalette.hue}, ${saturation}%, ${lightness}%)`;
}

// Generate particle properties based on commit
export function generateParticleProperties(commit, authorPalette) {
  const { additions = 0, deletions = 0, changedFiles = 1, date } = commit;
  const totalChanges = additions + deletions;
  
  // Size based on magnitude of changes (logarithmic scale)
  const size = 2 + Math.log10(1 + totalChanges) * 3;
  
  // Velocity based on file changes
  const velocity = 0.5 + (changedFiles / 10);
  
  // Opacity based on recency (newer commits are more opaque)
  const commitDate = new Date(date);
  const now = new Date();
  const daysSince = (now - commitDate) / (1000 * 60 * 60 * 24);
  const opacity = Math.max(0.2, Math.min(1, 1 - daysSince / 365));
  
  // Color with intensity variation
  const color = generateCommitColor(authorPalette, commit);
  
  return {
    size,
    velocity,
    opacity,
    color,
    totalChanges,
    daysSince,
  };
}

// Generate gradient colors for backgrounds
export function generateGradientColors(palette) {
  return {
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
    background: `linear-gradient(135deg, ${palette.primary}20, ${palette.secondary}20, ${palette.accent}20)`,
    overlay: `linear-gradient(180deg, transparent, ${palette.primary}10)`,
  };
}

// Color utilities for theming
export function adjustColor(color, amount = 0) {
  const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return color;
  
  const [, hue, saturation, lightness] = match.map(Number);
  return `hsl(${hue}, ${saturation}%, ${Math.max(0, Math.min(100, lightness + amount))}%)`;
}

export function lighten(color, amount) {
  return adjustColor(color, Math.abs(amount));
}

export function darken(color, amount) {
  return adjustColor(color, -Math.abs(amount));
}

// Generate colors for visualization modes
export function generateVisualizationColors(mode) {
  switch (mode) {
    case 'canvas':
      return {
        background: '#0a0a0a',
        particle: '#ffffff',
        trail: 'rgba(255, 255, 255, 0.1)',
        grid: 'rgba(255, 255, 255, 0.05)',
      };
      
    case 'graph':
      return {
        background: '#0f0f0f',
        node: '#ffffff',
        edge: 'rgba(255, 255, 255, 0.2)',
        highlight: '#3b82f6',
        text: '#9ca3af',
      };
      
    default:
      return {
        background: '#000000',
        primary: '#ffffff',
        secondary: '#666666',
        accent: '#3b82f6',
      };
  }
}

// Generate heat map colors for activity visualization
export function generateHeatMapColors(activityLevel) {
  const colors = [
    '#0ea5e9', // Blue (low activity)
    '#22c55e', // Green (normal activity)
    '#eab308', // Yellow (medium activity)
    '#f97316', // Orange (high activity)
    '#ef4444', // Red (very high activity)
  ];
  
  const index = Math.min(Math.floor(activityLevel * colors.length), colors.length - 1);
  return colors[index];
}

// Contrast checker for accessibility
export function getContrastRatio(color1, color2) {
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);
  const brightest = Math.max(luminance1, luminance2);
  const darkest = Math.min(luminance1, luminance2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getLuminance(color) {
  // Convert hex/hsl to RGB first
  const rgb = hexToRgb(color) || hslToRgb(color);
  if (!rgb) return 0;
  
  const [r, g, b] = rgb.map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

function hslToRgb(hsl) {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return null;
  
  const [_, h, s, l] = match.map(Number);
  return hslToRgbFormula(h, s, l);
}

function hslToRgbFormula(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return [f(0), f(8), f(4)];
}
