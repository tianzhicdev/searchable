import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@material-ui/core';
import configData from '../config';
import backend from '../views/utilities/Backend';

/**
 * Component that detects subdomain and redirects to the appropriate searchable
 */
const SubdomainRedirect = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const detectAndRedirect = async () => {
      try {
        // Get the current hostname
        const hostname = window.location.hostname;
        const parts = hostname.split('.');

        // Check if we're on a subdomain
        // For eccentricprotocol.com, we expect: subdomain.eccentricprotocol.com
        // parts = ['subdomain', 'eccentricprotocol', 'com']
        if (parts.length >= 3) {
          const subdomain = parts[0];

          // Skip common subdomains
          const skipSubdomains = ['www', 'api', 'admin', 'app', 'staging', 'dev'];
          if (skipSubdomains.includes(subdomain)) {
            // Redirect to landing page
            history.push('/landing');
            return;
          }

          // Fetch searchable by subdomain
          try {
            const response = await backend.get(`v1/searchable/by-subdomain/${subdomain}`);
            const searchableData = response.data.searchable;

            if (searchableData && searchableData.searchable_id) {
              // Determine the appropriate detail page based on type
              const searchableType = searchableData.type || 'allinone';
              let detailPath = '';

              switch (searchableType) {
                case 'downloadable':
                  detailPath = `/searchable-item/${searchableData.searchable_id}`;
                  break;
                case 'offline':
                  detailPath = `/offline-item/${searchableData.searchable_id}`;
                  break;
                case 'direct':
                  detailPath = `/direct-item/${searchableData.searchable_id}`;
                  break;
                case 'allinone':
                default:
                  // Always use allinone-item route for backward compatibility
                  detailPath = `/allinone-item/${searchableData.searchable_id}`;
                  break;
              }

              // Redirect to the detail page
              history.push(detailPath);
            } else {
              // Subdomain not found, go to landing
              setError('Store not found');
              setTimeout(() => {
                history.push('/landing');
              }, 2000);
            }
          } catch (err) {
            console.error('Error fetching subdomain:', err);
            setError('Store not found');
            setTimeout(() => {
              history.push('/landing');
            }, 2000);
          }
        } else {
          // No subdomain, go to landing
          history.push('/landing');
        }
      } catch (err) {
        console.error('Error in subdomain detection:', err);
        history.push('/landing');
      } finally {
        setLoading(false);
      }
    };

    detectAndRedirect();
  }, [history]);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1">Loading store...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        gap={2}
      >
        <Typography variant="h6" color="error">{error}</Typography>
        <Typography variant="body2">Redirecting to homepage...</Typography>
      </Box>
    );
  }

  return null;
};

export default SubdomainRedirect;
