import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  CircularProgress
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import backend from '../views/utilities/Backend';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    width: '100%',
  },
  table: {
    display: 'table',
    width: '100%',
    tableLayout: 'fixed',
  },
  tableContainer: {
    width: '100%',
    overflowX: 'auto',
  },
  statusChip: {
    fontWeight: 'bold',
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
}));

const AIContentStatus = () => {
  const classes = useStyles();
  const [aiContents, setAiContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAIContents();
  }, []);

  const fetchAIContents = async () => {
    try {
      setLoading(true);
      const response = await backend.get('/v1/ai-content');
      
      if (response.data.success) {
        setAiContents(response.data.ai_contents || []);
      } else {
        setError(response.data.msg || 'Failed to fetch AI content');
      }
    } catch (err) {
      console.error('Error fetching AI content:', err);
      setError('Failed to load AI content');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'processed' ? 'primary' : 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Paper className={classes.paper}>
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper className={classes.paper}>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper className={classes.paper}>
      <Typography variant="h6" gutterBottom>
        AI Content Submissions
      </Typography>
      
      {aiContents.length === 0 ? (
        <Box className={classes.emptyState}>
          <Typography variant="body1">
            No AI content submissions yet
          </Typography>
        </Box>
      ) : (
        <TableContainer className={classes.tableContainer}>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell style={{ width: '50%' }}>Title</TableCell>
                <TableCell style={{ width: '20%' }} align="center">Status</TableCell>
                <TableCell style={{ width: '30%' }} align="right">Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {aiContents.map((content) => (
                <TableRow key={content.id}>
                  <TableCell component="th" scope="row">
                    {content.title}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={content.status}
                      color={getStatusColor(content.status)}
                      size="small"
                      className={classes.statusChip}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {formatDate(content.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default AIContentStatus;