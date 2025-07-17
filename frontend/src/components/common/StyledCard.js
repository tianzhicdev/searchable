/**
 * StyledCard Component
 * A reusable card component with consistent styling
 */

import React from 'react';
import { Card, CardContent, CardActions, CardMedia, CardHeader } from '@material-ui/core';
import { components, combineStyles } from '../../themes/styleSystem';
import { testIdProps } from '../../utils/testIds';

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
  testId,
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

  // Generate test ID if provided
  const cardTestId = testId || 'styled-card';

  return (
    <Card 
      elevation={elevation} 
      sx={cardStyles} 
      onClick={handleClick}
      {...testIdProps('card', cardTestId, 'container')}
      {...props}
    >
      {header && (
        <CardHeader
          title={header.title}
          subheader={header.subtitle}
          action={header.action}
          avatar={header.avatar}
          {...testIdProps('card', cardTestId, 'header')}
        />
      )}
      
      {title && !header && (
        <CardHeader
          title={title}
          subheader={subtitle}
          {...testIdProps('card', cardTestId, 'title-header')}
        />
      )}
      
      {media && (
        <CardMedia
          component={media.component || 'img'}
          height={mediaHeight}
          image={media.image || media}
          alt={media.alt || 'Card media'}
          sx={media.sx}
          {...testIdProps('card', cardTestId, 'media')}
        />
      )}
      
      <CardContent sx={{ ...contentSx }} {...testIdProps('card', cardTestId, 'content')}>
        {children}
      </CardContent>
      
      {actions && (
        <CardActions sx={{ ...actionsSx }} {...testIdProps('card', cardTestId, 'actions')}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default StyledCard;