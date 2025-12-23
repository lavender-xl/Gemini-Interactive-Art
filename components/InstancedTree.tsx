
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AppState, ColorTheme, GestureData } from '../types';

const LEAF_COUNT = 10000;
const GLINT_COUNT = 1200;
const SPACE_STAR_COUNT = 600;
const ORBIT_PARTICLE_COUNT = 3000;

const tempObject = new THREE.Object3D();

export const InstancedTree: React.FC<{ appState: AppState, colorTheme: ColorTheme, gestureData: GestureData }> = ({ appState, colorTheme, gestureData }) => {
    const leafRef = useRef<THREE.InstancedMesh>(null!);
    const glintRef = useRef<THREE.InstancedMesh>(null!);
    const spaceStarsRef = useRef<THREE.InstancedMesh>(null!);
    const orbitRef = useRef<THREE.InstancedMesh>(null!);
    const rotationGroup = useRef<THREE.Group>(null!);

    const colors = useMemo(() => ({
        leaf: {
            PINK: new THREE.Color("#FFD1DC"),
            GOLD: new THREE.Color("#FFD700"),
            BLUE: new THREE.Color("#00F0FF"),
            PURPLE: new THREE.Color("#BD00FF")
        },
        emissive: {
            PINK: new THREE.Color("#FFB2D0"),
            GOLD: new THREE.Color("#FFA500"),
            BLUE: new THREE.Color("#0066FF"),
            PURPLE: new THREE.Color("#6600FF")
        }
    }), []);

    const data = useMemo(() => {
        // 1. Leaf targets (Tree shape vs Nebula)
        const leafTargets: THREE.Vector3[] = [];
        const leafRandoms: number[] = [];
        const explodeTargets: THREE.Vector3[] = [];
        
        for (let i = 0; i < LEAF_COUNT; i++) {
            // Tree conical mapping
            const height = Math.random() * 10;
            const radius = (1 - height / 10) * 4 * Math.pow(Math.random(), 0.6);
            const angle = Math.random() * Math.PI * 2;
            leafTargets.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            ));
            leafRandoms.push(Math.random());

            // Spherical explode mapping
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 18 + Math.random() * 25;
            explodeTargets.push(new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            ));
        }

        // 2. Glint targets (Glowy bits on tree)
        const glintTargets: THREE.Vector3[] = [];
        for (let i = 0; i < GLINT_COUNT; i++) {
            const h = Math.random() * 9.8;
            const r = (1 - h / 10) * 3.8 * Math.pow(Math.random(), 0.35);
            const a = Math.random() * Math.PI * 2;
            glintTargets.push(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r));
        }

        // 3. Orbit particles (Spirals)
        const orbitData = [];
        for (let i = 0; i < ORBIT_PARTICLE_COUNT; i++) {
            const t = i / ORBIT_PARTICLE_COUNT;
            orbitData.push({
                t,
                drift: (Math.random() - 0.5) * 0.25,
                gap: 1.8 + Math.random() * 0.5,
                twinkle: Math.random() * Math.PI * 2,
                offsetY: (Math.random() - 0.5) * 0.15
            });
        }

        // 4. Background stars
        const spaceStarPositions: THREE.Vector3[] = [];
        for (let i = 0; i < SPACE_STAR_COUNT; i++) {
            const r = 150 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            spaceStarPositions.push(new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            ));
        }

        return { leafTargets, leafRandoms, explodeTargets, glintTargets, orbitData, spaceStarPositions };
    }, []);

    const currentPositions = useMemo(() => {
        const arr = new Float32Array((LEAF_COUNT + ORBIT_PARTICLE_COUNT) * 3);
        for (let i = 0; i < LEAF_COUNT; i++) {
            arr[i * 3] = data.leafTargets[i].x;
            arr[i * 3 + 1] = data.leafTargets[i].y;
            arr[i * 3 + 2] = data.leafTargets[i].z;
        }
        return arr;
    }, [data]);

    useFrame((state, delta) => {
        const isTree = appState === AppState.TREE;
        const time = state.clock.getElapsedTime();

        // Scene rotation logic
        if (gestureData.isActive && !isTree) {
            const targetRY = ((1 - gestureData.x) - 0.5) * Math.PI * 3;
            rotationGroup.current.rotation.y = THREE.MathUtils.lerp(rotationGroup.current.rotation.y, targetRY, 0.05);
            rotationGroup.current.rotation.x = THREE.MathUtils.lerp(rotationGroup.current.rotation.x, (gestureData.y - 0.5) * 1.5, 0.05);
        } else {
            rotationGroup.current.rotation.y += delta * 0.15;
            rotationGroup.current.rotation.x = THREE.MathUtils.lerp(rotationGroup.current.rotation.x, 0, 0.05);
        }

        // Color transition
        const leafMat = leafRef.current.material as THREE.MeshStandardMaterial;
        const targetBaseColor = (colors.leaf as any)[colorTheme] || colors.leaf.PINK;
        const targetEmissiveColor = (colors.emissive as any)[colorTheme] || colors.emissive.PINK;
        leafMat.color.lerp(targetBaseColor, 0.05);
        leafMat.emissive.lerp(targetEmissiveColor, 0.05);

        const lerpSpeed = isTree ? 0.08 : 0.04;
        const targetScaleMultiplier = !isTree && gestureData.isActive ? Math.max(0.6, Math.min(2.0, gestureData.handSize)) : 1.0;

        // 1. Update Leaves
        for (let i = 0; i < LEAF_COUNT; i++) {
            const target = isTree ? data.leafTargets[i] : data.explodeTargets[i];
            const idx = i * 3;
            currentPositions[idx] = THREE.MathUtils.lerp(currentPositions[idx], target.x * targetScaleMultiplier, lerpSpeed);
            currentPositions[idx + 1] = THREE.MathUtils.lerp(currentPositions[idx + 1], target.y * targetScaleMultiplier, lerpSpeed);
            currentPositions[idx + 2] = THREE.MathUtils.lerp(currentPositions[idx + 2], target.z * targetScaleMultiplier, lerpSpeed);
            
            tempObject.position.set(currentPositions[idx], currentPositions[idx + 1], currentPositions[idx + 2]);
            const s = (0.008 + data.leafRandoms[i] * 0.01) * (isTree ? 1 : 1.5);
            tempObject.scale.setScalar(s);
            tempObject.updateMatrix();
            leafRef.current.setMatrixAt(i, tempObject.matrix);
        }
        leafRef.current.instanceMatrix.needsUpdate = true;

        // 2. Update Orbit (Spirals)
        const orbitPosStart = LEAF_COUNT * 3;
        for (let i = 0; i < ORBIT_PARTICLE_COUNT; i++) {
            const d = data.orbitData[i];
            const idx = orbitPosStart + i * 3;
            
            const h = d.t * 10.5;
            const baseR = (1 - h / 10) * 4;
            const radius = baseR + d.gap;
            const angle = d.t * Math.PI * 6 + time * 0.5 + d.drift;
            const treePos = new THREE.Vector3(Math.cos(angle) * radius, h - 0.5 + d.offsetY, Math.sin(angle) * radius);
            
            const explodeTarget = data.explodeTargets[i % LEAF_COUNT].clone().multiplyScalar(1.2);
            const target = isTree ? treePos : explodeTarget;

            currentPositions[idx] = THREE.MathUtils.lerp(currentPositions[idx] || 0, target.x * targetScaleMultiplier, lerpSpeed * 0.5);
            currentPositions[idx + 1] = THREE.MathUtils.lerp(currentPositions[idx + 1] || 0, target.y * targetScaleMultiplier, lerpSpeed * 0.5);
            currentPositions[idx + 2] = THREE.MathUtils.lerp(currentPositions[idx + 2] || 0, target.z * targetScaleMultiplier, lerpSpeed * 0.5);

            tempObject.position.set(currentPositions[idx], currentPositions[idx + 1], currentPositions[idx + 2]);
            const s = (0.012 + Math.sin(time * 4 + d.twinkle) * 0.005) * (isTree ? 1 : 1.8);
            tempObject.scale.setScalar(s);
            tempObject.updateMatrix();
            orbitRef.current.setMatrixAt(i, tempObject.matrix);
        }
        orbitRef.current.instanceMatrix.needsUpdate = true;

        // 3. Update Glints
        for (let i = 0; i < GLINT_COUNT; i++) {
            const target = isTree ? data.glintTargets[i] : data.explodeTargets[i % LEAF_COUNT];
            tempObject.position.set(target.x, target.y, target.z);
            const s = isTree ? (0.006 + Math.sin(time * 5 + i) * 0.006) : 0;
            tempObject.scale.setScalar(s);
            tempObject.updateMatrix();
            glintRef.current.setMatrixAt(i, tempObject.matrix);
        }
        glintRef.current.instanceMatrix.needsUpdate = true;

        // 4. Update Background Stars
        for (let i = 0; i < SPACE_STAR_COUNT; i++) {
            const pos = data.spaceStarPositions[i];
            tempObject.position.set(pos.x, pos.y, pos.z);
            tempObject.scale.setScalar(0.04 + Math.sin(time * 0.3 + i) * 0.04);
            tempObject.updateMatrix();
            spaceStarsRef.current.setMatrixAt(i, tempObject.matrix);
        }
        spaceStarsRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group ref={rotationGroup}>
            <instancedMesh ref={leafRef} args={[undefined, undefined, LEAF_COUNT]}>
                <octahedronGeometry args={[1, 0]} />
                <meshStandardMaterial metalness={0.9} roughness={0.1} emissiveIntensity={6} />
            </instancedMesh>
            
            <instancedMesh ref={glintRef} args={[undefined, undefined, GLINT_COUNT]}>
                {/* Fixed typo in icosahedronGeometry */}
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={20} />
            </instancedMesh>

            <instancedMesh ref={orbitRef} args={[undefined, undefined, ORBIT_PARTICLE_COUNT]}>
                <sphereGeometry args={[1, 5, 5]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
            </instancedMesh>

            <instancedMesh ref={spaceStarsRef} args={[undefined, undefined, SPACE_STAR_COUNT]}>
                <sphereGeometry args={[1, 4, 4]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.1} />
            </instancedMesh>
        </group>
    );
};
