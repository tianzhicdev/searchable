import React from 'react';
import { 
  Chip 
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { touchTargets } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  userTag: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    margin: theme.spacing(0.5),
    fontSize: '0.875rem',
    minHeight: 32,
    height: 'auto',
    '& .MuiChip-label': {
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
      paddingTop: theme.spacing(0.5),
      paddingBottom: theme.spacing(0.5),
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem',
      minHeight: touchTargets.clickable.minHeight - 16, // 28px
      margin: theme.spacing(0.25),
      '& .MuiChip-label': {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
      }
    },
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
    }
  },
  searchableTag: {
    backgroundColor: theme.palette.secondary.light,
    color: theme.palette.secondary.contrastText,
    margin: theme.spacing(0.5),
    fontSize: '0.875rem',
    minHeight: 32,
    height: 'auto',
    '& .MuiChip-label': {
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
      paddingTop: theme.spacing(0.5),
      paddingBottom: theme.spacing(0.5),
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem',
      minHeight: touchTargets.clickable.minHeight - 16, // 28px
      margin: theme.spacing(0.25),
      '& .MuiChip-label': {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
      }
    },
    '&:hover': {
      backgroundColor: theme.palette.secondary.main,
    }
  },
  clickable: {
    cursor: 'pointer'
  },
  deletable: {
    '& .MuiChip-deleteIcon': {
      fontSize: '18px',
      marginRight: theme.spacing(0.5),
      [theme.breakpoints.down('sm')]: {
        fontSize: '16px',
        marginRight: theme.spacing(0.25)
      }
    }
  }
}));

const TagChip = ({ 
  tag, 
  clickable = false, 
  deletable = false, 
  onDelete = null, 
  onClick = null,
  size = 'small',
  variant = 'filled'
}) => {
  const classes = useStyles();
  
  // Determine styling based on tag type
  const tagClass = tag.tag_type === 'user' ? classes.userTag : classes.searchableTag;
  const chipClass = `${tagClass} ${clickable ? classes.clickable : ''} ${deletable ? classes.deletable : ''}`;
  
  const handleClick = () => {
    if (clickable && onClick) {
      onClick(tag);
    }
  };
  
  const handleDelete = () => {
    if (deletable && onDelete) {
      onDelete(tag);
    }
  };
  
  return (
    <Chip
      label={tag.name}
      className={chipClass}
      size={size}
      variant={variant}
      onClick={handleClick}
      onDelete={deletable ? handleDelete : undefined}
      title={tag.description || tag.name}
    />
  );
};

export default TagChip;