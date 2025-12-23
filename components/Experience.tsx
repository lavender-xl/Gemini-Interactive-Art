
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { InstancedTree } from './InstancedTree';
import { Star } from './Star';
import { AppState, ColorTheme, GestureData } from '../types';

interface ExperienceProps {
    appState: AppState;
    colorTheme: ColorTheme;
    gestureData: GestureData;
    onCanvasClick: () => void;
}

export const Experience: React.FC<ExperienceProps> = ({ appState, colorTheme, gestureData, onCanvasClick }) => {
    const isGold = colorTheme === ColorTheme.GOLD;
    const isBlue = colorTheme === ColorTheme.BLUE;
    const isPurple = colorTheme === ColorTheme.PURPLE;

    const getThemeColor = () => {
        if (isGold) return "#FFD700";
        if (isBlue) return "#00F0FF";
        if (isPurple) return "#BD00FF";
        return "#FFD1DC";
    };

    const getThemeSecondary = () => {
        if (isGold) return "#00FFFF";
        if (isBlue) return "#0066FF";
        if (isPurple) return "#6600FF";
        return "#FFB6C1";
    };

    return (
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, stencil: false, depth: true }} onClick={onCanvasClick}>
            <PerspectiveCamera makeDefault position={[0, 6, 22]} fov={35} />
            <color attach="background" args={['#050103']} />
            
            <Suspense fallback={null}>
                <Environment preset="city" environmentIntensity={0.01} />
                
                <group position={[0, -5, 0]}>
                    <InstancedTree appState={appState} colorTheme={colorTheme} gestureData={gestureData} />
                    <Star position={[0, 10.7, 0]} appState={appState} colorTheme={colorTheme} />
                    <ContactShadows 
                        opacity={0.3} 
                        scale={40} 
                        blur={4} 
                        far={15} 
                        resolution={512} 
                        color={isGold ? "#151000" : (isBlue ? "#000815" : (isPurple ? "#080015" : "#120002"))} 
                    />
                </group>

                {/* Lights */}
                <spotLight 
                    position={[10, 20, 10]} 
                    angle={0.15} 
                    penumbra={1} 
                    intensity={isGold ? 8 : (isBlue || isPurple ? 10 : 5)} 
                    castShadow 
                    color={getThemeColor()} 
                />
                <spotLight 
                    position={[-15, 10, -10]} 
                    angle={0.3} 
                    penumbra={1} 
                    intensity={isGold ? 4 : (isBlue || isPurple ? 6 : 2.5)} 
                    color={getThemeSecondary()} 
                />
                <pointLight position={[0, -1, 10]} intensity={3} color={getThemeColor()} />

                {/* Postprocessing */}
                <EffectComposer enableNormalPass={false}>
                    <Bloom 
                        luminanceThreshold={0.15} 
                        mipmapBlur 
                        intensity={isGold || isBlue || isPurple ? 1.8 : 1.3} 
                        radius={0.6} 
                    />
                    <Noise opacity={0.008} />
                    <Vignette eskil={false} offset={0.08} darkness={1.1} />
                </EffectComposer>
            </Suspense>

            <OrbitControls 
                enablePan={false} 
                enableZoom={false} 
                autoRotate={appState === AppState.TREE && !gestureData.isActive} 
                autoRotateSpeed={0.25} 
                makeDefault 
            />
        </Canvas>
    );
};
