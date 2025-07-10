import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination, 
  Paper, 
  Typography,
  Box,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { touchTargets, componentSpacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  tableContainer: {
    overflowX: 'auto',
    // Add horizontal scroll on mobile
    [theme.breakpoints.down('sm')]: {
      marginLeft: -theme.spacing(2),
      marginRight: -theme.spacing(2),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      '& table': {
        minWidth: 600
      }
    }
  },
  tableCell: {
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
      fontSize: '0.875rem'
    }
  },
  headerCell: {
    fontWeight: 600,
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
      fontSize: '0.875rem'
    }
  },
  tableRow: {
    minHeight: touchTargets.clickable.minHeight,
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  },
  titleBox: {
    ...componentSpacing.card(theme),
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  emptyBox: {
    ...componentSpacing.card(theme),
    textAlign: 'center'
  },
  pagination: {
    [theme.breakpoints.down('sm')]: {
      '& .MuiTablePagination-toolbar': {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1)
      },
      '& .MuiTablePagination-selectLabel': {
        display: 'none'
      },
      '& .MuiTablePagination-displayedRows': {
        fontSize: '0.75rem'
      }
    }
  }
}));

/**
 * A reusable table component that dynamically renders data objects
 * with pagination support.
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of objects to display
 * @param {String} props.title - Optional table title
 * @param {Number} props.rowsPerPage - Optional rows per page (defaults to 20)
 * @param {Object} props.emptyMessage - Optional message when no data
 * @param {Array} props.excludeColumns - Optional array of column names to exclude
 */
const CompactTable = ({ 
  data = [], 
  title = '', 
  rowsPerPage: defaultRowsPerPage = 20,
  emptyMessage = "No records found.",
  excludeColumns = []
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get columns from first data item or return empty array if no data
  const columns = data.length > 0 
    ? Object.keys(data[0]).filter(key => !excludeColumns.includes(key)) 
    : [];

  // Format column header text (capitalize and replace underscores with spaces)
  const formatColumnHeader = (column) => {
    return column
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get paginated data
  const paginatedData = data.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper elevation={2}>
      {title && (
        <Box className={classes.titleBox}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      
      {data.length === 0 ? (
        <Box className={classes.emptyBox}>
          <Typography variant="body1">{emptyMessage}</Typography>
        </Box>
      ) : (
        <>
          <TableContainer className={classes.tableContainer}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column} className={classes.headerCell}>
                      <Typography variant="subtitle2">
                        {formatColumnHeader(column)}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className={classes.tableRow}>
                    {columns.map((column) => (
                      <TableCell key={`${rowIndex}-${column}`} className={classes.tableCell}>
                        {row[column] !== undefined ? String(row[column]) : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            className={classes.pagination}
            rowsPerPageOptions={isMobile ? [10, 20] : [10, 20, 50]}
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Paper>
  );
};

export default CompactTable; 