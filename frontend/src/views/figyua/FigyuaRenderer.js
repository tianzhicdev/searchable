import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box,
  List,
  ListItem,
  Paper,
  CircularProgress,
  LinearProgress
} from '@material-ui/core';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import useComponentStyles from '../../themes/componentStyles';
import RenderingBox from './RenderingBox'; // Adjust the import path as needed
import backend from '../../views/utilities/Backend';

const FigyuaRenderer = () => {
  const classes = useComponentStyles();
  const location = useLocation();
  const [uuids, setUuids] = useState([]);
  const [error, setError] = useState(null);
  const [modelStatus, setModelStatus] = useState({});

  useEffect(() => {
    // Parse UUIDs from URL query parameters
    const params = new URLSearchParams(location.search);
    const uuidsParam = params.get('uuids');
    
    if (!uuidsParam) {
      setError('No figure UUIDs provided');
      return;
    }

    // Split the comma-separated UUIDs
    const parsedUuids = uuidsParam.split(',').map(uuid => uuid.trim());
    setUuids(parsedUuids);
    
    // Initialize model status for each UUID
    const initialStatus = {};
    parsedUuids.forEach(uuid => {
      initialStatus[uuid] = { loading: true, exists: false, progress: { preview: 0, refine: 0 } };
    });
    setModelStatus(initialStatus);
  }, [location.search]);

  useEffect(() => {
    // Check the status of each model
    const checkModelStatus = async () => {
      const statusPromises = uuids.map(async (uuid) => {
        try {
          const response = await backend.get(`check/${uuid}`);
          return { uuid, data: response.data };
        } catch (error) {
          console.error(`Error checking model status for ${uuid}:`, error);
          return { 
            uuid, 
            data: { exists: false, progress: { preview: 0, refine: 0 } } 
          };
        }
      });

      const statuses = await Promise.all(statusPromises);
      
      const newModelStatus = { ...modelStatus };
      statuses.forEach(({ uuid, data }) => {
        newModelStatus[uuid] = { 
          loading: !data.exists, 
          exists: data.exists,
          progress: data.progress 
        };
      });
      
      setModelStatus(newModelStatus);
    };

    if (uuids.length > 0) {
      checkModelStatus();
      
      // Set up polling interval to check progress
      const intervalId = setInterval(checkModelStatus, 5000);
      
      // Clear interval on cleanup
      return () => clearInterval(intervalId);
    }
  }, [uuids]);

  if (error) {
    return (
      <Container>
        <Box className={classes.errorMessage}>
          <Typography>{error}</Typography>
        </Box>
      </Container>
    );
  }

  if (uuids.length === 0 && !error) {
    return (
      <Container>
        <Box className={classes.noResults}>
          <Typography>No UUIDs found in the URL.</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" className={classes.sectionTitle}>
        Figure UUIDs
      </Typography>
      
      <Paper elevation={2} style={{ padding: '16px', marginTop: '16px' }}>
        <Typography variant="h6">UUIDs from URL:</Typography>
        <List>
          {uuids.map((uuid, index) => (
            <ListItem key={index} divider={index < uuids.length - 1}>
              <Box width="100%">
                <Typography variant="body1">{uuid}</Typography>
                
                {modelStatus[uuid]?.loading ? (
                  <Box className={classes.modelLoadingContainer} style={{ height: '400px' }}>
                    <Box textAlign="center">
                      <CircularProgress size={40} />
                      <Typography variant="body2" style={{ marginTop: '16px' }}>
                        Loading 3D Model...
                      </Typography>
                      {modelStatus[uuid]?.progress && (
                        <Box width="100%" maxWidth="300px" mt={2}>
                          <Typography variant="body2" gutterBottom>
                            Preview: {(modelStatus[uuid].progress.preview * 100).toFixed(0)}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={modelStatus[uuid].progress.preview * 100} 
                          />
                          <Typography variant="body2" gutterBottom mt={1}>
                            Refine: {(modelStatus[uuid].progress.refine * 100).toFixed(0)}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={modelStatus[uuid].progress.refine * 100} 
                            color="secondary"
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ height: '400px', width: '100%', marginTop: '10px' }}>
                    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                      <ambientLight intensity={0.5} />
                      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                      <pointLight position={[-10, -10, -10]} />
                      <RenderingBox 
                        modelId={uuid} 
                        position={[0, 0, 0]} 
                        scale={0.7} 
                      />
                      <OrbitControls enableZoom={true} />
                    </Canvas>
                  </Box>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default FigyuaRenderer;
