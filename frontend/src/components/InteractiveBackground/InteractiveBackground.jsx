import React, { useRef, useEffect } from 'react';
import './InteractiveBackground.css';

const InteractiveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;

    const meteors = [];
    const numMeteors = 45;
    const colors = ['#082D26', '#164A32', '#336B47', '#82BA93', '#DAF1DE'];
    const columns = 30; // Number of vertical grid lines

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    class Meteor {
      constructor() {
        this.reset(true);
      }

      reset(randomY = false) {
        // Snap to grid column
        const colWidth = width / columns;
        const colIndex = Math.floor(Math.random() * columns);
        this.x = colIndex * colWidth + colWidth / 2;
        
        this.y = randomY ? Math.random() * height : -Math.random() * 500 - 100;
        this.length = Math.random() * 120 + 60;
        this.speed = Math.random() * 4 + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.thickness = Math.random() * 2 + 1.5;
        this.opacity = Math.random() * 0.7 + 0.3;
      }

      update() {
        this.y += this.speed;

        if (this.y - this.length > height) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.lineCap = 'round';
        ctx.lineWidth = this.thickness;

        // Gradient for the falling trail (head is opaque, tail is transparent)
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y - this.length);
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y - this.length);
        ctx.stroke();

        // Draw bright head
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness * 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    for (let i = 0; i < numMeteors; i++) {
      meteors.push(new Meteor());
    }

    const drawGrid = () => {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      
      const colWidth = width / columns;
      for (let i = 0; i <= columns; i++) {
        const x = i * colWidth + colWidth / 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.restore();
    };

    const render = () => {
      // Clear with new dark background
      ctx.fillStyle = '#031F22';
      ctx.fillRect(0, 0, width, height);

      drawGrid();

      meteors.forEach(meteor => {
        meteor.update();
        meteor.draw();
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
