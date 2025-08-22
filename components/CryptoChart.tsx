'use client';

import React, { useEffect, useRef } from 'react';

interface CandleData {
  x: number;
  open: number;
  high: number;
  low: number;
  close: number;
  isGreen: boolean;
}

interface CryptoChartProps {
  chartSpeed: number;
  onRedLinePosition: (y: number) => void;
}

const CryptoChart: React.FC<CryptoChartProps> = ({ chartSpeed, onRedLinePosition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const candlesRef = useRef<CandleData[]>([]);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Generate initial candles
    const generateCandles = () => {
      candlesRef.current = [];
      let basePrice = 100;
      const candleWidth = 12;
      const candleSpacing = 16;

      for (let i = 0; i < Math.ceil(canvas.width / candleSpacing) + 10; i++) {
        const x = i * candleSpacing;
        const volatility = 0.02;
        const trend = 0.001; // Slight upward trend
        
        const priceChange = (Math.random() - 0.5) * volatility + trend;
        const open = basePrice;
        const close = basePrice * (1 + priceChange);
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        
        candlesRef.current.push({
          x,
          open,
          high,
          low,
          close,
          isGreen: close > open
        });
        
        basePrice = close;
      }
    };

    generateCandles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(22, 33, 62, 0.9)');
      gradient.addColorStop(1, 'rgba(26, 26, 46, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update offset for movement
      offsetRef.current += chartSpeed;

      // Add new candles as needed
      const candleSpacing = 16;
      const lastCandle = candlesRef.current[candlesRef.current.length - 1];
      if (lastCandle && lastCandle.x - offsetRef.current < canvas.width + 50) {
        const volatility = 0.02;
        const trend = 0.001;
        const priceChange = (Math.random() - 0.5) * volatility + trend;
        const open = lastCandle.close;
        const close = open * (1 + priceChange);
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        
        candlesRef.current.push({
          x: lastCandle.x + candleSpacing,
          open,
          high,
          low,
          close,
          isGreen: close > open
        });
      }

      // Remove old candles
      candlesRef.current = candlesRef.current.filter(candle => candle.x - offsetRef.current > -50);

      // Find price range for scaling
      const visibleCandles = candlesRef.current.filter(candle => {
        const x = candle.x - offsetRef.current;
        return x > -50 && x < canvas.width + 50;
      });

      if (visibleCandles.length === 0) return;

      const minPrice = Math.min(...visibleCandles.map(c => c.low));
      const maxPrice = Math.max(...visibleCandles.map(c => c.high));
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.1;

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      const gridLines = 8;
      for (let i = 0; i <= gridLines; i++) {
        const y = (canvas.height / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw candles
      visibleCandles.forEach(candle => {
        const x = candle.x - offsetRef.current;
        const candleWidth = 10;
        
        // Scale prices to canvas height
        const scaleY = (price: number) => {
          return canvas.height - ((price - minPrice + padding) / (priceRange + 2 * padding)) * canvas.height;
        };

        const openY = scaleY(candle.open);
        const closeY = scaleY(candle.close);
        const highY = scaleY(candle.high);
        const lowY = scaleY(candle.low);

        // Draw wick
        ctx.strokeStyle = candle.isGreen ? '#00d4aa' : '#ff4757';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.stroke();

        // Draw candle body
        const bodyHeight = Math.abs(closeY - openY);
        const bodyY = Math.min(openY, closeY);
        
        if (candle.isGreen) {
          ctx.fillStyle = '#00d4aa';
          ctx.shadowColor = '#00d4aa';
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = '#ff4757';
          ctx.shadowColor = '#ff4757';
          ctx.shadowBlur = 10;
        }
        
        ctx.fillRect(x, bodyY, candleWidth, Math.max(bodyHeight, 2));
        ctx.shadowBlur = 0;

        // Report red line position (lowest red candle)
        if (!candle.isGreen && x > canvas.width * 0.4 && x < canvas.width * 0.6) {
          onRedLinePosition(lowY);
        }
      });

      // Draw price labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px Inter';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const price = minPrice + (priceRange / 4) * i + padding;
        const y = canvas.height - ((price - minPrice + padding) / (priceRange + 2 * padding)) * canvas.height;
        ctx.fillText(`$${price.toFixed(2)}`, canvas.width - 10, y + 4);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chartSpeed, onRedLinePosition]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
};

export default CryptoChart;
