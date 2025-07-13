// Galaxy configuration presets for different variations

export const galaxyConfigs = {
  // Original galaxy - warm orange to blue
  default: {
    particlesCount: 5000,
    galaxyRadius: 8,
    rotationSpeed: 0.001,
    wobbleSpeed: 0.0005,
    wobbleIntensity: 0.1,
    innerColor: '#ffaa00',
    outerColor: '#4444ff',
    backgroundColor: '#000814',
    cameraPosition: [0, 1, 8],
    branches: 3,
    spinAngle: 0.3,
    randomnessIntensity: 0.02,
    randomRadiusIntensity: 0.5,
    verticalSpread: 0.3
  },

  // Variation 1: Red Spiral Nebula
  variant1: {
    particlesCount: 7000,
    galaxyRadius: 10,
    rotationSpeed: 0.0015,
    wobbleSpeed: 0.001,
    wobbleIntensity: 0.15,
    innerColor: '#ff3366',
    outerColor: '#6633ff',
    backgroundColor: '#0a0015',
    cameraPosition: [0, 1, 10],
    branches: 4,
    spinAngle: 0.5,
    randomnessIntensity: 0.03,
    randomRadiusIntensity: 0.3,
    verticalSpread: 0.2
  },

  // Variation 2: Green Cosmic Web
  variant2: {
    particlesCount: 6000,
    galaxyRadius: 12,
    rotationSpeed: 0.0008,
    wobbleSpeed: 0.0003,
    wobbleIntensity: 0.05,
    innerColor: '#00ff88',
    outerColor: '#0088ff',
    backgroundColor: '#001122',
    cameraPosition: [0, 2, 12],
    branches: 5,
    spinAngle: 0.2,
    randomnessIntensity: 0.04,
    randomRadiusIntensity: 0.7,
    verticalSpread: 0.4
  },

  // Variation 3: Purple Void
  variant3: {
    particlesCount: 4000,
    galaxyRadius: 6,
    rotationSpeed: 0.002,
    wobbleSpeed: 0.0008,
    wobbleIntensity: 0.2,
    innerColor: '#ff00ff',
    outerColor: '#8800ff',
    backgroundColor: '#1a0022',
    cameraPosition: [0, 0.5, 8],
    branches: 2,
    spinAngle: 0.8,
    randomnessIntensity: 0.01,
    randomRadiusIntensity: 0.2,
    verticalSpread: 0.1
  },

  // Variation 4: Golden Storm
  variant4: {
    particlesCount: 8000,
    galaxyRadius: 7,
    rotationSpeed: 0.003,
    wobbleSpeed: 0.002,
    wobbleIntensity: 0.3,
    innerColor: '#ffdd00',
    outerColor: '#ff4400',
    backgroundColor: '#220a00',
    cameraPosition: [0, 1.5, 9],
    branches: 6,
    spinAngle: 0.4,
    randomnessIntensity: 0.05,
    randomRadiusIntensity: 0.8,
    verticalSpread: 0.5
  }
};

export default galaxyConfigs;