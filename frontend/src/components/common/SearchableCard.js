import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Box, 
  Chip,
  CardMedia
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useHistory } from 'react-router-dom';
import { 
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon
} from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';
import PriceDisplay from './PriceDisplay';
import UserMiniProfile from './UserMiniProfile';
import RatingDisplay from './RatingDisplay';
import TagChip from './TagChip';
import ActionButton from './ActionButton';

const useStyles = makeStyles((theme) => ({
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4]
    }
  },
  media: {
    height: theme.spacing(20),
    backgroundColor: theme.palette.action.hover
  },
  content: {
    flex: 1,
    paddingBottom: theme.spacing(1)
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical'
  },
  description: {
    marginBottom: theme.spacing(2),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    '-webkit-line-clamp': 3,
    '-webkit-box-orient': 'vertical',
    color: theme.palette.text.secondary
  },
  typeChip: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    fontWeight: 600
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem'
  },
  tags: {
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
    marginTop: theme.spacing(1)
  },
  actions: {
    padding: theme.spacing(2),
    paddingTop: 0,
    justifyContent: 'space-between'
  },
  priceSection: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1)
  }
}));

const getTypeColor = (type) => {
  switch (type) {
    case 'direct': return 'primary';
    case 'downloadable': return 'secondary';
    case 'offline': return 'default';
    default: return 'default';
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'direct': return ViewIcon;
    case 'downloadable': return DownloadIcon;
    case 'offline': return LocationIcon;
    default: return null;
  }
};

const SearchableCard = ({
  searchable,
  onClick,
  showUser = true,
  showRating = true,
  showStats = true,
  showTags = true,
  showActions = true,
  className
}) => {
  const classes = useStyles();
  const componentClasses = useComponentStyles();
  const history = useHistory();

  const handleClick = () => {
    if (onClick) {
      onClick(searchable);
    } else {
      history.push(`/searchable/${searchable.id}`);
    }
  };

  const handleUserClick = (e) => {
    e.stopPropagation();
  };

  const TypeIcon = getTypeIcon(searchable.type);

  return (
    <Card 
      className={`${classes.card} ${className || ''}`}
      onClick={handleClick}
    >
      {searchable.preview_url && (
        <Box position="relative">
          <CardMedia
            className={classes.media}
            image={searchable.preview_url}
            title={searchable.title}
          />
          <Chip
            label={searchable.type}
            size="small"
            color={getTypeColor(searchable.type)}
            className={classes.typeChip}
            icon={TypeIcon ? <TypeIcon fontSize="small" /> : undefined}
          />
        </Box>
      )}

      <CardContent className={classes.content}>
        <Typography variant="h6" className={classes.title}>
          {searchable.title}
        </Typography>

        {searchable.description && (
          <Typography variant="body2" className={classes.description}>
            {searchable.description}
          </Typography>
        )}

        {showUser && searchable.user && (
          <Box onClick={handleUserClick} mb={1}>
            <UserMiniProfile 
              user={searchable.user} 
              size="small"
              showRating={false}
            />
          </Box>
        )}

        {showRating && searchable.average_rating !== undefined && (
          <RatingDisplay
            rating={searchable.average_rating}
            count={searchable.rating_count}
            size="small"
          />
        )}

        {showStats && (
          <Box className={classes.stats}>
            {searchable.view_count !== undefined && (
              <Typography variant="caption">
                {searchable.view_count} views
              </Typography>
            )}
            {searchable.purchase_count !== undefined && (
              <Typography variant="caption">
                • {searchable.purchase_count} purchases
              </Typography>
            )}
          </Box>
        )}

        {showTags && searchable.tags && searchable.tags.length > 0 && (
          <Box className={classes.tags}>
            {searchable.tags.slice(0, 3).map((tag, index) => (
              <TagChip
                key={index}
                label={tag}
                size="small"
                onClick={(e) => e.stopPropagation()}
              />
            ))}
            {searchable.tags.length > 3 && (
              <Typography variant="caption" color="textSecondary">
                +{searchable.tags.length - 3} more
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      {showActions && (
        <CardActions className={classes.actions}>
          <Box className={classes.priceSection}>
            <PriceDisplay
              amount={searchable.price}
              originalAmount={searchable.original_price}
              size="large"
            />
          </Box>
          
          <ActionButton
            variant="contained"
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            View Details
          </ActionButton>
        </CardActions>
      )}
    </Card>
  );
};

export default SearchableCard;