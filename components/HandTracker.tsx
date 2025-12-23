
import React, { useRef, useEffect, useState } from 'react';
import { GestureData } from '../types';

export const HandTracker: React.FC<{ onGesture: (data: GestureData) => void }> = ({ onGesture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const landmarkRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const smoothPos = useRef({ x: 0.5, y: 0.5 });
    const smoothSize = useRef(1.0);

    useEffect(() => {
        let active = true;
        let requestRef: number;

        async function setupTracker() {
            try {
                const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304');
                const { HandLandmarker, FilesetResolver } = vision;
                
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
                );
                
                landmarkRef.current = await HandLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1,
                    minHandDetectionConfidence: 0.6,
                    minHandPresenceConfidence: 0.6,
                    minTrackingConfidence: 0.6
                });

                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
                    });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current?.play();
                            setIsReady(true);
                        };
                    }
                }

                const predict = () => {
                    if (!active) return;
                    if (videoRef.current && landmarkRef.current && videoRef.current.readyState >= 2) {
                        const startTimeMs = performance.now();
                        const results = landmarkRef.current.detectForVideo(videoRef.current, startTimeMs);
                        
                        if (results.landmarks && results.landmarks.length > 0) {
                            const hand = results.landmarks[0];
                            const wrist = hand[0];
                            const thumbTip = hand[4];
                            const indexTip = hand[8];
                            const indexMcp = hand[5];
                            const middleTip = hand[12];
                            const middleMcp = hand[9];
                            const ringTip = hand[16];
                            const ringMcp = hand[13];
                            const pinkyTip = hand[20];
                            const pinkyMcp = hand[17];

                            // Smoothing positions
                            smoothPos.current.x = smoothPos.current.x * 0.8 + indexTip.x * 0.2;
                            smoothPos.current.y = smoothPos.current.y * 0.8 + indexTip.y * 0.2;

                            const fingerTips = [indexTip, middleTip, ringTip, pinkyTip];
                            const avgDistToWrist = fingerTips.reduce((acc, tip) => {
                                return acc + Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
                            }, 0) / 4;

                            const isPinching = avgDistToWrist < 0.28;
                            const thumbDist = Math.sqrt(Math.pow(thumbTip.x - wrist.x, 2) + Math.pow(thumbTip.y - wrist.y, 2));
                            const wristToIndexMcp = Math.sqrt(Math.pow(indexMcp.x - wrist.x, 2) + Math.pow(indexMcp.y - wrist.y, 2));
                            const isThumbUp = thumbDist > wristToIndexMcp * 1.2;

                            const getExt = (tip: any, mcp: any) => {
                                const dTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
                                const dMcp = Math.sqrt(Math.pow(mcp.x - wrist.x, 2) + Math.pow(mcp.y - wrist.y, 2));
                                return dTip > dMcp * 1.15;
                            };

                            let extendedCount = 0;
                            if (getExt(indexTip, indexMcp)) extendedCount++;
                            if (getExt(middleTip, middleMcp)) extendedCount++;
                            if (getExt(ringTip, ringMcp)) extendedCount++;
                            if (getExt(pinkyTip, pinkyMcp)) extendedCount++;

                            const spread = Math.sqrt(Math.pow(thumbTip.x - pinkyTip.x, 2) + Math.pow(thumbTip.y - pinkyTip.y, 2));
                            smoothSize.current = smoothSize.current * 0.8 + (spread * 2.8) * 0.2;

                            onGesture({
                                isActive: true,
                                x: smoothPos.current.x,
                                y: smoothPos.current.y,
                                isPinching,
                                isThumbUp,
                                fingerCount: extendedCount,
                                handSize: smoothSize.current,
                                handRotation: smoothPos.current.x
                            });
                        } else {
                            onGesture({ isActive: false, x: 0.5, y: 0.5, isPinching: false, isThumbUp: false, fingerCount: 0, handSize: 1, handRotation: 0 });
                        }
                    }
                    requestRef = requestAnimationFrame(predict);
                };
                predict();
            } catch (err) {
                setError("Unable to access camera");
            }
        }
        setupTracker();
        return () => {
            active = false;
            cancelAnimationFrame(requestRef);
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onGesture]);

    return (
        <div className="relative w-full h-full bg-black/40">
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" muted playsInline />
            {!isReady && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/5 border-t-white/40 rounded-full animate-spin mb-3"></div>
                    <p className="text-[7px] text-white/30 tracking-[0.4em] uppercase">INITIALIZING SENSORS</p>
                </div>
            )}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <div className="w-1 h-1 bg-white/20 rounded-full animate-pulse"></div>
                <p className="text-[6px] text-white/20 tracking-[0.2em] font-medium">TRACKING MAGIC</p>
            </div>
        </div>
    );
};
