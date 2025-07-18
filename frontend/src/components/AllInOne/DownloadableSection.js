import React from 'react';
import { 
  Paper, Box, Typography, Button 
} from '@material-ui/core';
import {
  CloudDownload, GetApp as GetAppIcon, Check as CheckIcon
} from '@material-ui/icons';
import { formatCurrency } from '../../utils/searchableUtils';
import { testIdProps } from '../../utils/testIds';

const DownloadableSection = ({
  components,
  selectedFiles,
  userPaidFiles,
  handleFileSelection,
  handleDownload,
  theme,
  classes
}) => {
  if (!components.downloadable?.enabled) return null;

  return (
    <Paper 
      elevation={1} 
      style={{ marginBottom: 16, padding: 16, backgroundColor: theme.palette.background.paper }}
      {...testIdProps('section', 'allinone-downloadable', 'container')}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <CloudDownload style={{ marginRight: 8, color: theme.palette.primary.main }} />
        <Typography variant="h6" color="primary">
          Digital Downloads
        </Typography>
      </Box>
      {components.downloadable.files?.length > 0 ? (
        <Box>
          {components.downloadable.files.map((file) => {
            const isPaid = userPaidFiles.has(file.id.toString());
            return (
              <Paper 
                key={file.id}
                className={`${classes.fileItem} ${selectedFiles[file.id] ? classes.fileItemSelected : ''}`}
                onClick={() => !isPaid && handleFileSelection(file.id, !selectedFiles[file.id])}
                style={{ marginBottom: 8, cursor: isPaid ? 'default' : 'pointer' }}
                {...testIdProps('item', 'allinone-file', file.id)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                  <Box flex={1}>
                    <Typography variant="body1" style={{ fontWeight: 500 }}>{file.name}</Typography>
                    {file.description && (
                      <Typography variant="body2" style={{ marginTop: 4 }}>
                        {file.description}
                      </Typography>
                    )}
                    <Typography variant="body2" style={{ marginTop: 4, fontWeight: 500 }}>
                      {formatCurrency(file.price)}
                    </Typography>
                  </Box>
                  {isPaid ? (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<GetAppIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file.id, file.name);
                      }}
                      {...testIdProps('button', 'download-file', file.id)}
                    >
                      Download
                    </Button>
                  ) : (
                    selectedFiles[file.id] && (
                      <CheckIcon style={{ color: '#1976d2', fontSize: 28 }} />
                    )
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      ) : (
        <Typography className={classes.emptyState} {...testIdProps('text', 'allinone-downloadable', 'empty')}>
          No files available
        </Typography>
      )}
    </Paper>
  );
};

export default DownloadableSection;