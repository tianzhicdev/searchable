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
  Box 
} from '@material-ui/core';

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
        <Box p={2} pb={1}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      
      {data.length === 0 ? (
        <Box p={3} textAlign="center">
          <Typography variant="body1">{emptyMessage}</Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      <Typography variant="subtitle2">
                        {formatColumnHeader(column)}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column) => (
                      <TableCell key={`${rowIndex}-${column}`}>
                        {row[column] !== undefined ? String(row[column]) : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
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