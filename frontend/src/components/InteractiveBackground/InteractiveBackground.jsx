import React, { useRef, useEffect } from 'react';
import './InteractiveBackground.css';

const InteractiveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;
    
    // Grid configuration
    const colWidth = 40;
    const drops = [];
    const numDrops = 40;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    class FallingLine {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        const numCols = Math.floor(width / colWidth);
        this.col = Math.floor(Math.random() * numCols);
        this.x = this.col * colWidth;
        // If initial, scatter them vertically. Otherwise, start above screen.
        this.y = initial ? Math.random() * height - height : Math.random() * -500 - 200;
        this.length = Math.random() * 120 + 60;
        this.speed = Math.random() * 4 + 2;
        
        // Colors from the reference image (Red, Green, Yellow, Orange)
        const colors = ['#ff4b4b', '#4bff82', '#ffc14b', '#ff7b4b', '#f9f9f9'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y += this.speed;
        if (this.y > height + 50) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        
        // Gradient for the falling laser (fades out at top, bright at bottom)
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.length);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.7, this.color);
        grad.addColorStop(1, '#ffffff');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.stroke();
        ctx.restore();
      }
    }

    for (let i = 0; i < numDrops; i++) {
      drops.push(new FallingLine());
    }

    const drawGrid = () => {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      
      const numCols = Math.floor(width / colWidth);
      for (let i = 0; i <= numCols; i++) {
        const x = i * colWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.restore();
    };

    const render = () => {
      // Dark slate background
      ctx.fillStyle = '#1a1b26';
      ctx.fillRect(0, 0, width, height);

      drawGrid();

      drops.forEach(drop => {
        drop.update();
        drop.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="interactive-bg-canvas" />;
};

export default InteractiveBackground;
