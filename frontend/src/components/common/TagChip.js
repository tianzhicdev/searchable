import React from 'react';
import { Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { testIdProps } from '../../utils/testIds';

const useStyles = makeStyles((theme) => ({
  chip: {
    borderRadius: theme.spacing(1),
    fontWeight: 500,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText
    }
  },
  clickable: {
    cursor: 'pointer'
  },
  primary: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark
    }
  },
  secondary: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark
    }
  },
  small: {
    height: theme.spacing(3),
    fontSize: '0.75rem',
    '& .MuiChip-label': {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1)
    }
  }
}));

const TagChip = ({
  label,
  onClick,
  onDelete,
  size = 'medium',
  color = 'default',
  variant = 'outlined',
  selected = false,
  className,
  testId,
  ...chipProps
}) => {
  const classes = useStyles();

  const getClassName = () => {
    const classNames = [classes.chip];
    
    if (onClick) classNames.push(classes.clickable);
    if (selected || color === 'primary') classNames.push(classes.primary);
    if (color === 'secondary') classNames.push(classes.secondary);
    if (size === 'small') classNames.push(classes.small);
    if (className) classNames.push(className);
    
    return classNames.join(' ');
  };

  // Generate test ID from testId prop or label
  const chipTestId = testId || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : 'tag-chip');

  return (
    <Chip
      label={label}
      onClick={onClick}
      onDelete={onDelete}
      size={size === 'small' ? 'small' : 'medium'}
      variant={selected ? 'default' : variant}
      className={getClassName()}
      {...testIdProps('chip', 'tag', chipTestId)}
      {...chipProps}
    />
  );
};

export default TagChip;