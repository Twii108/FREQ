import { useEffect, useRef } from 'react';
import './EqualizerCanvas.css';

const EqualizerCanvas = ({ isPlaying = false, barCount = 32 }) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Handle high-DPI scaling
    const width = canvas.offsetWidth || 300;
    const height = canvas.offsetHeight || 60;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const totalBars = barCount;
      const barWidth = (width / totalBars) - 2;

      for (let i = 0; i < totalBars; i++) {
        let barHeight;
        if (isPlaying) {
          // Dynamic sine + random noise modulation
          const sinVal = Math.sin(phase + (i * 0.2)) * 0.5 + 0.5;
          const randomNoise = Math.random() * 0.3;
          barHeight = Math.max(6, (sinVal * 0.7 + randomNoise) * (height - 10));
        } else {
          barHeight = 4;
        }

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Glowing gradient fill
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#a855f7');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';
        ctx.shadowBlur = isPlaying ? 8 : 0;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.08;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, barCount]);

  return (
    <div className="equalizer-canvas-wrapper">
      <canvas ref={canvasRef} className="equalizer-canvas" />
    </div>
  );
};

export default EqualizerCanvas;
