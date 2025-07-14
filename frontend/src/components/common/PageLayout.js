import React from 'react';
import { Container, Box, Typography, Breadcrumbs, Link, Paper } from '@material-ui/core';
import { NavigateNext as NavigateNextIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { Link as RouterLink } from 'react-router-dom';
import useComponentStyles from '../../themes/componentStyles';
import { componentSpacing, responsiveSpacing, spacing } from '../../utils/spacing';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    paddingTop: responsiveSpacing(3),
    paddingBottom: responsiveSpacing(6)
  },
  container: {
    ...componentSpacing.pageContainer(theme)
  },
  header: {
    marginBottom: responsiveSpacing(3)
  },
  breadcrumbs: {
    marginBottom: spacing(2)
  },
  titleSection: {
    marginBottom: responsiveSpacing(3)
  },
  title: {
    fontWeight: 600,
    marginBottom: spacing(1)
  },
  subtitle: {
    color: theme.palette.text.secondary
  },
  content: {
    ...componentSpacing.section(theme)
  },
  paper: {
    ...componentSpacing.card(theme),
    padding: responsiveSpacing(3)
  },
  noPadding: {
    padding: 0
  }
}));

const PageLayout = ({
  title,
  subtitle,
  breadcrumbs,
  children,
  loading = false,
  error = null,
  maxWidth = 'lg',
  showPaper = true,
  paperProps = {},
  className,
  contentClassName,
  headerActions,
  noPadding = false,
  containerProps = {}
}) => {
  const classes = useStyles();
  const componentClasses = useComponentStyles();

  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return (
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        className={classes.breadcrumbs}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          if (isLast || !crumb.path) {
            return (
              <Typography key={index} color="textPrimary" variant="body2">
                {crumb.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              component={RouterLink}
              to={crumb.path}
              color="inherit"
              variant="body2"
            >
              {crumb.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    );
  };

  const renderHeader = () => {
    if (!title && !breadcrumbs) return null;

    return (
      <Box className={classes.header}>
        {renderBreadcrumbs()}
        
        {title && (
          <Box className={classes.titleSection}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Typography variant="h4" className={classes.title}>
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body1" className={classes.subtitle}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
              {headerActions && (
                <Box ml={2}>
                  {headerActions}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    if (error) {
      return <ErrorState message={error} />;
    }

    const content = (
      <Box className={`${classes.content} ${contentClassName || ''}`}>
        {children}
      </Box>
    );

    if (showPaper) {
      return (
        <Paper 
          className={`${classes.paper} ${noPadding ? classes.noPadding : ''}`}
          elevation={1}
          {...paperProps}
        >
          {content}
        </Paper>
      );
    }

    return content;
  };

  return (
    <Box className={`${classes.root} ${className || ''}`}>
      <Container 
        maxWidth={maxWidth} 
        className={classes.container}
        {...containerProps}
      >
        {renderHeader()}
        {renderContent()}
      </Container>
    </Box>
  );
};

export default PageLayout;