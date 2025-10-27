import { generateAuthorPalette, generateParticleProperties } from '../../utils/colors.js';

export class Particle {
  constructor(commit, authorPalette, canvas) {
    this.commit = commit;
    this.author = commit.author;
    this.properties = generateParticleProperties(commit, authorPalette);
    this.canvas = canvas;
    
    // Position
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    
    // Movement
    this.vx = (Math.random() - 0.5) * 2 * this.properties.velocity;
    this.vy = (Math.random() - 0.5) * 2 * this.properties.velocity;
    
    // Visual properties
    this.size = this.properties.size;
    this.color = this.properties.color;
    this.opacity = this.properties.opacity;
    
    // Animation
    this.trail = [];
    this.maxTrailLength = 20;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    
    // Pulse animation
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.02 + Math.random() * 0.03;
  }
  
  update(deltaTime, mouseX, mouseY, mode = 'canvas') {
    // Update trail
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    this.trail.push({ x: this.x, y: this.y });
    
    // Movement based on mode
    if (mode === 'canvas') {
      this.updateCanvasMovement(deltaTime, mouseX, mouseY);
    } else {
      this.updateGraphMovement(deltaTime);
    }
    
    // Update visual properties
    this.updateVisuals(deltaTime);
    
    // Wrap around canvas
    this.wrapAroundCanvas();
  }
  
  updateCanvasMovement(deltaTime, mouseX, mouseY) {
    // Add some randomness for organic movement
    this.vx += (Math.random() - 0.5) * 0.1;
    this.vy += (Math.random() - 0.5) * 0.1;
    
    // Mouse interaction
    if (mouseX !== undefined && mouseY !== undefined) {
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const force = (100 - distance) / 100;
        this.vx += dx * 0.01 * force;
        this.vy += dy * 0.01 * force;
      }
    }
    
    // Apply velocity with damping
    this.vx *= 0.99;
    this.vy *= 0.99;
    
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }
  
  updateGraphMovement(deltaTime) {
    // More structured movement for graph mode
    this.rotation += this.rotationSpeed * deltaTime;
    
    const targetX = Math.cos(this.rotation) * 200 + this.canvas.width / 2;
    const targetY = Math.sin(this.rotation) * 200 + this.canvas.height / 2;
    
    this.vx += (targetX - this.x) * 0.001;
    this.vy += (targetY - this.y) * 0.001;
    
    this.vx *= 0.98;
    this.vy *= 0.98;
    
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }
  
  updateVisuals(deltaTime) {
    // Update pulse
    this.pulsePhase += this.pulseSpeed * deltaTime;
    const pulseFactor = 0.8 + Math.sin(this.pulsePhase) * 0.2;
    
    // Update size based on pulse
    this.size = this.properties.size * pulseFactor;
    
    // Fade out old commits
    if (this.properties.daysSince > 180) {
      this.opacity *= 0.995;
    }
  }
  
  wrapAroundCanvas() {
    if (this.x < -50) this.x = this.canvas.width + 50;
    if (this.x > this.canvas.width + 50) this.x = -50;
    if (this.y < -50) this.y = this.canvas.height + 50;
    if (this.y > this.canvas.height + 50) this.y = -50;
  }
  
  draw(ctx) {
    // Draw trail
    if (this.trail.length > 1) {
      ctx.strokeStyle = this.color + '20';
      ctx.lineWidth = this.size / 2;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      this.trail.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    }
    
    // Draw particle
    ctx.save();
    ctx.globalAlpha = this.opacity;
    
    // Create gradient for more interesting particle
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, this.color + '80');
    gradient.addColorStop(1, this.color + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fill();
    
    ctx.restore();
  }
  
  getInfo() {
    return {
      author: this.author.name || this.author.email,
      message: this.commit.message,
      date: this.commit.author.date,
      changes: this.properties.totalChanges,
    };
  }
}

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.authorPalettes = new Map();
    this.mode = 'canvas';
    this.mouseX = undefined;
    this.mouseY = undefined;
    
    // Performance
    this.lastTime = performance.now();
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    
    // Background
    this.backgroundParticles = [];
    this.initBackgroundParticles();
    
    // Mouse tracking
    this.setupMouseTracking();
  }
  
  setupMouseTracking() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.mouseX = undefined;
      this.mouseY = undefined;
    });
  }
  
  initBackgroundParticles() {
    // Create background starfield
    for (let i = 0; i < 50; i++) {
      this.backgroundParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2,
        opacity: Math.random() * 0.5,
        speed: 0.1 + Math.random() * 0.3,
      });
    }
  }
  
  setCommits(commits) {
    // Clear existing particles
    this.particles = [];
    this.authorPalettes.clear();
    
    // Group commits by author
    const commitsByAuthor = new Map();
    commits.forEach(commit => {
      const authorId = commit.author.email || commit.author.name;
      if (!commitsByAuthor.has(authorId)) {
        commitsByAuthor.set(authorId, []);
      }
      commitsByAuthor.get(authorId).push(commit);
    });
    
    // Create particles for each commit
    commitsByAuthor.forEach((authorCommits, authorId) => {
      const author = authorCommits[0].author;
      const palette = generateAuthorPalette(author.email, author.name);
      this.authorPalettes.set(authorId, palette);
      
      authorCommits.forEach(commit => {
        this.particles.push(new Particle(commit, palette, this.canvas));
      });
    });
    
    console.log(`Created ${this.particles.length} particles from ${this.authorPalettes.size} authors`);
  }
  
  setMode(mode) {
    this.mode = mode;
  }
  
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Update background particles
    this.backgroundParticles.forEach(particle => {
      particle.x = Math.random() * width;
      particle.y = Math.random() * height;
    });
  }
  
  updateBackgroundParticles(deltaTime) {
    this.backgroundParticles.forEach(particle => {
      particle.y += particle.speed * deltaTime;
      if (particle.y > this.canvas.height) {
        particle.y = -10;
        particle.x = Math.random() * this.canvas.width;
      }
    });
  }
  
  drawBackground() {
    // Create gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#0f0f1f');
    gradient.addColorStop(1, '#0a0a0a');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background particles
    this.backgroundParticles.forEach(particle => {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
      this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
  }
  
  animate() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000 * 60; // Normalize to 60fps
    this.lastTime = currentTime;
    
    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate > 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
    
    // Clear and draw background
    this.drawBackground();
    
    // Update and draw particles
    this.particles.forEach(particle => {
      particle.update(deltaTime, this.mouseX, this.mouseY, this.mode);
      particle.draw(this.ctx);
    });
    
    // Draw mode-specific overlays
    if (this.mode === 'graph') {
      this.drawGraphOverlay();
    }
    
    // Continue animation
    requestAnimationFrame(() => this.animate());
  }
  
  drawGraphOverlay() {
    // Draw connecting lines between related particles
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];
      if (p1.properties.daysSince > 90) continue; // Only connect recent commits
      
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        if (p2.properties.daysSince > 90) continue;
        
        // Connect commits from the same author
        if (p1.author.email === p2.author.email) {
          const distance = Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
          );
          
          if (distance < 150) {
            const opacity = (150 - distance) / 150 * 0.3;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
          }
        }
      }
    }
  }
  
  getParticleAt(x, y) {
    for (const particle of this.particles) {
      const dx = particle.x - x;
      const dy = particle.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < particle.size + 10) {
        return particle;
      }
    }
    return null;
  }
  
  getStats() {
    return {
      particleCount: this.particles.length,
      authorCount: this.authorPalettes.size,
      fps: this.fps,
      mode: this.mode,
    };
  }
  
  exportImage() {
    return this.canvas.toDataURL('image/png');
  }
}
