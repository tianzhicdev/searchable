import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const GalaxyMoving3D = ({ 
    height = '100vh',
    config = {
        particlesCount: 8000,
        galaxyRadius: 15,
        rotationSpeed: 0.001,
        wobbleSpeed: 0.0005,
        wobbleIntensity: 0.1,
        innerColor: '#ffaa00',
        outerColor: '#4444ff',
        backgroundColor: '#000814',
        cameraPosition: [0, 0, 10],
        branches: 3,
        spinAngle: 0.3,
        randomnessIntensity: 0.02,
        randomRadiusIntensity: 0.5,
        verticalSpread: 0.3,
        // New movement properties
        movementType: 'forward', // 'forward', 'banking', 'spiral', 'hyperspace'
        movementSpeed: 0.01,
        bankingAngle: 0.02,
        spiralRadius: 2,
        spiralSpeed: 0.005,
        hyperspaceStreaks: true
    }
}) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const galaxyRef = useRef(null);
    const cameraRef = useRef(null);
    const animationIdRef = useRef(null);
    const timeRef = useRef(0);

    useEffect(() => {
        if (!mountRef.current) return;

        const mountElement = mountRef.current;
        timeRef.current = 0;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            mountElement.clientWidth / mountElement.clientHeight,
            0.1,
            1000
        );
        camera.position.set(...config.cameraPosition);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
        renderer.setClearColor(config.backgroundColor, 1);
        rendererRef.current = renderer;
        mountElement.appendChild(renderer.domElement);

        // Create galaxy geometry
        const createGalaxy = () => {
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.PointsMaterial({
                size: config.hyperspaceStreaks ? 0.05 : 0.02,
                sizeAttenuation: true,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                transparent: true
            });

            const particlesCount = config.particlesCount;
            const positions = new Float32Array(particlesCount * 3);
            const colors = new Float32Array(particlesCount * 3);

            for (let i = 0; i < particlesCount; i++) {
                const i3 = i * 3;

                let x, y, z;

                if (config.movementType === 'forward') {
                    // Create tunnel effect - particles spread in all directions from camera view
                    const radius = Math.random() * config.galaxyRadius;
                    const angle = Math.random() * Math.PI * 2;
                    const depth = (Math.random() - 0.5) * 50; // Extend far back for tunnel effect
                    
                    x = Math.cos(angle) * radius;
                    y = Math.sin(angle) * radius;
                    z = depth;
                } else if (config.movementType === 'hyperspace') {
                    // Create streaking star field for hyperspace effect
                    const radius = Math.random() * config.galaxyRadius * 2;
                    const angle = Math.random() * Math.PI * 2;
                    const depth = (Math.random() - 0.5) * 100;
                    
                    x = Math.cos(angle) * radius;
                    y = Math.sin(angle) * radius;
                    z = depth;
                } else {
                    // Standard spiral galaxy pattern for other movement types
                    const radius = Math.random() * config.galaxyRadius;
                    const spinAngle = radius * config.spinAngle;
                    const branchAngle = ((i % config.branches) / config.branches) * Math.PI * 2;
                    
                    const randomAngle = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * config.randomnessIntensity * radius;
                    const angle = branchAngle + spinAngle + randomAngle;
                    
                    const randomRadius = Math.pow(Math.random(), 3) * config.randomRadiusIntensity * radius;
                    
                    x = Math.cos(angle) * (radius + randomRadius);
                    z = Math.sin(angle) * (radius + randomRadius);
                    y = (Math.random() - 0.5) * config.verticalSpread * radius;
                }

                positions[i3] = x;
                positions[i3 + 1] = y;
                positions[i3 + 2] = z;

                // Color calculation
                const distanceToCenter = Math.sqrt(x * x + y * y + z * z);
                const mixedColor = new THREE.Color();
                const innerColor = new THREE.Color(config.innerColor);
                const outerColor = new THREE.Color(config.outerColor);
                
                let colorMix = Math.min(distanceToCenter / config.galaxyRadius, 1);
                if (config.movementType === 'hyperspace') {
                    // Brighter colors for hyperspace effect
                    colorMix = Math.min(distanceToCenter / (config.galaxyRadius * 2), 1);
                }
                
                mixedColor.lerpColors(innerColor, outerColor, colorMix);

                colors[i3] = mixedColor.r;
                colors[i3 + 1] = mixedColor.g;
                colors[i3 + 2] = mixedColor.b;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const galaxy = new THREE.Points(geometry, material);
            galaxyRef.current = galaxy;
            scene.add(galaxy);
        };

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(config.innerColor, 1);
        pointLight.position.set(0, 0, 0);
        scene.add(pointLight);

        createGalaxy();

        // Animation loop with camera movement
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);
            timeRef.current += 0.016; // Approximate 60fps delta time

            if (galaxyRef.current) {
                // Galaxy rotation (reduced for moving effects)
                galaxyRef.current.rotation.y += config.rotationSpeed * 0.5;
                galaxyRef.current.rotation.x = Math.sin(timeRef.current * config.wobbleSpeed) * config.wobbleIntensity;
            }

            if (cameraRef.current) {
                // Camera movement based on movement type
                switch (config.movementType) {
                    case 'forward':
                        // Move forward through the tunnel
                        cameraRef.current.position.z -= config.movementSpeed;
                        if (cameraRef.current.position.z < -25) {
                            cameraRef.current.position.z = 10; // Reset for continuous effect
                        }
                        // Slight wobble for dynamic feel
                        cameraRef.current.position.x = Math.sin(timeRef.current * 0.5) * 0.5;
                        cameraRef.current.position.y = Math.cos(timeRef.current * 0.3) * 0.3;
                        break;

                    case 'banking':
                        // Banking turns left and right
                        const bankTime = timeRef.current * 0.3;
                        cameraRef.current.position.x = Math.sin(bankTime) * 5;
                        cameraRef.current.position.z = Math.cos(bankTime) * 3 + config.cameraPosition[2];
                        cameraRef.current.rotation.z = Math.sin(bankTime) * config.bankingAngle;
                        // Look ahead in the direction of movement
                        cameraRef.current.lookAt(Math.sin(bankTime + 0.5) * 5, 0, Math.cos(bankTime + 0.5) * 3);
                        break;

                    case 'spiral':
                        // Spiral movement around the galaxy
                        const spiralTime = timeRef.current * config.spiralSpeed;
                        cameraRef.current.position.x = Math.cos(spiralTime) * config.spiralRadius;
                        cameraRef.current.position.z = Math.sin(spiralTime) * config.spiralRadius + config.cameraPosition[2];
                        cameraRef.current.position.y = Math.sin(spiralTime * 2) * 2 + config.cameraPosition[1];
                        // Always look at the center
                        cameraRef.current.lookAt(0, 0, 0);
                        break;

                    case 'hyperspace':
                        // Hyperspace jump effect with rapid forward movement and shaking
                        cameraRef.current.position.z -= config.movementSpeed * 3;
                        if (cameraRef.current.position.z < -50) {
                            cameraRef.current.position.z = 20;
                        }
                        // Intense camera shake during hyperspace
                        cameraRef.current.position.x = (Math.random() - 0.5) * 0.2;
                        cameraRef.current.position.y = (Math.random() - 0.5) * 0.2;
                        cameraRef.current.rotation.z = (Math.random() - 0.5) * 0.1;
                        break;

                    default:
                        // No movement - static view
                        break;
                }
            }

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (mountElement && camera && renderer) {
                camera.aspect = mountElement.clientWidth / mountElement.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
            }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (mountElement && renderer.domElement) {
                mountElement.removeChild(renderer.domElement);
            }
            if (galaxyRef.current) {
                scene.remove(galaxyRef.current);
                galaxyRef.current.geometry.dispose();
                galaxyRef.current.material.dispose();
            }
            renderer.dispose();
        };
    }, [config]);

    return (
        <div
            ref={mountRef}
            style={{
                width: '100%',
                height,
                background: config.movementType === 'hyperspace' 
                    ? 'radial-gradient(ellipse at center, #001a3a 0%, #000510 100%)'
                    : 'radial-gradient(ellipse at center, #001a2e 0%, #000814 100%)'
            }}
        />
    );
};

export default GalaxyMoving3D;