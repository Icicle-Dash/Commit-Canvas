# Commit Canvas Architecture

## Overview

Commit Canvas is a web application that transforms Git commit history into beautiful generative art visualizations. The application uses React with Vite for fast development and optimized builds, Canvas API/WebGL for performant generative art rendering, and D3.js for graph visualizations.

## Technology Stack

### Frontend
- **React 19** with Vite for fast development and optimized builds
- **TypeScript** for type safety and better development experience
- **Tailwind CSS** for responsive styling and theme system
- **Three.js/React Three Fiber** for WebGL-based 3D visualizations

### Visualization Libraries
- **D3.js** for graph visualizations (Obsidian-style mode)
- **Canvas API** for 2D generative art rendering
- **WebGL** for high-performance particle systems

### APIs & Services
- **GitHub API** (REST/GraphQL) for fetching commit data
- **GitHub OAuth** for authentication and API access

### Additional Libraries
- **Axios** for HTTP requests
- **gif.js** for animated GIF export
- **MediaRecorder API** for video export

## Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.jsx         # Navigation, theme toggle
│   │   └── Footer.jsx
│   ├── Auth/
│   │   ├── GitHubLogin.jsx    # OAuth flow
│   │   └── AuthCallback.jsx
│   ├── Repository/
│   │   ├── RepoSelector.jsx   # Repository picker
│   │   └── RepoStats.jsx      # Display repo metrics
│   ├── Visualization/
│   │   ├── CanvasView.jsx     # Abstract art mode
│   │   ├── GraphView.jsx      # Network graph mode
│   │   ├── ParticleSystem.js  # WebGL particle engine
│   │   └── ColorPalette.js    # Author color mapping
│   └── Export/
│       └── ExportControls.jsx # PNG/GIF/Video export
├── services/
│   ├── github.js              # GitHub API wrapper
│   ├── auth.js                # OAuth handling
│   └── visualization.js       # Data transformation
├── hooks/
│   ├── useGitHubData.js      # Fetch commits/contributors
│   └── useTheme.js           # Dark/light mode
├── utils/
│   ├── colors.js              # Color generation algorithms
│   └── export.js              # Canvas export utilities
├── styles/
│   └── globals.css            # Global styles and theme variables
└── App.jsx                    # Main application component
```

## Core Components

### Visualization Engine

#### Canvas Mode (Abstract Art)
- **Particle System**: Each commit is represented as a particle with unique properties
- **Color Mapping**: Each author gets a unique color palette
- **Motion Dynamics**: 
  - Commit frequency drives particle velocity
  - Code changes affect particle size
  - Time progression creates animation
- **WebGL Shaders**: For high-performance rendering

#### Graph Mode (Network Visualization)
- **Force-Directed Graph**: Shows relationships between commits and authors
- **Node Representation**: 
  - Nodes = commits/authors
  - Edges = relationships between commits
  - Node size = impact/importance
  - Color = author identity
- **Interactive Features**: Zoom, rotate, pan capabilities

### Authentication System
- **GitHub OAuth**: PKCE flow for secure authentication
- **Token Management**: Secure storage and refresh of access tokens
- **Scope Management**: Request only necessary permissions

### Data Processing Pipeline
1. **GitHub Data Fetching**: GraphQL/REST API calls with rate limiting
2. **Data Transformation**: Convert commit data to visualization format
3. **Real-time Updates**: Commit streaming for live repositories
4. **Caching Strategy**: Local storage for performance optimization

## Key Algorithms

### Color Generation Algorithm
```javascript
// Generate unique palette per author
const authorToPalette = (authorEmail) => {
  const hash = hashString(authorEmail);
  const hue = (hash % 360);
  return {
    primary: `hsl(${hue}, 70%, 60%)`,
    secondary: `hsl(${hue + 30}, 60%, 50%)`,
    accent: `hsl(${hue - 30}, 80%, 70%)`
  };
};
```

### Particle Motion Algorithm
```javascript
// Commit activity drives particle behavior
particles.forEach(p => {
  p.velocity = baseSpeed * commitFrequency;
  p.size = Math.log(additions + deletions + 1);
  p.opacity = recentActivity ? 1.0 : 0.3;
});
```

### Force-Directed Graph Layout
- Use D3's force simulation for physics-based positioning
- Apply charge force for node separation
- Link strength based on commit relationships
- Collision detection for node overlap prevention

## Performance Optimizations

### Rendering Optimizations
- **Canvas Off-screen Rendering**: Pre-render complex elements
- **Web Workers**: Data processing in background threads
- **Virtual DOM Optimization**: React.memo for component optimization
- **RequestAnimationFrame**: Smooth 60fps animations

### Data Management
- **Request Batching**: Combine multiple GitHub API calls
- **Lazy Loading**: Load repositories incrementally
- **Caching Strategy**: IndexedDB for large datasets
- **Rate Limiting**: Respect GitHub API limits

### Memory Management
- **Object Pooling**: Reuse particle objects
- **Garbage Collection Optimization**: Minimize object creation
- **Texture Caching**: Reuse WebGL textures

## Export System

### Image Export
- **PNG Export**: Canvas.toDataURL() for static images
- **High Resolution**: Support for 4K+ resolutions
- **Custom Dimensions**: User-defined canvas sizes

### Animation Export
- **GIF Creation**: Using gif.js for animated exports
- **Video Recording**: MediaRecorder API for WebM videos
- **Frame Control**: Adjustable frame rate and duration

## Theme System

### CSS Variables
- **Theme Tokens**: CSS custom properties for consistent theming
- **Dark/Light Mode**: System preference detection
- **Smooth Transitions**: CSS transitions for theme changes

### Tailwind Configuration
- **Custom Palette**: Project-specific color scheme
- **Responsive Design**: Mobile-first approach
- **Component Variants**: Styled components for different states

## Deployment Architecture

### GitHub Pages
- **Static Site Generation**: Optimized build for CDN distribution
- **Custom Domain**: branded URL support
- **HTTPS**: Automatic SSL certificate

### Environment Management
- **GitHub Secrets**: Secure API key storage
- **Build Optimization**: Code splitting and tree shaking
- **SEO Optimization**: Meta tags and structured data

## Security Considerations

### Authentication Security
- **PKCE Flow**: Prevent authorization code interception
- **Token Storage**: Secure httpOnly cookies or localStorage
- **Scope Minimization**: Request only necessary permissions

### Data Security
- **Input Validation**: Sanitize all user inputs
- **API Rate Limiting**: Implement throttling
- **CORS Configuration**: Proper cross-origin settings

## Scalability Planning

### Client-Side Scaling
- **Progressive Loading**: Load data as needed
- **Virtualization**: Handle large datasets efficiently
- **Web Workers**: Parallel processing capabilities

### Server-Side Considerations
- **API Caching**: Reduce GitHub API calls
- **CDN Distribution**: Fast content delivery
- **Monitoring**: Performance and error tracking

## Future Enhancements

### Planned Features
- **Multiple Repository Comparison**: Side-by-side visualizations
- **Collaborative Mode**: Real-time shared viewing
- **Advanced Export Formats**: SVG, PDF, 3D models
- **Integration Support**: GitLab, Bitbucket compatibility

### Technical Debt Management
- **Testing Suite**: Comprehensive unit and integration tests
- **Documentation**: API and component documentation
- **Code Quality**: Linting and formatting standards
- **Performance Monitoring**: Real-time performance metrics

This architecture ensures a scalable, performant, and maintainable application that creates stunning visual representations of code history while providing an excellent user experience.
