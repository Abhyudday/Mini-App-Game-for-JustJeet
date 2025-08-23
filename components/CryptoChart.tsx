'use client';

import React, { useEffect, useRef } from 'react';

interface CandleData {
  x: number;
  open: number;
  high: number;
  low: number;
  close: number;
  isGreen: boolean;
  topY?: number; // Visual top position of candle body
  bottomY?: number; // Visual bottom position of candle body
}

interface CryptoChartProps {
  cameraX: number;
  onCandleData: (candles: CandleData[]) => void;
  resetChart?: boolean; // Optional prop to reset the chart
}

const CryptoChart: React.FC<CryptoChartProps> = ({ cameraX, onCandleData, resetChart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const candlesRef = useRef<CandleData[]>([]);

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

    // Initialize candles only if empty or reset requested
    const initializeCandles = () => {
      if (candlesRef.current.length === 0 || resetChart) {
        candlesRef.current = []; // Clear existing candles if reset requested
        let basePrice = 100;
        const candleSpacing = 60;

        // Generate initial set of candles
        for (let i = 0; i < 10; i++) { // Start with fewer candles
          const x = i * candleSpacing + 150;
          const volatility = 0.02;
          const trend = 0.001;
          
          let priceChange, open, close, high, low, isGreen;
          
          // First 3 candles are always green for easier start
          if (i < 3) {
            priceChange = Math.abs((Math.random() - 0.5) * volatility) + 0.005;
            open = basePrice;
            close = basePrice * (1 + priceChange);
            high = close * (1 + Math.random() * 0.01);
            low = Math.min(open, close) * (1 - Math.random() * 0.005);
            isGreen = true;
          } else {
            // Check if the previous candle was red to prevent consecutive red candles
            const previousCandle = candlesRef.current[i - 1];
            const previousWasRed = previousCandle && !previousCandle.isGreen;
            
            if (previousWasRed) {
              // Force this candle to be green if the previous one was red
              priceChange = Math.abs((Math.random() - 0.5) * volatility) + 0.005;
              open = basePrice;
              close = basePrice * (1 + priceChange);
              high = close * (1 + Math.random() * 0.01);
              low = Math.min(open, close) * (1 - Math.random() * 0.005);
              isGreen = true;
            } else {
              // Normal candle generation
              priceChange = (Math.random() - 0.5) * volatility + trend;
              open = basePrice;
              close = basePrice * (1 + priceChange);
              high = Math.max(open, close) * (1 + Math.random() * 0.01);
              low = Math.min(open, close) * (1 - Math.random() * 0.01);
              isGreen = close > open;
            }
          }
          
          candlesRef.current.push({
            x,
            open,
            high,
            low,
            close,
            isGreen
          });
          
          basePrice = close;
        }
        
        // Pass initial candle data to parent
        onCandleData(candlesRef.current);
      }
    };

    // Add new candles as needed based on camera position
    const addCandlesIfNeeded = () => {
      const lastCandle = candlesRef.current[candlesRef.current.length - 1];
      const candleSpacing = 60;
      
      // Add new candles if camera is getting close to the end
      if (lastCandle && lastCandle.x - cameraX < canvas.width + 200) {
        const volatility = 0.02;
        const trend = 0.001;
        let basePrice = lastCandle.close;
        
        // Add 5 new candles at a time
        for (let i = 0; i < 5; i++) {
          const x = lastCandle.x + candleSpacing * (i + 1);
          let priceChange, open, close, high, low, isGreen;
          
          // Check if the last candle was red to prevent consecutive red candles
          const lastCandleWasRed = candlesRef.current.length > 0 && !candlesRef.current[candlesRef.current.length - 1].isGreen;
          
          if (lastCandleWasRed) {
            // Force this candle to be green if the last one was red
            priceChange = Math.abs((Math.random() - 0.5) * volatility) + 0.005; // Ensure positive change
            open = basePrice;
            close = basePrice * (1 + priceChange);
            high = close * (1 + Math.random() * 0.01);
            low = Math.min(open, close) * (1 - Math.random() * 0.005);
            isGreen = true;
          } else {
            // Normal candle generation
            priceChange = (Math.random() - 0.5) * volatility + trend;
            open = basePrice;
            close = basePrice * (1 + priceChange);
            high = Math.max(open, close) * (1 + Math.random() * 0.01);
            low = Math.min(open, close) * (1 - Math.random() * 0.01);
            isGreen = close > open;
          }
          
          candlesRef.current.push({
            x,
            open,
            high,
            low,
            close,
            isGreen
          });
          
          basePrice = close;
        }
        
        // Update parent with new candles
        onCandleData(candlesRef.current);
      }
    };

    initializeCandles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(22, 33, 62, 0.9)');
      gradient.addColorStop(1, 'rgba(26, 26, 46, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add new candles as player progresses
      addCandlesIfNeeded();

      // Find price range for scaling
      const visibleCandles = candlesRef.current.filter(candle => {
        const x = candle.x - cameraX;
        return x > -50 && x < canvas.width + 50;
      });

      if (visibleCandles.length === 0) return;

      const minPrice = Math.min(...visibleCandles.map(c => c.low));
      const maxPrice = Math.max(...visibleCandles.map(c => c.high));
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.1;

      // Draw improved grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      const gridLines = 10;
      
      // Horizontal grid lines
      for (let i = 0; i <= gridLines; i++) {
        const y = (canvas.height / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Vertical grid lines
      const verticalLines = Math.floor(canvas.width / 60);
      for (let i = 0; i <= verticalLines; i++) {
        const x = (canvas.width / verticalLines) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Draw candles
      visibleCandles.forEach(candle => {
        const x = candle.x - cameraX;
        const candleWidth = 25; // Broader candles for better visibility
        
        // Scale prices to canvas height
        const scaleY = (price: number) => {
          return canvas.height - ((price - minPrice + padding) / (priceRange + 2 * padding)) * canvas.height;
        };

        const openY = scaleY(candle.open);
        const closeY = scaleY(candle.close);
        const highY = scaleY(candle.high);
        const lowY = scaleY(candle.low);

        // Calculate and store candle body positions for jump calculations
        const bodyHeight = Math.abs(closeY - openY);
        const bodyY = Math.min(openY, closeY);
        
        // Update candle with visual position data
        candle.topY = bodyY;
        candle.bottomY = bodyY + bodyHeight;

        // Draw wick
        ctx.strokeStyle = candle.isGreen ? '#00d4aa' : '#ff4757';
        ctx.lineWidth = 3; // Slightly thicker wick for broader candles
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.stroke();

        if (candle.isGreen) {
          // Green candle gradient
          const greenGradient = ctx.createLinearGradient(x, bodyY, x, bodyY + bodyHeight);
          greenGradient.addColorStop(0, '#00f5d4');
          greenGradient.addColorStop(1, '#00d4aa');
          ctx.fillStyle = greenGradient;
          ctx.shadowColor = '#00d4aa';
          ctx.shadowBlur = 8;
        } else {
          // Red candle gradient
          const redGradient = ctx.createLinearGradient(x, bodyY, x, bodyY + bodyHeight);
          redGradient.addColorStop(0, '#ff6b7a');
          redGradient.addColorStop(1, '#ff4757');
          ctx.fillStyle = redGradient;
          ctx.shadowColor = '#ff4757';
          ctx.shadowBlur = 8;
        }
        
        // Draw rounded rectangle for candle body
        const radius = 2;
        ctx.beginPath();
        ctx.roundRect(x, bodyY, candleWidth, Math.max(bodyHeight, 3), radius);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Add visual indicators for landing areas
        if (x >= 50 && x <= 150) { // Wider character landing area for broader candles
          // Draw landing zone indicator
          ctx.strokeStyle = candle.isGreen ? '#00ff88' : '#ff4444';
          ctx.lineWidth = 4;
          ctx.strokeRect(x - 8, bodyY - 8, candleWidth + 16, Math.max(bodyHeight, 3) + 16);
        }
      });

      // Update parent with latest candle data including topY values
      onCandleData(candlesRef.current);

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
  }, [cameraX, onCandleData, resetChart]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
};

export default CryptoChart;
