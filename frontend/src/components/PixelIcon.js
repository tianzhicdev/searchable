import React from 'react';
import { Box } from '@material-ui/core';

const floatKeyframes = `
  @keyframes pixelFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes pixelPulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
  @keyframes pixelSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject keyframes once
let injected = false;
if (typeof document !== 'undefined' && !injected) {
  const style = document.createElement('style');
  style.textContent = floatKeyframes;
  document.head.appendChild(style);
  injected = true;
}

const animations = {
  float: 'pixelFloat 3s ease-in-out infinite',
  pulse: 'pixelPulse 2s ease-in-out infinite',
  spin: 'pixelSpin 8s linear infinite',
  none: 'none',
};

const PixelIcon = ({
  src,
  alt = 'pixel icon',
  size = 32,
  opacity = 1,
  animation = 'none',
  delay = 0,
  sx = {},
  ...props
}) => (
  <Box
    component="img"
    src={src}
    alt={alt}
    data-testid={`pixel-icon-${alt}`}
    sx={{
      width: size,
      height: size,
      objectFit: 'contain',
      imageRendering: 'pixelated',
      opacity,
      animation: animations[animation] || animation,
      animationDelay: `${delay}s`,
      pointerEvents: 'none',
      userSelect: 'none',
      ...sx,
    }}
    {...props}
  />
);

export default PixelIcon;
