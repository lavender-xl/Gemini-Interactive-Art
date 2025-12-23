
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, extend } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
import { AppState, ColorTheme } from '../types';

class StarGeometry3D extends THREE.ExtrudeGeometry {
    constructor() {
        const shape = new THREE.Shape();
        const points = 5;
        const outerRadius = 1;
        const innerRadius = 0.45;
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        super(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
        this.center();
    }
}

extend({ StarGeometry3D });

export const Star: React.FC<{ position: [number, number, number], appState: AppState, colorTheme: ColorTheme }> = ({ position, appState, colorTheme }) => {
    const starRef = useRef<THREE.Mesh>(null!);
    const isTree = appState === AppState.TREE;

    const getThemeColors = () => {
        switch (colorTheme) {
            case ColorTheme.GOLD: return { main: "#FFD700", emissive: "#FFA500" };
            case ColorTheme.BLUE: return { main: "#00F0FF", emissive: "#0066FF" };
            case ColorTheme.PURPLE: return { main: "#BD00FF", emissive: "#6600FF" };
            default: return { main: "#FFFFFF", emissive: "#FFB6C1" };
        }
    };

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (starRef.current) {
            starRef.current.rotation.y = time * 2.2;
            const targetPos = isTree ? position[1] : 45;
            starRef.current.position.y = THREE.MathUtils.lerp(starRef.current.position.y, targetPos, 0.07);
            const targetScale = isTree ? 0.095 : 0;
            starRef.current.scale.setScalar(THREE.MathUtils.lerp(starRef.current.scale.x, targetScale, 0.12));
            
            const starMaterial = starRef.current.material as THREE.MeshStandardMaterial;
            const theme = getThemeColors();
            starMaterial.color.lerp(new THREE.Color(theme.main), 0.08);
            starMaterial.emissive.lerp(new THREE.Color(theme.emissive), 0.08);
        }
    });

    const theme = getThemeColors();
    return (
        <group position={[position[0], 0, position[2]]}>
            <Float speed={2.0} rotationIntensity={0.05} floatIntensity={0.05}>
                <mesh ref={starRef} position={[0, position[1], 0]}>
                    {/* @ts-ignore */}
                    <starGeometry3D />
                    <meshStandardMaterial emissiveIntensity={35} metalness={1} roughness={0} />
                    <pointLight intensity={15} distance={5} color={theme.main} />
                </mesh>
            </Float>
            {isTree && (
                <Sparkles count={8} scale={[0.15, 0.15, 0.15]} size={1.2} speed={3.5} color={theme.main} position={[0, position[1], 0]} />
            )}
        </group>
    );
};
