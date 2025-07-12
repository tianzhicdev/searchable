import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Typography,
  Button,
  Box
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    color: '#fff',
    overflow: 'hidden',
    position: 'relative',
    perspective: '1000px',
  },
  cockpitContainer: {
    width: '100%',
    height: '100vh',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cockpitInterior: {
    width: '90%',
    height: '80%',
    position: 'relative',
    transformStyle: 'preserve-3d',
  },
  // Left control panel
  leftPanel: {
    position: 'absolute',
    left: '0',
    top: '20%',
    width: '120px',
    height: '60%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    border: '1px solid #00ffff',
    borderRadius: '8px',
    transform: 'rotateY(20deg) translateZ(50px)',
    boxShadow: 'inset 0 0 20px rgba(0,255,255,0.2)',
  },
  // Right control panel
  rightPanel: {
    position: 'absolute',
    right: '0',
    top: '20%',
    width: '120px',
    height: '60%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    border: '1px solid #00ffff',
    borderRadius: '8px',
    transform: 'rotateY(-20deg) translateZ(50px)',
    boxShadow: 'inset 0 0 20px rgba(0,255,255,0.2)',
  },
  // Control buttons on panels
  panelButton: {
    width: '20px',
    height: '20px',
    borderRadius: '3px',
    border: '1px solid #00ff00',
    backgroundColor: 'rgba(0,255,0,0.3)',
    margin: '8px',
    animation: '$glow 3s ease-in-out infinite alternate',
  },
  // Main viewport
  viewport: {
    position: 'absolute',
    top: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '70%',
    height: '65%',
    background: 'linear-gradient(180deg, #000011 0%, #001122 50%, #0066aa 100%)',
    border: '2px solid #00aaff',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 30px rgba(0,170,255,0.3)',
  },
  // Earth in viewport
  earth: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #4da6ff 0%, #0066cc 50%, #003d7a 100%)',
    marginBottom: theme.spacing(2),
    animation: '$rotate 20s linear infinite',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '20%',
      left: '10%',
      width: '30%',
      height: '40%',
      background: '#228B22',
      borderRadius: '50% 20% 40% 30%',
      opacity: 0.8,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '40%',
      right: '15%',
      width: '25%',
      height: '35%',
      background: '#228B22',
      borderRadius: '30% 50% 20% 40%',
      opacity: 0.8,
    },
  },
  // Pilot seats
  leftSeat: {
    position: 'absolute',
    bottom: '0',
    left: '20%',
    width: '80px',
    height: '120px',
    background: 'linear-gradient(180deg, #333 0%, #1a1a1a 100%)',
    borderRadius: '20px 20px 5px 5px',
    border: '1px solid #444',
    transform: 'rotateX(10deg)',
  },
  rightSeat: {
    position: 'absolute',
    bottom: '0',
    right: '20%',
    width: '80px',
    height: '120px',
    background: 'linear-gradient(180deg, #333 0%, #1a1a1a 100%)',
    borderRadius: '20px 20px 5px 5px',
    border: '1px solid #444',
    transform: 'rotateX(10deg)',
  },
  // Stars in space
  stars: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'transparent',
  },
  star: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    animation: '$twinkle 4s infinite',
  },
  // Welcome text
  welcomeText: {
    textAlign: 'center',
    color: '#00ffff',
    textShadow: '0 0 10px rgba(0,255,255,0.5)',
    marginBottom: theme.spacing(1),
    zIndex: 10,
  },
  // Warp button
  warpButton: {
    position: 'absolute',
    bottom: '5%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: theme.spacing(1.5, 3),
    fontSize: '16px',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #ff6b00 30%, #ff9500 90%)',
    color: '#fff',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(255,107,0,0.5)',
    animation: '$warpGlow 3s ease-in-out infinite alternate',
    transition: 'all 0.3s ease',
    zIndex: 10,
    '&:hover': {
      transform: 'translateX(-50%) scale(1.05)',
      boxShadow: '0 0 30px rgba(255,107,0,0.8)',
    },
  },
  // Animations
  '@keyframes glow': {
    from: { backgroundColor: 'rgba(0,255,0,0.3)' },
    to: { backgroundColor: 'rgba(0,255,0,0.6)' },
  },
  '@keyframes rotate': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  '@keyframes twinkle': {
    '0%, 100%': { opacity: 0.3 },
    '50%': { opacity: 1 },
  },
  '@keyframes warpGlow': {
    from: { boxShadow: '0 0 20px rgba(255,107,0,0.5)' },
    to: { boxShadow: '0 0 30px rgba(255,107,0,0.8)' },
  },
}));

const AnimatedLanding = () => {
  const classes = useStyles();
  const history = useHistory();
  const [stars, setStars] = useState([]);

  // Generate random stars for the viewport
  useEffect(() => {
    const generateStars = () => {
      const starArray = [];
      for (let i = 0; i < 80; i++) {
        starArray.push({
          id: i,
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 4 + 's',
        });
      }
      setStars(starArray);
    };
    generateStars();
  }, []);

  const handleWarpClick = () => {
    history.push('/onboarding-1');
  };

  return (
    <Box className={classes.root}>
      <div className={classes.cockpitContainer}>
        <div className={classes.cockpitInterior}>
          
          {/* Left Control Panel */}
          <div className={classes.leftPanel}>
            <div className={classes.panelButton}></div>
            <div className={classes.panelButton}></div>
            <div className={classes.panelButton}></div>
            <div className={classes.panelButton}></div>
            <div className={classes.panelButton}></div>
          </div>

          {/* Right Control Panel */}
          <div className={classes.rightPanel}>
            <div className={classes.panelButton}></div>
            <div className={classes.panelButton}></div>
            <div className={classes.panelButton}></div>
            <div className={classes.panelButton}></div>
            <div className={classes.panelButton}></div>
          </div>

          {/* Main Viewport */}
          <div className={classes.viewport}>
            {/* Stars */}
            <div className={classes.stars}>
              {stars.map((star) => (
                <div
                  key={star.id}
                  className={classes.star}
                  style={{
                    left: star.left,
                    top: star.top,
                    animationDelay: star.animationDelay,
                  }}
                />
              ))}
            </div>
            
            {/* Earth */}
            <div className={classes.earth}></div>
            
            <Typography variant="h5" className={classes.welcomeText}>
              WELCOME ABOARD
            </Typography>
            <Typography variant="body1" className={classes.welcomeText}>
              Destination: The Future
            </Typography>
          </div>

          {/* Pilot Seats */}
          <div className={classes.leftSeat}></div>
          <div className={classes.rightSeat}></div>

          {/* Warp Button */}
          <Button
            className={classes.warpButton}
            onClick={handleWarpClick}
            variant="contained"
          >
            WARP TO THE FUTURE
          </Button>
        </div>
      </div>
    </Box>
  );
};

export default AnimatedLanding;