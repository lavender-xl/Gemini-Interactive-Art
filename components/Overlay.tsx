
import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Hand, MousePointer2, Wand2, Fingerprint } from 'lucide-react';
import { AppState, ColorTheme, GestureData } from '../types';

interface OverlayProps {
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    appState: AppState;
    colorTheme: ColorTheme;
    gestureMode: boolean;
    gestureData: GestureData;
}

export const Overlay: React.FC<OverlayProps> = ({ isMuted, setIsMuted, appState, colorTheme, gestureMode, gestureData }) => {
    const [cursorPos, setCursorPos] = useState({ x: 0.5, y: 0.5 });
    const [showGreeting, setShowGreeting] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowGreeting(false), 4000);
        return () => clearTimeout(timer);
    }, []);

    const getThemeAccent = () => {
        switch (colorTheme) {
            case ColorTheme.GOLD: return 'text-yellow-400 border-yellow-400/20 shadow-yellow-500/10';
            case ColorTheme.BLUE: return 'text-blue-400 border-blue-400/20 shadow-blue-500/10';
            case ColorTheme.PURPLE: return 'text-purple-400 border-purple-400/20 shadow-purple-500/10';
            default: return 'text-pink-400 border-pink-400/20 shadow-pink-500/10';
        }
    };

    const getThemeName = () => {
        switch (colorTheme) {
            case ColorTheme.GOLD: return 'GOLDEN';
            case ColorTheme.BLUE: return 'AZURE';
            case ColorTheme.PURPLE: return 'ETHEREAL';
            default: return 'BLOSSOM';
        }
    };

    useEffect(() => {
        if (gestureData.isActive) {
            setCursorPos({ x: gestureData.x, y: gestureData.y });
        }
    }, [gestureData.x, gestureData.y, gestureData.isActive]);

    return (
        <>
            {/* Header Layout */}
            <div className="absolute top-0 left-0 w-full p-8 md:p-12 flex justify-between items-start pointer-events-none z-30">
                {/* Greeting on the Left */}
                <div className="transition-all duration-1000 transform" style={{ opacity: showGreeting ? 1 : 0.4, transform: showGreeting ? 'translateX(0)' : 'translateX(-10px)' }}>
                    <h2 className={`text-3xl md:text-5xl font-serif tracking-tighter italic ${getThemeAccent()}`}>
                        Happy Holidays!
                    </h2>
                    <div className="h-px w-16 bg-white/20 mt-4"></div>
                </div>
                
                {/* Controls on the Right */}
                <div className="flex flex-col items-end gap-4 pointer-events-auto">
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`
                            group relative p-4 md:p-5 bg-black/20 hover:bg-white/10 backdrop-blur-3xl rounded-full 
                            text-white/40 hover:text-white transition-all duration-500 border border-white/5 
                            shadow-2xl flex items-center justify-center overflow-hidden
                        `}
                    >
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-current ${getThemeAccent().split(' ')[0]}`} />
                        {isMuted ? <VolumeX size={20} strokeWidth={1.5} /> : <Volume2 size={20} strokeWidth={1.5} />}
                        <span className="absolute -bottom-10 group-hover:bottom-2 text-[6px] tracking-[0.3em] font-bold opacity-0 group-hover:opacity-40 transition-all duration-500 uppercase">
                            {isMuted ? 'Muted' : 'Playing'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Bottom Indicator */}
            <div className="absolute bottom-10 left-10 pointer-events-none z-30">
                <div className="flex items-center gap-6 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/5 shadow-2xl bg-black/30">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl text-white/80 border border-white/10 transition-transform ${gestureData.isPinching ? 'scale-90 opacity-50' : 'scale-100'}`}>
                        {gestureMode ? <Hand size={20} strokeWidth={1.5} /> : <MousePointer2 size={20} strokeWidth={1.5} />}
                    </div>
                    <div className="pr-4">
                        <p className={`text-[8px] tracking-[0.4em] mb-1 font-bold transition-colors duration-700 ${getThemeAccent().split(' ')[0]}`}>
                            {getThemeName()}
                        </p>
                        <p className="text-white text-xl font-serif italic tracking-wider leading-none">
                            {appState === AppState.TREE ? 'Christmas Tree' : 'Nebula'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Side Status Indicators */}
            {gestureMode && (
                <div className="absolute top-40 left-10 pointer-events-none z-30 flex flex-col gap-3">
                    <div className="bg-black/40 backdrop-blur-3xl px-6 py-4 rounded-3xl border border-white/5 flex items-center gap-4 transition-all duration-700">
                        <Wand2 size={14} className={`${getThemeAccent().split(' ')[0]} ${gestureData.isPinching ? 'animate-spin' : ''}`} />
                        <span className="text-white/60 text-[9px] tracking-[0.3em] font-medium">
                            {gestureData.isPinching ? 'GRIP' : 'SPREAD'}
                        </span>
                    </div>
                    <div className="bg-black/20 backdrop-blur-xl px-4 py-2 rounded-full border border-white/5 flex items-center gap-3">
                        <Fingerprint size={12} className={gestureData.fingerCount > 0 ? "text-white/80 animate-pulse" : "text-white/10"} />
                        <p className="text-[8px] text-white/40 tracking-[0.2em]">FINGERS: {gestureData.fingerCount}</p>
                    </div>
                </div>
            )}

            {/* Custom Interactive Cursor */}
            {gestureMode && gestureData.isActive && (
                <div 
                    className="fixed pointer-events-none z-50 flex items-center justify-center"
                    style={{ 
                        left: `${(1 - cursorPos.x) * 100}%`, 
                        top: `${cursorPos.y * 100}%`,
                        transition: 'left 0.25s cubic-bezier(0.1, 0, 0, 1), top 0.25s cubic-bezier(0.1, 0, 0, 1)'
                    }}
                >
                    <div className={`
                        relative w-8 h-8 flex items-center justify-center transition-all duration-700
                        ${gestureData.isPinching ? 'scale-50' : 'scale-100'}
                    `}>
                        <div className={`absolute inset-0 rounded-full border border-white/20 ${gestureData.isPinching ? 'scale-0' : 'scale-100 animate-ping opacity-20'}`} />
                        <div className={`w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,1)] transition-colors duration-700 ${getThemeAccent().split(' ')[0].replace('text-', 'bg-')}`} />
                    </div>
                </div>
            )}
        </>
    );
};
