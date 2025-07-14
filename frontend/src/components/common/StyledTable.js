/**
 * StyledTable Component
 * A reusable table component with consistent styling
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Checkbox,
  TableSortLabel
} from '@material-ui/core';
import { components } from '../../themes/styleSystem';

const StyledTable = ({
  columns,
  data,
  onRowClick,
  selectable = false,
  selected = [],
  onSelectAll,
  onSelectRow,
  sortable = false,
  orderBy,
  order = 'asc',
  onSort,
  pagination = false,
  page = 0,
  rowsPerPage = 10,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  stickyHeader = false,
  size = 'medium',
  sx = {},
  containerSx = {},
  ...props
}) => {
  const handleSelectAll = (event) => {
    if (onSelectAll) {
      onSelectAll(event.target.checked);
    }
  };

  const handleSelectRow = (event, row) => {
    event.stopPropagation();
    if (onSelectRow) {
      onSelectRow(row);
    }
  };

  const handleSort = (column) => {
    if (sortable && onSort && column.sortable !== false) {
      onSort(column.field);
    }
  };

  const isSelected = (row) => {
    return selected.some(item => item.id === row.id);
  };

  const numSelected = selected.length;
  const rowCount = data.length;

  return (
    <>
      <TableContainer 
        component={Paper} 
        sx={{ ...components.table.container, ...containerSx }}
      >
        <Table 
          stickyHeader={stickyHeader} 
          size={size} 
          sx={sx}
          {...props}
        >
          <TableHead>
            <TableRow sx={components.table.header}>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={numSelected > 0 && numSelected < rowCount}
                    checked={rowCount > 0 && numSelected === rowCount}
                    onChange={handleSelectAll}
                    color="primary"
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  style={{ width: column.width }}
                  sx={components.table.cell}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.field}
                      direction={orderBy === column.field ? order : 'asc'}
                      onClick={() => handleSort(column)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => {
              const isItemSelected = isSelected(row);
              
              return (
                <TableRow
                  key={row.id || index}
                  hover
                  onClick={() => onRowClick && onRowClick(row)}
                  selected={isItemSelected}
                  sx={{
                    ...components.table.row,
                    cursor: onRowClick ? 'pointer' : 'default'
                  }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={(event) => handleSelectRow(event, row)}
                        color="primary"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={column.field}
                      align={column.align || 'left'}
                      sx={components.table.cell}
                    >
                      {column.render 
                        ? column.render(row[column.field], row)
                        : row[column.field]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {pagination && (
        <TablePagination
          component="div"
          count={totalCount || data.length}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      )}
    </>
  );
};

export default StyledTable;