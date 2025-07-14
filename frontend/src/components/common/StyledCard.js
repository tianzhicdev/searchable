/**
 * StyledCard Component
 * A reusable card component with consistent styling
 */

import React from 'react';
import { Card, CardContent, CardActions, CardMedia, CardHeader } from '@material-ui/core';
import { components, combineStyles } from '../../themes/styleSystem';

const StyledCard = ({ 
  children,
  title,
  subtitle,
  media,
  mediaHeight = '200px',
  actions,
  header,
  hover = false,
  clickable = false,
  onClick,
  elevation = 1,
  sx = {},
  contentSx = {},
  actionsSx = {},
  ...props 
}) => {
  // Combine base card styles with optional hover and clickable styles
  const cardStyles = combineStyles(
    components.card.base,
    hover && components.card.hover,
    clickable && components.card.clickable,
    sx
  );

  const handleClick = clickable && onClick ? onClick : undefined;

  return (
    <Card 
      elevation={elevation} 
      sx={cardStyles} 
      onClick={handleClick}
      {...props}
    >
      {header && (
        <CardHeader
          title={header.title}
          subheader={header.subtitle}
          action={header.action}
          avatar={header.avatar}
        />
      )}
      
      {title && !header && (
        <CardHeader
          title={title}
          subheader={subtitle}
        />
      )}
      
      {media && (
        <CardMedia
          component={media.component || 'img'}
          height={mediaHeight}
          image={media.image || media}
          alt={media.alt || 'Card media'}
          sx={media.sx}
        />
      )}
      
      <CardContent sx={{ ...contentSx }}>
        {children}
      </CardContent>
      
      {actions && (
        <CardActions sx={{ ...actionsSx }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default StyledCard;