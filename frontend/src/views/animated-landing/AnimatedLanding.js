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
  },
  spaceshipContainer: {
    width: '100%',
    height: '100vh',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceshipInterior: {
    width: '80%',
    maxWidth: '800px',
    height: '60%',
    maxHeight: '500px',
    position: 'relative',
    border: '3px solid #00ffff',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(0,20,40,0.9) 0%, rgba(0,10,30,0.9) 100%)',
    padding: theme.spacing(3),
    boxShadow: '0 0 50px rgba(0,255,255,0.3), inset 0 0 30px rgba(0,255,255,0.1)',
    animation: '$glow 3s ease-in-out infinite alternate',
  },
  '@keyframes glow': {
    from: {
      boxShadow: '0 0 50px rgba(0,255,255,0.3), inset 0 0 30px rgba(0,255,255,0.1)',
    },
    to: {
      boxShadow: '0 0 70px rgba(0,255,255,0.5), inset 0 0 40px rgba(0,255,255,0.2)',
    },
  },
  controlPanel: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    right: '20px',
    height: '80px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: '2px solid #00ff00',
    backgroundColor: 'rgba(0,255,0,0.2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#00ff00',
    animation: '$pulse 2s infinite',
    '&:hover': {
      backgroundColor: 'rgba(0,255,0,0.4)',
    },
  },
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(0,255,0,0.4)',
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(0,255,0,0)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(0,255,0,0)',
    },
  },
  warpButton: {
    position: 'absolute',
    bottom: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: theme.spacing(2, 4),
    fontSize: '18px',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #ff6b00 30%, #ff9500 90%)',
    color: '#fff',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    boxShadow: '0 0 30px rgba(255,107,0,0.5)',
    animation: '$warpGlow 2s ease-in-out infinite alternate',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateX(-50%) scale(1.1)',
      boxShadow: '0 0 50px rgba(255,107,0,0.8)',
    },
  },
  '@keyframes warpGlow': {
    from: {
      boxShadow: '0 0 30px rgba(255,107,0,0.5)',
    },
    to: {
      boxShadow: '0 0 50px rgba(255,107,0,0.8)',
    },
  },
  viewScreen: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60%',
    height: '40%',
    background: 'linear-gradient(180deg, #001122 0%, #003366 100%)',
    border: '2px solid #00ffff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  stars: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'transparent',
  },
  star: {
    position: 'absolute',
    width: '2px',
    height: '2px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    animation: '$twinkle 3s infinite',
  },
  '@keyframes twinkle': {
    '0%, 100%': { opacity: 0.3 },
    '50%': { opacity: 1 },
  },
  welcomeText: {
    textAlign: 'center',
    color: '#00ffff',
    textShadow: '0 0 10px rgba(0,255,255,0.5)',
    marginBottom: theme.spacing(2),
  },
}));

const AnimatedLanding = () => {
  const classes = useStyles();
  const history = useHistory();
  const [stars, setStars] = useState([]);

  // Generate random stars for the view screen
  useEffect(() => {
    const generateStars = () => {
      const starArray = [];
      for (let i = 0; i < 50; i++) {
        starArray.push({
          id: i,
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 3 + 's',
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
      <div className={classes.spaceshipContainer}>
        <div className={classes.spaceshipInterior}>
          {/* Control Panel */}
          <div className={classes.controlPanel}>
            <div className={classes.controlButton}>NAV</div>
            <div className={classes.controlButton}>SYS</div>
            <div className={classes.controlButton}>ENG</div>
            <div className={classes.controlButton}>COM</div>
          </div>

          {/* Main View Screen */}
          <div className={classes.viewScreen}>
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
            
            <Typography variant="h4" className={classes.welcomeText}>
              WELCOME ABOARD
            </Typography>
            <Typography variant="h6" className={classes.welcomeText}>
              Destination: The Future
            </Typography>
          </div>

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