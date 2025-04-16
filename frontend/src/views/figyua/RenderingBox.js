import React, { useRef, Suspense } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import config from '../../config';
// This is the actual 3D model component
function Model({ modelId, position, scale }) {
  const meshRef = useRef()
  const BASE_URL = config.API_SERVER;
  
  // First load the material file
  const materials = useLoader(MTLLoader, `${BASE_URL}mtl/${modelId}`, loader => {
    loader.setResourcePath(`${BASE_URL}png/${modelId}/`) // Sets base path for textures[2][5]
  })
  const obj = useLoader(OBJLoader, `${BASE_URL}obj/${modelId}`, (loader) => {
    materials.preload()
    loader.setMaterials(materials)
  })
  
  // Adjust rotation speed for individual canvases
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3 // Slightly slower rotation
    }
  })

  return (
    <primitive 
      ref={meshRef}
      object={obj} 
      position={position}
      scale={scale} 
    />
  )
}

// Simple placeholder to show while model is loading
function ModelPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="lightgray" />
    </mesh>
  )
}

// Main component that includes Suspense handling
function RenderingBox(props) {
  return (
    <Suspense fallback={<ModelPlaceholder />}>
      <Model 
        modelId={props.modelId} 
        position={props.position} 
        scale={props.scale} 
      />
    </Suspense>
  )
}

export default RenderingBox 