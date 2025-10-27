import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ParticleSystem } from './ParticleSystem.js';

export default function CanvasView({ commits, mode = 'canvas', onExport, className }) {
  const canvasRef = useRef(null);
  const [particleSystem, setParticleSystem] = useState(null);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [stats, setStats] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const animationFrameRef = useRef(null);

  // Initialize particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (particleSystem) {
        particleSystem.resize(rect.width, rect.height);
      }
    };

    const system = new ParticleSystem(canvas);
    system.mode = mode;
    setParticleSystem(system);

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mode]);

  // Update commits
  useEffect(() => {
    if (particleSystem && commits && commits.length > 0) {
      particleSystem.setCommits(commits);
    }
  }, [commits, particleSystem]);

  // Update mode
  useEffect(() => {
    if (particleSystem) {
      particleSystem.setMode(mode);
    }
  }, [mode, particleSystem]);

  // Start animation
  useEffect(() => {
    if (particleSystem && !isPaused) {
      particleSystem.animate();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particleSystem, isPaused]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e) => {
    if (!particleSystem) return;

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const particle = particleSystem.getParticleAt(x, y);
    if (particle) {
      setSelectedCommit(particle.getInfo());
    } else {
      setSelectedCommit(null);
    }
  }, [particleSystem]);

  // Handle export
  const handleExport = useCallback(() => {
    if (particleSystem && onExport) {
      const dataUrl = particleSystem.exportImage();
      onExport(dataUrl);
    }
  }, [particleSystem, onExport]);

  // Toggle pause
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Update stats
  useEffect(() => {
    if (particleSystem) {
      const interval = setInterval(() => {
        setStats(particleSystem.getStats());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [particleSystem]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
      />

      {/* Controls */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white space-y-2">
        <div className="text-sm font-semibold mb-2">
          {mode === 'canvas' ? 'Canvas Mode' : 'Graph Mode'}
        </div>
        
        <div className="text-xs space-y-1">
          <div>Particles: {stats.particleCount || 0}</div>
          <div>Authors: {stats.authorCount || 0}</div>
          <div>FPS: {stats.fps || 0}</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={togglePause}
            className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            {isPaused ? 'Play' : 'Pause'}
          </button>
          
          <button
            onClick={handleExport}
            className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* Selected commit info */}
      {selectedCommit && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-sm font-semibold mb-1">
                {selectedCommit.author}
              </div>
              <div className="text-xs text-gray-300 font-mono mb-2">
                {selectedCommit.message.split('\n')[0]}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(selectedCommit.date).toLocaleDateString()} • 
                {selectedCommit.changes} changes
              </div>
            </div>
            
            <button
              onClick={() => setSelectedCommit(null)}
              className="ml-4 p-1 hover:bg-white/10 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Mode indicator */}
      <div className="absolute top-4 right-4">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          mode === 'canvas' 
            ? 'bg-blue-500/80 text-white' 
            : 'bg-purple-500/80 text-white'
        }`}>
          {mode === 'canvas' ? '🎨 Canvas' : '🔗 Graph'}
        </div>
      </div>

      {/* Help hint */}
      {!selectedCommit && (
        <div className="absolute bottom-4 right-4 text-white/60 text-xs">
          Click on particles for details
        </div>
      )}

      {/* Loading state */}
      {(!commits || commits.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4 mx-auto"></div>
            <div className="text-sm">Loading commit data...</div>
          </div>
        </div>
      )}
    </div>
  );
}
