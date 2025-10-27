import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { generateAuthorPalette } from '../../utils/colors.js';

export default function GraphView({ commits, onExport, className }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Initialize D3 force simulation
  useEffect(() => {
    if (!svgRef.current || !commits || commits.length === 0) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [commits]);

  useEffect(() => {
    if (!svgRef.current || !commits || commits.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Process data
    const authorPalettes = new Map();
    const nodes = [];
    const links = [];

    // Create nodes for commits
    commits.forEach((commit, index) => {
      const authorId = commit.author.email || commit.author.name;
      
      if (!authorPalettes.has(authorId)) {
        const palette = generateAuthorPalette(commit.author.email, commit.author.name);
        authorPalettes.set(authorId, palette);
      }

      nodes.push({
        id: commit.sha || `commit-${index}`,
        author: commit.author,
        message: commit.message,
        date: commit.author.date,
        additions: commit.additions || 0,
        deletions: commit.deletions || 0,
        changedFiles: commit.changedFiles || 1,
        group: authorId,
        palette: authorPalettes.get(authorId),
      });
    });

    // Create links between consecutive commits from same author
    const commitsByAuthor = new Map();
    nodes.forEach(node => {
      const group = node.group;
      if (!commitsByAuthor.has(group)) {
        commitsByAuthor.set(group, []);
      }
      commitsByAuthor.get(group).push(node);
    });

    commitsByAuthor.forEach(authorNodes => {
      authorNodes.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      for (let i = 0; i < authorNodes.length - 1; i++) {
        links.push({
          source: authorNodes[i].id,
          target: authorNodes[i + 1].id,
          value: Math.log(authorNodes[i].additions + authorNodes[i].deletions + 1),
        });
      }

      // Add cross-links for commits within time window
      for (let i = 0; i < authorNodes.length; i++) {
        for (let j = i + 1; j < authorNodes.length; j++) {
          const timeDiff = new Date(authorNodes[j].date) - new Date(authorNodes[i].date);
          if (timeDiff < 24 * 60 * 60 * 1000 && timeDiff > 0) { // Within 24 hours
            links.push({
              source: authorNodes[i].id,
              target: authorNodes[j].id,
              value: 0.5, // Weaker connection
            });
          }
        }
      }
    });

    // Create force simulation
    const sim = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => 30 + d.value * 10))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.additions + d.deletions) + 5))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    setSimulation(sim);

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#ffffff20')
      .attr('stroke-width', d => Math.sqrt(d.value) * 2)
      .attr('stroke-opacity', 0.3);

    // Create node groups
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => Math.sqrt(d.additions + d.deletions) + 5)
      .attr('fill', d => d.palette.primary)
      .attr('stroke', d => d.palette.accent)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8)
      .on('click', (event, d) => {
        setSelectedNode({
          author: d.author.name || d.author.email,
          message: d.message,
          date: d.date,
          changes: d.additions + d.deletions,
          files: d.changedFiles,
        });
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => Math.sqrt(d.additions + d.deletions) + 8)
          .attr('stroke-opacity', 1);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => Math.sqrt(d.additions + d.deletions) + 5)
          .attr('stroke-opacity', 0.8);
      });

    // Add time-based color gradient
    const timeExtent = d3.extent(nodes, d => new Date(d.date));
    const timeScale = d3.scaleSequential(d3.interpolateCool)
      .domain(timeExtent);

    // Add tooltips
    node.append('text')
      .text(d => {
        const date = new Date(d.date);
        return `${date.toLocaleDateString()}\n${d.author.name || d.author.email}`;
      })
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Update positions on simulation tick
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      sim.stop();
    };
  }, [commits, dimensions]);

  // Export functionality
  const handleExport = useCallback(() => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svg = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

    const url = URL.createObjectURL(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      // Draw background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw SVG
      ctx.drawImage(img, 0, 0);
      
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/png');
      if (onExport) {
        onExport(dataUrl);
      }
    };

    img.src = url;
  }, [onExport, dimensions]);

  // Stats
  const stats = {
    nodeCount: commits?.length || 0,
    authorCount: new Set(commits?.map(c => c.author.email || c.author.name)).size,
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full cursor-move"
      />
      
      <div ref={containerRef} className="absolute inset-0 pointer-events-none" />

      {/* Controls */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white space-y-2 pointer-events-auto">
        <div className="text-sm font-semibold mb-2">Graph Mode</div>
        
        <div className="text-xs space-y-1">
          <div>Nodes: {stats.nodeCount}</div>
          <div>Authors: {stats.authorCount}</div>
        </div>

        <button
          onClick={handleExport}
          className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
        >
          Export
        </button>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-sm font-semibold mb-1">
                {selectedNode.author}
              </div>
              <div className="text-xs text-gray-300 font-mono mb-2">
                {selectedNode.message.split('\n')[0]}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(selectedNode.date).toLocaleDateString()} • 
                {selectedNode.changes} changes • {selectedNode.files} files
              </div>
            </div>
            
            <button
              onClick={() => setSelectedNode(null)}
              className="ml-4 p-1 hover:bg-white/10 rounded transition-colors pointer-events-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Help hint */}
      {!selectedNode && (
        <div className="absolute bottom-4 right-4 text-white/60 text-xs">
          Drag nodes to rearrange • Click for details
        </div>
      )}

      {/* Loading state */}
      {(!commits || commits.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4 mx-auto"></div>
            <div className="text-sm">Building graph...</div>
          </div>
        </div>
      )}
    </div>
  );
}
