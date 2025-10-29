# 🎨 Commit Canvas — Transform your Git commit history into generative art

Transform your Git commit history into beautiful generative art visualizations.

<p align="center">
  <img src="https://raw.githubusercontent.com/Icicle-Dash/Commit-Canvas/main/wooden_frame_art.svg" width="400">
</p>

## Overview

Commit Canvas is a web application that transforms Git repository commit history into stunning generative art visualizations. Each commit becomes a particle with unique colors, sizes, and movement patterns, creating beautiful visual representations of your project's evolution.

## Features

### 🎨 Canvas Mode
- **Particle System**: Each commit becomes a unique particle based on:
  - Author identity (unique color palette per author)
  - Commit magnitude (particle size based on code changes)
  - Recency (opacity fades over time)
  - Activity frequency (particle velocity)
- **Interactive Features**: Mouse interaction creates dynamic movement
- **Beautiful Trails**: Particles leave glowing trails showing their paths

### 🔗 Graph Mode
- **Force-Directed Network**: Visualizes commit relationships
- **Author Clustering**: Groups commits by contributor
- **Interactive Dragging**: Rearrange nodes to explore patterns
- **Time-Based Connections**: Links commits within time windows

### 🌟 Key Features
- **GitHub OAuth Integration**: Secure authentication with GitHub
- **Real-time Visualization**: Smooth 60fps animations
- **Export Functionality**: Save visualizations as PNG images
- **Dark/Light Theme**: Toggle between themes
- **Responsive Design**: Works on all screen sizes
- **Repository Search**: Find and filter your repositories

## Tech Stack

- **Frontend**: React 19 + Vite
- **Visualization**: Canvas API, WebGL, D3.js
- **Styling**: Tailwind CSS
- **API Integration**: GitHub OAuth & GraphQL/REST APIs
- **Build Tool**: Vite

## Quick Start

### Prerequisites
- Node.js 18+ installed
- GitHub account for repository access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/commit-canvas.git
   cd commit-canvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up GitHub OAuth**
   
   Create a GitHub OAuth App:
   
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Fill in the details:
     - **Application name**: Commit Canvas (or your choice)
     - **Homepage URL**: `http://localhost:5173`
     - **Authorization callback URL**: `http://localhost:5173/auth/callback`
   
   Copy the Client ID and generate a Client Secret.

4. **Configure environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Fill in your GitHub OAuth credentials:
   ```env
   VITE_GITHUB_CLIENT_ID=your_client_id_here
   VITE_GITHUB_CLIENT_SECRET=your_client_secret_here
   VITE_GITHUB_API_URL=https://api.github.com
   VITE_APP_CALLBACK_URL=http://localhost:5173/auth/callback
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173` and you'll see the Commit Canvas login screen.

## Usage

1. **Login with GitHub**: Click the "Login with GitHub" button
2. **Select a Repository**: Browse your repositories and select one to visualize
3. **Choose Visualization Mode**: Toggle between Canvas and Graph modes
4. **Interact**: 
   - Click on particles to see commit details
   - In Graph mode, drag nodes to rearrange
   - Use mouse to influence particle movement in Canvas mode
5. **Export**: Click "Export" to save the visualization as an image

## Architecture

### Project Structure

```
src/
├── components/
│   ├── Layout/          # Header, Footer components
│   ├── Auth/           # GitHub OAuth components
│   ├── Repository/     # Repository selection & stats
│   ├── Visualization/  # Canvas & Graph visualization
│   └── Export/         # Export functionality
├── services/           # GitHub API & auth services
├── hooks/             # Custom React hooks
├── utils/             # Color & utility functions
└── styles/            # Global styles & themes
```

### Key Algorithms

**Color Generation**: Each author gets a unique, consistent color palette based on their email/name hash.

**Particle Physics**: Particles move based on:
- Commit frequency (velocity)
- Code changes (size)
- Recency (opacity)
- Mouse interaction (forces)

**Graph Layout**: D3 force simulation creates natural clustering of commits by author and time.

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Configuration

The project uses several key configuration files:

- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `vite.config.js` - Vite build configuration
- `eslint.config.js` - ESLint rules

## Deployment

### Quick Deploy to GitHub Pages (Recommended)

Follow these steps to deploy Commit Canvas to your own GitHub Pages:

#### Step 1: Set up GitHub OAuth

1. Go to **GitHub Settings → Developer settings → OAuth Apps**
2. Click **"New OAuth App"** and configure:
   - **Application name**: Commit Canvas (or your choice)
   - **Homepage URL**: `https://YOUR_USERNAME.github.io/commit-canvas`
   - **Authorization callback URL**: `https://YOUR_USERNAME.github.io/commit-canvas/auth/callback`

3. Copy the **Client ID** and generate a **Client Secret**

> **Note**: Replace `YOUR_USERNAME` with your actual GitHub username

#### Step 2: Configure Repository Secrets

1. In your forked repository, go to **Settings → Secrets and variables → Actions**
2. Add these repository secrets:
   - `VITE_GITHUB_CLIENT_ID`: Your Client ID
   - `VITE_GITHUB_CLIENT_SECRET`: Your Client Secret

#### Step 3: Enable GitHub Pages

1. Go to **Settings → Pages**
2. Set source to **"GitHub Actions"**

#### Step 4: Deploy

Push any changes to the main branch to trigger the automatic deployment:

```bash
git push origin main
```

The GitHub Action will automatically build and deploy your app to GitHub Pages.

---

### Manual Deployment Option

If you prefer to deploy manually without GitHub Actions:

#### Step 1: Create Production Environment File

Copy `.env.example` to `.env.production` and update with your OAuth credentials:

```bash
cp .env.example .env.production
```

Then edit `.env.production` with your real values:
```env
VITE_GITHUB_CLIENT_ID=your_actual_client_id
VITE_GITHUB_CLIENT_SECRET=your_actual_client_secret
VITE_APP_CALLBACK_URL=https://YOUR_USERNAME.github.io/commit-canvas/auth/callback
```

#### Step 2: Build and Deploy

```bash
npm run build
npm run deploy
```

#### Step 3: Enable GitHub Pages

1. Go to **Settings → Pages** in your repository
2. Set source to **"Deploy from a branch"**
3. Choose the `gh-pages` branch with `/` as the root folder

---

### Environment Variables

For any deployment method, you'll need these GitHub OAuth variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth Client ID | `a1b2c3d4e5f6g7h8i9j0` |
| `VITE_GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6` |
| `VITE_APP_CALLBACK_URL` | OAuth callback URL | `https://YOUR_USERNAME.github.io/commit-canvas/auth/callback` |

---

### Important Deployment Notes

⚠️ **Security**: Never commit your OAuth secrets to your repository. Always use GitHub secrets or environment variables.

🔄 **OAuth Callback**: Make sure your GitHub OAuth App callback URL exactly matches your deployed app URL.

⏱️ **Deployment Time**: GitHub Pages may take 1-2 minutes to update after deployment.

🌐 **Custom Domain**: You can use a custom domain by updating the OAuth callback URL and GitHub Pages settings.

📱 **HTTPS Required**: GitHub OAuth requires HTTPS, so your deployment must use HTTPS (GitHub Pages provides this automatically).

---

### Access Your Deployed App

Once deployed, your Commit Canvas instance will be available at:
`https://YOUR_USERNAME.github.io/commit-canvas`

Users visiting your deployed app can:
- Login with their own GitHub accounts
- Visualize their own repositories
- Export beautiful commit visualizations

No further setup required - the app works independently for each user!

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Apache-2.0 License
