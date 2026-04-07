import React from 'react';
import {
  Typography, Paper, Box, Divider
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import PostedBy from '../PostedBy';
import TagsOnProfile from '../Tags/TagsOnProfile';
import { useHistory } from 'react-router-dom';
import { navigateWithStack } from '../../utils/navigationUtils';
import { useTheme } from '@material-ui/core/styles';
import GetAppIcon from '@material-ui/icons/GetApp';
import PaymentIcon from '@material-ui/icons/Payment';
import StorefrontIcon from '@material-ui/icons/Storefront';
import StarIcon from '@material-ui/icons/Star';

const useStyles = makeStyles((theme) => ({
  profileCard: {
    cursor: 'pointer',
    width: '100%',
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
    // Glassmorphism
    background: `${theme.palette.background.paper}B3`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${theme.palette.divider}40`,
    borderRadius: '12px',
    boxShadow: 'none',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      background: `${theme.palette.background.paper}CC`,
      border: `1px solid ${theme.palette.primary.main}40`,
      boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 20px ${theme.palette.primary.main}15`,
    }
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.palette.grey[900] || theme.palette.grey[100],
    aspectRatio: '16 / 9',
    [theme.breakpoints.down('sm')]: {
      aspectRatio: '4 / 3'
    }
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
    '$profileCard:hover &': {
      transform: 'scale(1.03)',
    }
  },
  contentContainer: {
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5)
    }
  },
  title: {
    fontWeight: 700,
    marginBottom: theme.spacing(0.5),
    fontSize: '1.4rem',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    color: theme.palette.primary.main,
    lineHeight: 1.2,
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.2rem'
    }
  },
  description: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    marginTop: theme.spacing(0.75),
    color: theme.palette.text.secondary,
    fontSize: '0.95rem',
    lineHeight: 1.5,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.9rem'
    }
  },
  tagsSection: {
    marginTop: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(0.75)
    }
  },
  metaInfo: {
    marginTop: theme.spacing(0.75),
    color: theme.palette.text.secondary,
    fontSize: '0.95rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.875rem'
    }
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.grey[900] || theme.palette.grey[200],
    color: theme.palette.text.secondary
  },
  typeIconContainer: {
    display: 'flex',
    gap: theme.spacing(0.75),
    marginTop: theme.spacing(0.75),
    marginBottom: theme.spacing(0.75),
    '& .MuiSvgIcon-root': {
      fontSize: '1.1rem',
      color: theme.palette.secondary.main,
      opacity: 0.8
    }
  },
  // Price badge overlay on image
  priceBadge: {
    position: 'absolute',
    top: theme.spacing(1.5),
    right: theme.spacing(1.5),
    background: `${theme.palette.background.paper}CC`,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '8px',
    padding: theme.spacing(0.5, 1),
    fontWeight: 700,
    fontSize: '0.9rem',
    color: theme.palette.primary.main,
  },
  // Rating badge
  ratingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: '0.85rem',
    color: theme.palette.text.secondary,
    '& .MuiSvgIcon-root': {
      fontSize: '0.95rem',
      color: theme.palette.warning.main,
    }
  },
  // Meta row for inline layout
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
  }
}));

const MiniProfile = ({
  type = 'searchable',
  data,
  onClick
}) => {
  const classes = useStyles();
  const history = useHistory();
  const theme = useTheme();

  if (!data) return null;

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getSearchableTypeIcons = (data) => {
    const publicData = data.payloads?.public || {};
    const searchableType = publicData.type || data.type;
    const icons = [];

    if (searchableType === 'allinone') {
      const components = publicData.components || {};
      if (components.downloadable?.enabled && components.downloadable?.files?.length > 0) {
        icons.push(<GetAppIcon key="downloadable" />);
      }
      if (components.offline?.enabled && components.offline?.items?.length > 0) {
        icons.push(<StorefrontIcon key="offline" />);
      }
      if (components.donation?.enabled) {
        icons.push(<PaymentIcon key="donation" />);
      }
    } else {
      switch (searchableType) {
        case 'offline':
          icons.push(<StorefrontIcon key="offline" />);
          break;
        case 'direct':
          icons.push(<PaymentIcon key="direct" />);
          break;
        case 'downloadable':
          icons.push(<GetAppIcon key="downloadable" />);
          break;
      }
    }
    return icons;
  };

  let title, description, imageUrl, tags, metaInfo, clickPath;

  if (type === 'searchable') {
    const publicData = data.payloads?.public || {};
    title = publicData.title;
    description = publicData.description;
    imageUrl = publicData.images?.[0];
    tags = data.tags || [];
    metaInfo = {
      username: data.username,
      userId: data.user_id,
      price: publicData.price,
      category: publicData.category,
      searchableType: publicData.type || data.type,
      rating: data.avg_rating,
      totalRatings: data.total_ratings
    };
    clickPath = `/allinone-item/${data.searchable_id}`;
  } else if (type === 'user') {
    title = data.displayName || data.username;
    description = data.introduction;
    imageUrl = data.profile_image_url;
    tags = data.tags || [];
    metaInfo = {
      username: data.username,
      searchableCount: data.searchableCount,
      rating: data.rating,
      totalRatings: data.totalRatings,
      userId: data.user_id
    };
    clickPath = `/profile/${data.user_id || data.id}`;
  }

  const handleClick = () => {
    if (onClick) {
      onClick(data);
    } else if (clickPath) {
      navigateWithStack(history, clickPath);
    }
  };

  return (
    <Paper className={classes.profileCard} onClick={handleClick} elevation={0}>
      {/* Image with price badge overlay */}
      {imageUrl && (
        <Box className={classes.imageContainer} style={{ position: 'relative' }}>
          <img
            src={imageUrl}
            alt={title}
            className={classes.image}
          />
          {/* Price badge on image */}
          {type === 'searchable' && metaInfo.price && (
            <Box className={classes.priceBadge}>
              ${metaInfo.price}
            </Box>
          )}
        </Box>
      )}

      {/* Content */}
      <Box className={classes.contentContainer}>
        <Typography variant="h3" className={classes.title}>
          {truncateText(title, 50)}
        </Typography>

        {/* Type icons + rating on same row */}
        {type === 'searchable' && (
          <Box className={classes.metaRow}>
            {(() => {
              const icons = getSearchableTypeIcons(data);
              return icons.length > 0 ? (
                <Box className={classes.typeIconContainer} style={{ margin: 0 }}>
                  {icons}
                </Box>
              ) : <span />;
            })()}
            {typeof metaInfo.rating === 'number' && metaInfo.totalRatings > 0 && (
              <Box className={classes.ratingBadge}>
                <StarIcon />
                {metaInfo.rating.toFixed(1)} ({metaInfo.totalRatings})
              </Box>
            )}
          </Box>
        )}

        <Divider style={{ margin: '6px 0' }} />

        {/* Searchable meta */}
        {type === 'searchable' && metaInfo.username && (
          <Box className={classes.metaInfo}>
            <PostedBy
              username={metaInfo.username}
              userId={metaInfo.userId}
              maxLength={30}
              rating={data.seller_rating}
              totalRatings={data.seller_total_ratings}
            />
            {metaInfo.category && (
              <Typography variant="body2" style={{ marginTop: 2 }}>
                {truncateText(metaInfo.category, 30)}
              </Typography>
            )}
          </Box>
        )}

        {/* User meta */}
        {type === 'user' && (
          <Box className={classes.metaInfo}>
            <Box className={classes.metaRow}>
              {metaInfo.username && title !== metaInfo.username && (
                <Typography variant="body2">@{metaInfo.username}</Typography>
              )}
              {typeof metaInfo.rating === 'number' && metaInfo.totalRatings > 0 && (
                <Box className={classes.ratingBadge}>
                  <StarIcon />
                  {metaInfo.rating.toFixed(1)} ({metaInfo.totalRatings})
                </Box>
              )}
            </Box>
            {typeof metaInfo.searchableCount === 'number' && (
              <Typography variant="body2" style={{ marginTop: 2 }}>
                {metaInfo.searchableCount} item{metaInfo.searchableCount !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        )}

        {/* Description */}
        {description && (
          <Typography variant="body2" className={classes.description}>
            {truncateText(description, 150)}
          </Typography>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <Box className={classes.tagsSection}>
            <TagsOnProfile tags={tags} />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MiniProfile;
