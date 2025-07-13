import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const Galaxy3D = ({ 
    height = '100vh',
    config = {
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
    }
}) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const galaxyRef = useRef(null);
    const animationIdRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const mountElement = mountRef.current; // Store reference for cleanup

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
                size: 0.02,
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

                // Create spiral galaxy pattern
                const radius = Math.random() * config.galaxyRadius;
                const spinAngle = radius * config.spinAngle;
                const branchAngle = ((i % config.branches) / config.branches) * Math.PI * 2;
                
                const randomAngle = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * config.randomnessIntensity * radius;
                const angle = branchAngle + spinAngle + randomAngle;
                
                const randomRadius = Math.pow(Math.random(), 3) * config.randomRadiusIntensity * radius;
                
                // Position calculation
                const x = Math.cos(angle) * (radius + randomRadius);
                const z = Math.sin(angle) * (radius + randomRadius);
                const y = (Math.random() - 0.5) * config.verticalSpread * radius;

                positions[i3] = x;
                positions[i3 + 1] = y;
                positions[i3 + 2] = z;

                // Color calculation - closer to center = warmer colors
                const distanceToCenter = Math.sqrt(x * x + y * y + z * z);
                const mixedColor = new THREE.Color();
                const innerColor = new THREE.Color(config.innerColor);
                const outerColor = new THREE.Color(config.outerColor);
                
                mixedColor.lerpColors(innerColor, outerColor, Math.min(distanceToCenter / config.galaxyRadius, 1));

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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffaa00, 1);
        pointLight.position.set(0, 0, 0);
        scene.add(pointLight);

        createGalaxy();

        // Animation loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);

            if (galaxyRef.current) {
                galaxyRef.current.rotation.y += config.rotationSpeed; // Configurable rotation
                galaxyRef.current.rotation.x = Math.sin(Date.now() * config.wobbleSpeed) * config.wobbleIntensity; // Configurable wobble
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
    }, [config]); // Add config to dependencies

    return (
        <div
            ref={mountRef}
            style={{
                width: '100%',
                height,
                background: 'radial-gradient(ellipse at center, #001a2e 0%, #000814 100%)'
            }}
        />
    );
};

export default Galaxy3D;