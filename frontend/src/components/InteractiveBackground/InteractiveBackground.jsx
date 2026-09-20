import React, { useRef, useEffect } from 'react';
import './InteractiveBackground.css';

const InteractiveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;

    const notes = [];
    const numNotes = 35;
    const noteSymbols = ['♪', '♫', '♬', '𝄞', '♭', '♮'];
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    class MusicNote {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height + height; // start below screen
        this.size = Math.random() * 20 + 15;
        this.symbol = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
        this.speedY = Math.random() * 1.5 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.phase = Math.random() * Math.PI * 2;
        this.glow = Math.random() * 15 + 5;
      }

      update(time) {
        // Move up
        this.y -= this.speedY;
        
        // Sway horizontally like a sine wave
        this.x += Math.sin(time * 0.002 + this.phase) * 1.5;

        // Mouse interaction (repel gently)
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          this.x -= dx * 0.02;
          this.y -= dy * 0.02;
        }

        // Reset if off top
        if (this.y < -50) {
          this.reset();
          this.y = height + 50;
        }
      }

      draw() {
        ctx.save();
        ctx.font = `${this.size}px Arial`;
        ctx.fillStyle = `rgba(0, 200, 255, ${this.opacity})`;
        ctx.shadowBlur = this.glow;
        ctx.shadowColor = '#00c8ff';
        ctx.fillText(this.symbol, this.x, this.y);
        ctx.restore();
      }
    }

    for (let i = 0; i < numNotes; i++) {
      notes.push(new MusicNote());
    }

    const drawWavyLines = (time) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#00c8ff';

      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 10) {
          const y = height * 0.5 + Math.sin(x * 0.003 + time * 0.001 + i) * 150 + (i * 20 - 40);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const render = (time) => {
      ctx.clearRect(0, 0, width, height);

      // Draw bokeh background
      const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
      grad.addColorStop(0, '#0a192f');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      drawWavyLines(time);

      notes.forEach(note => {
        note.update(time);
        note.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="interactive-bg-canvas" />;
};

export default InteractiveBackground;
