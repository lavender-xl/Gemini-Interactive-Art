import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';
import { AppState, ColorTheme, GestureData } from './types';
import { HandTracker } from './components/HandTracker';

const App: React.FC = () => {
    const [started, setStarted] = useState(false);
    const [gestureMode, setGestureMode] = useState(false);
    const [treeState, setTreeState] = useState<AppState>(AppState.TREE);
    const [colorTheme, setColorTheme] = useState<ColorTheme>(ColorTheme.PINK);
    const [isMuted, setIsMuted] = useState(false);
    const [gestureData, setGestureData] = useState<GestureData>({
        isActive: false,
        x: 0.5,
        y: 0.5,
        isPinching: false,
        isThumbUp: false,
        fingerCount: 0,
        handSize: 1,
        handRotation: 0
    });

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
            if (!isMuted && started) {
                audioRef.current.play().catch(() => {
                    console.log("Audio play deferred until next interaction");
                });
            } else if (isMuted) {
                audioRef.current.pause();
            }
        }
    }, [isMuted, started]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!gestureMode || !gestureData.isActive) {
            if (!gestureMode && colorTheme !== ColorTheme.PINK) {
                setColorTheme(ColorTheme.PINK);
            }
            return;
        }

        if (gestureData.isPinching) {
            if (treeState !== AppState.TREE) setTreeState(AppState.TREE);
        } else {
            if (treeState !== AppState.EXPLODE) setTreeState(AppState.EXPLODE);
        }

        let targetTheme = ColorTheme.PINK;
        if (gestureData.fingerCount === 1) {
            targetTheme = ColorTheme.BLUE;
        } else if (gestureData.fingerCount >= 2) {
            targetTheme = ColorTheme.GOLD;
        } else if (gestureData.isThumbUp) {
            targetTheme = ColorTheme.PURPLE;
        }

        if (colorTheme !== targetTheme) {
            setColorTheme(targetTheme);
        }
    }, [gestureData, gestureMode, treeState, colorTheme]);

    const toggleState = useCallback(() => {
        setTreeState(prev => prev === AppState.TREE ? AppState.EXPLODE : AppState.TREE);
    }, []);

    const handleStart = (withGestures: boolean) => {
        if (!audioRef.current) {
            const audio = new Audio();
            audio.crossOrigin = "anonymous";
            audio.src = 'https://files.freemusicarchive.org/storage-free-music-archive-org/music/ccCommunity/Loyalty_Freak_Music/WITCHY_CHRISTMAS/Loyalty_Freak_Music_-_05_Last_Christmas_Instrumental.mp3';
            audio.loop = true;
            audio.volume = 0.4;
            audio.muted = isMuted;
            
            audioRef.current = audio;
            audio.load();
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Initial playback blocked, will retry on interaction:", error);
                });
            }
        }

        setStarted(true);
        setGestureMode(withGestures);
    };

    return (
        <div className="w-full h-screen relative bg-[#010001] overflow-hidden select-none">
            <Experience 
                appState={treeState} 
                colorTheme={colorTheme} 
                gestureData={gestureData}
                onCanvasClick={toggleState}
            />

            {!started && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-1000">
                    <div className="text-center p-8 max-w-lg w-full">
                        <h1 className="text-6xl md:text-8xl font-serif mb-20 italic tracking-tighter rainbow-glow-text">
                            Happy Holidays
                        </h1>
                        <div className="flex flex-col gap-6">
                            <button 
                                onClick={() => handleStart(false)}
                                className="py-5 border border-white/10 hover:border-pink-500/50 text-white/50 hover:text-white transition-all duration-700 rounded-full tracking-[0.4em] text-[11px] uppercase font-medium bg-white/5"
                            >
                                ENTER EXPERIENCE: MOUSE CONTROL
                            </button>
                            <button 
                                onClick={() => handleStart(true)}
                                className="py-5 bg-pink-600/10 border border-pink-500/30 hover:bg-pink-600/30 text-pink-100 font-semibold rounded-full transition-all duration-700 tracking-[0.3em] text-[11px] shadow-[0_0_50px_rgba(219,39,119,0.15)] uppercase"
                            >
                                START WITH MAGIC: GESTURE MODE
                            </button>
                        </div>
                        <div className="mt-24 flex justify-center gap-12 opacity-30 text-[9px] tracking-[0.5em] text-white uppercase font-bold">
                            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-current" /> Interactive Art</span>
                            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-current" /> Hand Tracking</span>
                        </div>
                    </div>
                </div>
            )}

            {started && (
                <>
                    <Overlay 
                        isMuted={isMuted}
                        setIsMuted={setIsMuted}
                        appState={treeState}
                        colorTheme={colorTheme}
                        gestureMode={gestureMode}
                        gestureData={gestureData}
                    />

                    {gestureMode && (
                        <div className="fixed bottom-10 right-10 w-48 h-36 rounded-3xl overflow-hidden border border-white/5 shadow-2xl z-40 bg-black/40 backdrop-blur-3xl">
                            <HandTracker onGesture={setGestureData} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default App;