import React from 'react';
import { Box } from '@material-ui/core';
import PixelIcon from './PixelIcon';

const DecorativeIcons = ({ icons = [], containerSx = {} }) => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
      ...containerSx,
    }}
    data-testid="decorative-icons"
    id="decorative-icons"
  >
    {icons.map((icon, i) => (
      <Box
        key={i}
        sx={{
          position: 'absolute',
          top: icon.top,
          left: icon.left,
          right: icon.right,
          bottom: icon.bottom,
        }}
      >
        <PixelIcon
          src={icon.src}
          alt={icon.alt || `deco-${i}`}
          size={icon.size || 32}
          opacity={icon.opacity || 0.15}
          animation={icon.animation || 'float'}
          delay={icon.delay || i * 0.5}
        />
      </Box>
    ))}
  </Box>
);

export default DecorativeIcons;
