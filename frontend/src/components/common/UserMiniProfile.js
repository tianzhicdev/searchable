import React from 'react';
import { Box, Typography, Avatar, Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { Person as PersonIcon, Verified as VerifiedIcon } from '@material-ui/icons';
import { Link } from 'react-router-dom';
import useComponentStyles from '../../themes/componentStyles';
import RatingDisplay from './RatingDisplay';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    textDecoration: 'none',
    color: 'inherit',
    '&:hover': {
      '& $username': {
        textDecoration: 'underline'
      }
    }
  },
  avatar: {
    width: theme.spacing(5),
    height: theme.spacing(5),
    backgroundColor: theme.palette.primary.main
  },
  avatarSmall: {
    width: theme.spacing(4),
    height: theme.spacing(4)
  },
  avatarLarge: {
    width: theme.spacing(6),
    height: theme.spacing(6)
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5)
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5)
  },
  username: {
    fontWeight: 500,
    color: theme.palette.text.primary
  },
  verifiedIcon: {
    fontSize: theme.spacing(2),
    color: theme.palette.primary.main
  },
  role: {
    fontSize: '0.75rem',
    height: theme.spacing(2.5),
    '& .MuiChip-label': {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1)
    }
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: '0.875rem',
    color: theme.palette.text.secondary
  }
}));

const UserMiniProfile = ({
  user,
  size = 'medium',
  showRating = true,
  showRole = true,
  showStats = false,
  clickable = true,
  className,
  avatarSrc,
  inline = false
}) => {
  const classes = useStyles();
  const componentClasses = useComponentStyles();

  if (!user) return null;

  const getSizeClass = () => {
    switch (size) {
      case 'small': return classes.avatarSmall;
      case 'large': return classes.avatarLarge;
      default: return '';
    }
  };

  const getUserRole = () => {
    if (user.is_admin) return 'Admin';
    if (user.is_publisher) return 'Publisher';
    return 'User';
  };

  const getRoleColor = () => {
    if (user.is_admin) return 'error';
    if (user.is_publisher) return 'primary';
    return 'default';
  };

  const content = (
    <>
      <Avatar 
        src={avatarSrc || user.avatar_url}
        className={`${classes.avatar} ${getSizeClass()}`}
      >
        {!avatarSrc && !user.avatar_url && <PersonIcon />}
      </Avatar>

      <Box className={classes.info}>
        <Box className={classes.nameRow}>
          <Typography 
            variant={size === 'small' ? 'body2' : 'body1'} 
            className={classes.username}
          >
            {user.username || user.email || 'Anonymous'}
          </Typography>
          
          {user.is_verified && (
            <VerifiedIcon className={classes.verifiedIcon} />
          )}
          
          {showRole && user.is_publisher && !inline && (
            <Chip
              label={getUserRole()}
              color={getRoleColor()}
              size="small"
              className={classes.role}
            />
          )}
        </Box>

        {showRating && user.average_rating !== undefined && !inline && (
          <RatingDisplay
            rating={user.average_rating}
            count={user.rating_count}
            size="small"
          />
        )}

        {showStats && !inline && (
          <Box className={classes.stats}>
            {user.searchables_count !== undefined && (
              <Typography variant="caption">
                {user.searchables_count} searchables
              </Typography>
            )}
            {user.sales_count !== undefined && (
              <Typography variant="caption">
                • {user.sales_count} sales
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </>
  );

  if (clickable && user.username) {
    return (
      <Link 
        to={`/user/${user.username}`}
        className={`${classes.container} ${className || ''}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <Box className={`${classes.container} ${className || ''}`}>
      {content}
    </Box>
  );
};

export default UserMiniProfile;