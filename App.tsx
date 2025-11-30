import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TopicSelector, TOPICS } from './components/TopicSelector';
import { AudioPlayer, AudioPlayerRef } from './components/AudioPlayer';
import { Quiz } from './components/Quiz';
import { SavedSessionsList } from './components/SavedSessionsList';
import { VocabularyTest } from './components/VocabularyTest';
import { generateScenario, generateAudio, generatePreviewAudio, generateLineAudio } from './services/geminiService';
import { saveSession, getSessionsByTopic, deleteSession, saveFavorite, removeFavorite, getFavorites, getSessionCounts } from './services/storageService';
import { ListeningScenario, TopicId, SavedSession, DifficultyLevel, VocabularyItem, UILanguage, GrammarPoint, UsefulPhrase, AppTheme } from './types';
import { t } from './services/translations';
import { decodeBase64, decodeAudioData } from './services/audioUtils';

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Theme Definitions with Gradient Backgrounds and Specific Text Colors for Visibility
const THEMES: Record<AppTheme, { 
    bg: string, 
    glass: string, 
    text: string, 
    accent: string, 
    border: string, 
    loadingColor: string,
    mmText: string,
    placeholder: string,
    inputBg: string,
    icon: string
}> = {
    sakura: { 
        bg: 'bg-gradient-to-br from-pink-200 via-red-100 to-pink-50', 
        glass: 'bg-white/40',
        text: 'text-stone-900', 
        accent: 'text-sakura-600', 
        border: 'border-white/50', 
        loadingColor: '#f43f5e',
        mmText: 'text-emerald-700',
        placeholder: 'placeholder-stone-500',
        inputBg: 'bg-white/50',
        icon: '🌸'
    },
    fuji: { 
        bg: 'bg-gradient-to-b from-blue-300 via-blue-100 to-white', 
        glass: 'bg-white/50',
        text: 'text-slate-900', 
        accent: 'text-blue-700', 
        border: 'border-white/50', 
        loadingColor: '#1d4ed8',
        mmText: 'text-emerald-700',
        placeholder: 'placeholder-slate-500',
        inputBg: 'bg-white/50',
        icon: '🗻'
    },
    jinjya: { 
        bg: 'bg-gradient-to-br from-red-800 to-stone-900', 
        glass: 'bg-stone-900/60',
        text: 'text-stone-100', 
        accent: 'text-red-400', 
        border: 'border-red-900/30', 
        loadingColor: '#ef4444',
        mmText: 'text-emerald-300',
        placeholder: 'placeholder-stone-400',
        inputBg: 'bg-stone-800/60',
        icon: '⛩️'
    },
    beach: { 
        bg: 'bg-gradient-to-b from-sky-300 to-cyan-200', 
        glass: 'bg-white/40',
        text: 'text-cyan-900', 
        accent: 'text-cyan-700', 
        border: 'border-white/40', 
        loadingColor: '#06b6d4',
        mmText: 'text-emerald-700',
        placeholder: 'placeholder-cyan-700',
        inputBg: 'bg-white/50',
        icon: '🏖️'
    },
    sky: { 
        bg: 'bg-gradient-to-tr from-sky-400 to-blue-200', 
        glass: 'bg-white/30',
        text: 'text-sky-950', 
        accent: 'text-sky-700', 
        border: 'border-white/40', 
        loadingColor: '#0ea5e9',
        mmText: 'text-emerald-800',
        placeholder: 'placeholder-sky-800',
        inputBg: 'bg-white/50',
        icon: '☁️'
    },
    forest: { 
        bg: 'bg-gradient-to-br from-emerald-800 to-green-900', 
        glass: 'bg-black/20',
        text: 'text-emerald-50', 
        accent: 'text-emerald-300', 
        border: 'border-emerald-500/20', 
        loadingColor: '#10b981',
        mmText: 'text-emerald-200',
        placeholder: 'placeholder-emerald-200/50',
        inputBg: 'bg-black/40',
        icon: '🌲'
    },
    magic: { 
        bg: 'bg-gradient-to-r from-violet-900 via-fuchsia-900 to-purple-900', 
        glass: 'bg-black/30',
        text: 'text-fuchsia-100', 
        accent: 'text-fuchsia-300', 
        border: 'border-fuchsia-500/30', 
        loadingColor: '#c026d3',
        mmText: 'text-emerald-300',
        placeholder: 'placeholder-fuchsia-300/50',
        inputBg: 'bg-black/40',
        icon: '🪄'
    },
    night: { 
        bg: 'bg-slate-950', 
        glass: 'bg-slate-900/50',
        text: 'text-slate-200', 
        accent: 'text-indigo-300', 
        border: 'border-indigo-500/20', 
        loadingColor: '#6366f1',
        mmText: 'text-emerald-300',
        placeholder: 'placeholder-slate-400',
        inputBg: 'bg-slate-800/60',
        icon: '🌙'
    },
    anime: { 
        bg: 'bg-gradient-to-tr from-orange-400 to-yellow-300', 
        glass: 'bg-white/50',
        text: 'text-orange-950', 
        accent: 'text-orange-700', 
        border: 'border-white/50', 
        loadingColor: '#ea580c',
        mmText: 'text-emerald-800',
        placeholder: 'placeholder-orange-800',
        inputBg: 'bg-white/60',
        icon: '💢'
    },
    demon_slayer: { 
        bg: 'bg-stone-900', 
        glass: 'bg-black/60',
        text: 'text-emerald-100', 
        accent: 'text-emerald-400', 
        border: 'border-green-500/30', 
        loadingColor: '#10b981',
        mmText: 'text-emerald-300',
        placeholder: 'placeholder-emerald-500',
        inputBg: 'bg-black/50',
        icon: '👹'
    },
    love: { 
        bg: 'bg-gradient-to-br from-rose-300 to-pink-200', 
        glass: 'bg-white/40',
        text: 'text-rose-950', 
        accent: 'text-rose-600', 
        border: 'border-white/50', 
        loadingColor: '#e11d48',
        mmText: 'text-emerald-700',
        placeholder: 'placeholder-rose-800',
        inputBg: 'bg-white/50',
        icon: '💗'
    },
    rain: { 
        bg: 'bg-gradient-to-b from-slate-700 to-slate-900', 
        glass: 'bg-slate-900/60',
        text: 'text-blue-100', 
        accent: 'text-blue-400', 
        border: 'border-blue-500/20', 
        loadingColor: '#60a5fa',
        mmText: 'text-emerald-300',
        placeholder: 'placeholder-blue-200/50',
        inputBg: 'bg-slate-800/50',
        icon: '🌧️'
    },
    three_d: {
        bg: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
        glass: 'bg-white/20 shadow-2xl backdrop-blur-xl',
        text: 'text-white drop-shadow-md',
        accent: 'text-cyan-300',
        border: 'border-white/30 border-b-4', 
        loadingColor: '#6366f1',
        mmText: 'text-cyan-200',
        placeholder: 'placeholder-white/50',
        inputBg: 'bg-white/20',
        icon: '🧊'
    },
    fire: {
        bg: 'bg-gradient-to-t from-red-900 via-orange-800 to-stone-900',
        glass: 'bg-black/40',
        text: 'text-orange-100',
        accent: 'text-orange-500',
        border: 'border-orange-500/30',
        loadingColor: '#f97316',
        mmText: 'text-yellow-300',
        placeholder: 'placeholder-orange-300/50',
        inputBg: 'bg-black/50',
        icon: '🔥'
    },
    hanabi: {
        bg: 'bg-slate-900',
        glass: 'bg-slate-800/70',
        text: 'text-pink-200',
        accent: 'text-yellow-300',
        border: 'border-pink-500/30',
        loadingColor: '#ec4899',
        mmText: 'text-emerald-300',
        placeholder: 'placeholder-pink-400/50',
        inputBg: 'bg-slate-800/50',
        icon: '🎆'
    },
    winter: {
        bg: 'bg-gradient-to-b from-slate-300 via-blue-100 to-white',
        glass: 'bg-white/50',
        text: 'text-slate-800',
        accent: 'text-blue-600',
        border: 'border-white/60',
        loadingColor: '#3b82f6',
        mmText: 'text-emerald-700',
        placeholder: 'placeholder-blue-300',
        inputBg: 'bg-white/60',
        icon: '❄️'
    },
    one_piece: {
        bg: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
        glass: 'bg-white/40',
        text: 'text-white',
        accent: 'text-yellow-300',
        border: 'border-white/40',
        loadingColor: '#fbbf24',
        mmText: 'text-emerald-100',
        placeholder: 'placeholder-blue-200',
        inputBg: 'bg-blue-900/30',
        icon: '👒'
    },
    galaxy: {
        bg: 'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900',
        glass: 'bg-black/50',
        text: 'text-purple-100',
        accent: 'text-purple-300',
        border: 'border-purple-500/30',
        loadingColor: '#d8b4fe',
        mmText: 'text-cyan-300',
        placeholder: 'placeholder-purple-400/50',
        inputBg: 'bg-black/60',
        icon: '🌌'
    }
};

// Component to handle Background Animations
const BackgroundEffects = ({ theme }: { theme: AppTheme }) => {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Sakura Falling */}
            {theme === 'sakura' && (
                <>
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className="absolute text-sakura-300 animate-petal-fall" 
                             style={{
                                 left: `${Math.random() * 100}%`,
                                 animationDuration: `${10 + Math.random() * 10}s`,
                                 animationDelay: `${Math.random() * 5}s`,
                                 fontSize: `${10 + Math.random() * 20}px`
                             }}>❀</div>
                    ))}
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="absolute text-sakura-400 animate-petal-fall" 
                             style={{
                                 left: `${Math.random() * 100}%`,
                                 animationDuration: `${12 + Math.random() * 8}s`,
                                 animationDelay: `${Math.random() * 5}s`,
                                 fontSize: `${8 + Math.random() * 15}px`
                             }}>🌸</div>
                    ))}
                </>
            )}

            {/* Rain */}
            {(theme === 'rain' || theme === 'jinjya') && (
                 <>
                    <div className={`absolute inset-0 ${theme === 'rain' ? 'bg-slate-900/20' : ''}`}></div>
                    {[...Array(40)].map((_, i) => (
                        <div key={i} className="absolute w-[1px] bg-blue-200/50 animate-rain-drop"
                             style={{
                                 height: `${Math.random() * 20 + 10}vh`,
                                 left: `${Math.random() * 100}%`,
                                 animationDuration: `${0.5 + Math.random() * 0.5}s`,
                                 animationDelay: `${Math.random()}s`
                             }}></div>
                    ))}
                 </>
            )}

            {/* Forest Leaves */}
            {theme === 'forest' && (
                [...Array(15)].map((_, i) => (
                    <div key={i} className="absolute text-emerald-300/30 animate-leaf-fall" 
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDuration: `${8 + Math.random() * 10}s`,
                                animationDelay: `${Math.random() * 5}s`,
                                fontSize: `${12 + Math.random() * 15}px`
                            }}>🍃</div>
                ))
            )}

            {/* Clouds */}
            {(theme === 'sky' || theme === 'beach' || theme === 'fuji') && (
                <>
                    <div className="absolute top-[10%] left-[-20%] text-white/40 animate-cloud-move" style={{fontSize: '100px', animationDuration: '40s'}}>☁</div>
                    <div className="absolute top-[30%] left-[-10%] text-white/30 animate-cloud-move" style={{fontSize: '80px', animationDuration: '35s', animationDelay: '5s'}}>☁</div>
                    <div className="absolute top-[5%] left-[-15%] text-white/20 animate-cloud-move" style={{fontSize: '120px', animationDuration: '50s', animationDelay: '10s'}}>☁</div>
                </>
            )}

            {/* Night Stars */}
            {(theme === 'night' || theme === 'magic' || theme === 'demon_slayer' || theme === 'hanabi' || theme === 'galaxy') && (
                [...Array(theme === 'galaxy' ? 60 : 30)].map((_, i) => (
                    <div key={i} className="absolute bg-white rounded-full animate-twinkle" 
                            style={{
                                width: `${Math.random() * (theme === 'galaxy' ? 4 : 3)}px`,
                                height: `${Math.random() * (theme === 'galaxy' ? 4 : 3)}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                opacity: Math.random()
                            }}></div>
                ))
            )}

            {/* Magic Sparkles */}
            {theme === 'magic' && (
                 [...Array(20)].map((_, i) => (
                    <div key={i} className="absolute text-yellow-200 animate-twinkle" 
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDuration: '2s',
                                animationDelay: `${Math.random() * 2}s`,
                                fontSize: '10px'
                            }}>✨</div>
                ))
            )}

            {/* Love Hearts */}
            {theme === 'love' && (
                [...Array(20)].map((_, i) => (
                    <div key={i} className="absolute text-rose-400/60 animate-heart-fall" 
                         style={{
                             left: `${Math.random() * 100}%`,
                             animationDuration: `${6 + Math.random() * 8}s`,
                             animationDelay: `${Math.random() * 5}s`,
                             fontSize: `${12 + Math.random() * 24}px`
                         }}>♥</div>
                ))
            )}
            
            {/* Demon Slayer Pattern Overlay */}
            {theme === 'demon_slayer' && (
                <div className="absolute inset-0 demon-slayer-pattern pointer-events-none"></div>
            )}

             {/* 3D Elements */}
             {theme === 'three_d' && (
                <>
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 border-4 border-white/20 animate-rotate-3d opacity-30"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border-4 border-cyan-400/20 animate-rotate-3d opacity-20" style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 border-2 border-purple-400/20 rounded-full animate-pulse opacity-20 transform -translate-x-1/2 -translate-y-1/2"></div>
                </>
            )}

            {/* Fire Particles (Sparks) */}
            {theme === 'fire' && (
                [...Array(40)].map((_, i) => (
                    <div key={i} className="absolute rounded-full bg-orange-500 blur-[1px] animate-rise"
                         style={{
                             width: `${Math.random() * 6 + 2}px`,
                             height: `${Math.random() * 6 + 2}px`,
                             left: `${Math.random() * 100}%`,
                             bottom: '-10px',
                             animationDuration: `${1 + Math.random() * 3}s`,
                             animationDelay: `${Math.random() * 2}s`,
                             opacity: Math.random()
                         }}></div>
                ))
            )}

            {/* Hanabi Fireworks */}
            {theme === 'hanabi' && (
                [...Array(6)].map((_, i) => (
                    <div key={i} className="absolute animate-firework rounded-full opacity-0"
                         style={{
                             left: `${20 + Math.random() * 60}%`,
                             top: `${20 + Math.random() * 40}%`,
                             width: '10px',
                             height: '10px',
                             boxShadow: `0 0 0 4px ${['#ef4444', '#eab308', '#3b82f6', '#ec4899'][Math.floor(Math.random()*4)]}, 0 0 20px 10px ${['#ef4444', '#eab308', '#3b82f6', '#ec4899'][Math.floor(Math.random()*4)]}`,
                             animationDuration: `${2 + Math.random()}s`,
                             animationDelay: `${Math.random() * 3}s`
                         }}></div>
                ))
            )}

            {/* Winter Snow */}
            {theme === 'winter' && (
                 [...Array(50)].map((_, i) => (
                    <div key={i} className="absolute rounded-full bg-white animate-snow-fall opacity-60"
                         style={{
                             width: `${Math.random() * 5 + 2}px`,
                             height: `${Math.random() * 5 + 2}px`,
                             left: `${Math.random() * 100}%`,
                             animationDuration: `${5 + Math.random() * 10}s`,
                             animationDelay: `${Math.random() * 5}s`
                         }}></div>
                ))
            )}

            {/* One Piece - Ocean Waves and Jolly Roger feel */}
            {theme === 'one_piece' && (
                 <>
                    {/* Ocean waves effect using multiple wave layers if possible, simplified here to moving cloud-like shapes but at bottom */}
                     <div className="absolute bottom-[-10%] left-[-20%] w-[140%] h-[40%] bg-blue-500/30 rounded-[100%] animate-wave opacity-50 blur-xl"></div>
                     <div className="absolute bottom-[-15%] left-[-10%] w-[140%] h-[40%] bg-blue-400/20 rounded-[100%] animate-wave opacity-40 blur-lg" style={{animationDuration: '12s'}}></div>
                     
                     {/* Floating Jolly Roger / Hat motif abstract */}
                     <div className="absolute top-20 right-20 text-4xl animate-pirate-sway opacity-30">👒</div>
                     <div className="absolute bottom-20 left-10 text-4xl animate-pirate-sway opacity-20" style={{animationDelay: '1s'}}>⚓</div>
                 </>
            )}

            {/* Galaxy - Spiral */}
            {theme === 'galaxy' && (
                <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 rounded-full blur-3xl animate-spin-slow transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            )}
        </div>
    );
};

// Loading Component with Timer
const LoadingScene = ({ progress, step, theme, language }: { progress: number; step: string; theme: AppTheme, language: UILanguage }) => {
  const themeConfig = THEMES[theme];
  // Estimate time set to 225s
  const [timeLeft, setTimeLeft] = useState(225);

  useEffect(() => {
    // Reset timer when progress is low (start of new gen)
    if (progress < 20) setTimeLeft(225);

    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [progress]);
  
  const renderIcon = () => {
      switch(theme) {
          case 'demon_slayer':
              return (
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-24 h-24 text-stone-200 animate-slash absolute">
                         <path d="M10,90 L90,10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                         <path d="M15,95 L5,85" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /> {/* Handle */}
                    </svg>
                    <div className="text-4xl animate-pulse text-red-500 font-bold z-10">全集中</div>
                </div>
              );
          case 'jinjya':
              return (
                  <div className="relative w-32 h-32 flex items-center justify-center">
                      {/* Torii Gate Static */}
                      <svg viewBox="0 0 100 100" className="w-28 h-28 absolute text-red-700 opacity-50">
                          <path d="M20,90 V30 H80 V90 M10,30 H90 M15,20 H85" stroke="currentColor" strokeWidth="5" fill="none"/>
                      </svg>
                      {/* Cat Bouncing */}
                      <div className="text-4xl animate-bounce-gentle z-10">🐱</div>
                  </div>
              );
          case 'sakura':
              return (
                <div className="w-32 h-32 flex items-center justify-center">
                    <div className="text-6xl animate-[spin_4s_linear_infinite]">🌸</div>
                </div>
              );
          case 'love':
              return (
                  <div className="w-32 h-32 flex items-center justify-center">
                      <div className="text-6xl text-rose-500 animate-pulse-fast">💗</div>
                  </div>
              );
          case 'rain':
              return (
                  <div className="w-32 h-32 flex items-center justify-center relative">
                      <div className="text-6xl animate-bounce">🌧️</div>
                  </div>
              );
          case 'fuji':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-bounce-gentle">🗻</div>
                </div>
              );
          case 'beach':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-pulse-fast">🏖️</div>
                </div>
              );
          case 'sky':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-float">☁️</div>
                </div>
              );
          case 'forest':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-bounce-gentle">🌲</div>
                </div>
              );
          case 'magic':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-spin">🪄</div>
                </div>
              );
          case 'night':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-pulse">🌙</div>
                </div>
              );
          case 'anime':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-bounce">💢</div>
                </div>
              );
          case 'three_d':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-rotate-3d">🧊</div>
                </div>
              );
          case 'fire':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-pulse text-orange-500 filter drop-shadow-[0_0_10px_rgba(255,165,0,0.8)]">🔥</div>
                </div>
              );
          case 'hanabi':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-ping text-pink-500">🎆</div>
                </div>
              );
          case 'winter':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                    <div className="text-6xl animate-bounce-gentle text-blue-400">⛄</div>
                </div>
              );
          case 'one_piece':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                     <div className="text-6xl animate-pirate-sway">🏴‍☠️</div>
                </div>
              );
          case 'galaxy':
              return (
                <div className="w-32 h-32 flex items-center justify-center relative">
                     <div className="text-6xl animate-spin-slow">🌌</div>
                </div>
              );
          default:
              return (
                <div className="w-32 h-32 mb-6 relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="60" r="30" fill="none" stroke="currentColor" strokeWidth="2" className={themeConfig.text} />
                        <circle cx="50" cy="60" r="25" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className={`${themeConfig.text} opacity-50 animate-[spin_4s_linear_infinite]`} />
                        <circle cx="40" cy="55" r="2" fill="currentColor" className={themeConfig.text} />
                        <circle cx="60" cy="55" r="2" fill="currentColor" className={themeConfig.text} />
                        <path d="M45,60 Q50,65 55,60" fill="none" stroke="currentColor" strokeWidth="1" className={themeConfig.text} />
                    </svg>
                </div>
              );
      }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-10 animate-fade-in w-full max-w-md mx-auto relative overflow-hidden p-8 rounded-3xl border ${themeConfig.border} ${themeConfig.glass} shadow-xl backdrop-blur-md`}>
       {renderIcon()}

       <h2 className={`text-2xl font-bold mb-2 font-mono ${themeConfig.text}`}>Loading...</h2>
       <p className={`animate-pulse mb-6 text-center font-medium h-6 ${themeConfig.text} opacity-70`}>{step}</p>
       
       <div className={`w-full rounded-full h-4 overflow-hidden shadow-inner border ${themeConfig.border} bg-white/20 mb-4`}>
          <div 
              className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${progress}%`, backgroundColor: themeConfig.loadingColor }}
          >
              <span className="text-[10px] text-white font-bold">{progress}%</span>
          </div>
       </div>

       <div className={`text-sm font-medium ${themeConfig.text} opacity-80 flex flex-col items-center`}>
            <span>{t('estimated_time', language)}: {timeLeft > 0 ? timeLeft : 0} {t('seconds', language)}</span>
            {timeLeft === 0 && <span className="text-xs opacity-60 mt-1">{t('calculating', language)}</span>}
       </div>
    </div>
  );
};

// Reusable Example Audio Button
const ExampleAudioButton = ({ text, speaker, theme, textClass }: { text: string; speaker?: string; theme: AppTheme; textClass: string }) => {
  const [loading, setLoading] = useState(false);
  const audioCache = useRef<Record<string, string>>({});
  
  const playAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    
    // Check if audio exists in cache
    const cacheKey = `${text}_${speaker}`;
    
    try {
        setLoading(true);
        let base64 = audioCache.current[cacheKey];
        
        if (!base64) {
            // Generate
            base64 = await generateLineAudio(text, speaker || 'Narrator');
            audioCache.current[cacheKey] = base64;
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const bytes = decodeBase64(base64);
        const buffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
        
    } catch (err) {
        console.error("Failed to play example:", err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <button 
      onClick={playAudio}
      disabled={loading}
      className={`ml-2 p-1.5 rounded-full transition-all hover:bg-white/20 active:scale-95 ${textClass} ${loading ? 'opacity-50 cursor-wait' : 'opacity-70 hover:opacity-100'}`}
      title="Listen"
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      )}
    </button>
  );
};


export function App() {
  const [currentView, setCurrentView] = useState<'topic' | 'detail' | 'loading' | 'exercise' | 'test' | 'favorites'>('topic');
  const [previousView, setPreviousView] = useState<'topic' | 'detail' | 'loading' | 'exercise' | 'test'>('topic');
  
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  const [selectedTopicId, setSelectedTopicId] = useState<TopicId | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [currentSession, setCurrentSession] = useState<SavedSession | null>(null);
  const [favoriteWords, setFavoriteWords] = useState<Set<string>>(new Set());
  const [favoritesList, setFavoritesList] = useState<VocabularyItem[]>([]);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  
  const [scenario, setScenario] = useState<ListeningScenario | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  
  // Audio Sync State
  const [totalAudioDuration, setTotalAudioDuration] = useState<number>(0);
  const [highlightedLineIndex, setHighlightedLineIndex] = useState<number | null>(null);

  // Subtitle/Translation visibility states
  const [showJapanese, setShowJapanese] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showMyanmar, setShowMyanmar] = useState(false);

  // Section Translation Toggles
  const [showVocabEN, setShowVocabEN] = useState(true);
  const [showVocabMM, setShowVocabMM] = useState(true);
  const [showVocabFurigana, setShowVocabFurigana] = useState(true);

  const [showGrammarEN, setShowGrammarEN] = useState(true);
  const [showGrammarMM, setShowGrammarMM] = useState(true);
  const [showGrammarFurigana, setShowGrammarFurigana] = useState(true);

  const [showPhrasesEN, setShowPhrasesEN] = useState(true);
  const [showPhrasesMM, setShowPhrasesMM] = useState(true);
  const [showPhrasesFurigana, setShowPhrasesFurigana] = useState(true);

  // Favorites Toggles
  const [showFavoritesFurigana, setShowFavoritesFurigana] = useState(true);

  // UI Language & Theme
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('en');
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
        return (localStorage.getItem('appTheme') as AppTheme) || 'sakura';
    }
    return 'sakura';
  });
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  
  // Audio Preview Cache & Context
  const previewAudioCache = useRef<Record<string, string>>({});
  const previewAudioContextRef = useRef<AudioContext | null>(null);
  
  // Ref for Audio Player Control
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('appTheme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    loadFavorites();
    loadSessionCounts();
  }, []);

  const loadFavorites = () => {
    getFavorites().then(items => {
        setFavoritesList(items);
        const words = new Set(items.map(i => i.word));
        setFavoriteWords(words);
    });
  };

  const loadSessionCounts = () => {
    getSessionCounts().then(setSessionCounts);
  };

  const toggleLanguage = () => {
      setUiLanguage(prev => {
          if (prev === 'en') return 'jp';
          if (prev === 'jp') return 'mm';
          return 'en';
      });
  };

  const handleTopicClick = async (topicId: TopicId) => {
    setSelectedTopicId(topicId);
    try {
        const sessions = await getSessionsByTopic(topicId);
        setSavedSessions(sessions);
        setCurrentView('detail');
    } catch (e) {
        console.error("Failed to load sessions", e);
        setCurrentView('detail');
    }
  };

  const handlePlaySaved = (session: SavedSession) => {
      setCurrentSession(session);
      setScenario(session.scenario);
      setAudioData(session.audioData);
      
      setShowJapanese(false);
      setShowFurigana(true);
      setShowEnglish(false);
      setShowMyanmar(false);
      
      // Reset Section Toggles
      setShowVocabFurigana(true);
      setShowGrammarFurigana(true);
      setShowPhrasesFurigana(true);

      setHighlightedLineIndex(null);
      setTotalAudioDuration(0);

      setCurrentView('exercise');
  };

  const handleVoicePreview = async (voiceName: string) => {
    try {
        let base64Audio = previewAudioCache.current[voiceName];
        if (!base64Audio) {
            base64Audio = await generatePreviewAudio(voiceName);
            previewAudioCache.current[voiceName] = base64Audio;
        }
        
        // Use Web Audio API to play raw PCM
        if (!previewAudioContextRef.current) {
            previewAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = previewAudioContextRef.current;
        
        // Resume if suspended (browser policy)
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const bytes = decodeBase64(base64Audio);
        const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);

    } catch (error) {
        console.error("Failed to preview voice:", error);
    }
  };

  const handleGenerateNew = async (level: DifficultyLevel, customPrompt?: string, voiceMap?: {A: string, B: string, C: string, Narrator: string}, numSpeakers: number = 2) => {
    if (!selectedTopicId) return;
    
    setCurrentView('loading');
    setLoadingProgress(0);
    setScenario(null);
    setAudioData(null);
    setCurrentSession(null);
    setHighlightedLineIndex(null);
    setTotalAudioDuration(0);

    try {
      const topicName = customPrompt ? 'Custom Scenario' : (TOPICS.find(t => t.id === selectedTopicId)?.label || 'Scenario');
      setLoadingStep(`Generating ${topicName} (${level})...`);
      setLoadingProgress(10);
      const newScenario = await generateScenario(selectedTopicId, level, customPrompt, numSpeakers);
      if (!newScenario.id) {
          newScenario.id = generateId();
      }
      setScenario(newScenario);
      setLoadingProgress(40);

      setLoadingStep('Synthesizing native-level audio...');
      // Pass the voice selection here
      const newAudio = await generateAudio(newScenario, voiceMap);
      setAudioData(newAudio);
      setLoadingProgress(90);

      setLoadingStep('Saving to library...');
      const sessionToSave: SavedSession = {
          id: newScenario.id || generateId(),
          topicId: selectedTopicId,
          scenario: newScenario,
          audioData: newAudio,
          createdAt: Date.now(),
          lineAudioCache: {}
      };
      
      await saveSession(sessionToSave);
      setCurrentSession(sessionToSave);
      loadSessionCounts(); // Refresh counts
      setLoadingProgress(100);
      setCurrentView('exercise');
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || 'Unknown error';
      alert(`Failed to generate content: ${msg}. Please try again.`);
      setCurrentView('detail');
    }
  };

  const handleDeleteSession = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this downloaded practice?")) {
          await deleteSession(id);
          loadSessionCounts(); // Refresh counts
          if (selectedTopicId) {
             const updated = await getSessionsByTopic(selectedTopicId);
             setSavedSessions(updated);
          }
      }
  };

  const toggleFavorite = async (item: VocabularyItem | GrammarPoint | UsefulPhrase, type: 'vocab' | 'grammar' | 'phrase') => {
      let favoriteItem: VocabularyItem;
      let key: string;

      if (type === 'vocab') {
          favoriteItem = { ...(item as VocabularyItem), type: 'vocab' };
          key = favoriteItem.word;
      } else if (type === 'grammar') {
          const g = item as GrammarPoint;
          favoriteItem = {
              word: g.pattern,
              reading: 'Grammar',
              meaning: g.explanation,
              meaning_mm: g.explanation_mm,
              type: 'grammar',
              context: g.example,
              context_html: g.example_html
          };
          key = g.pattern;
      } else {
          const p = item as UsefulPhrase;
          favoriteItem = {
              word: p.phrase,
              reading: 'Phrase',
              meaning: p.meaning,
              meaning_mm: p.meaning_mm,
              type: 'phrase',
              context: p.context,
              context_html: p.context_html,
              context_en: p.context_en,
              context_mm: p.context_mm
          };
          key = p.phrase;
      }

      if (favoriteWords.has(key)) {
          await removeFavorite(key);
          setFavoriteWords(prev => {
              const next = new Set(prev);
              next.delete(key);
              return next;
          });
          setFavoritesList(prev => prev.filter(i => i.word !== key));
      } else {
          await saveFavorite(favoriteItem);
          setFavoriteWords(prev => {
              const next = new Set(prev);
              next.add(key);
              return next;
          });
          setFavoritesList(prev => [...prev, favoriteItem]);
      }
  };

  // --- Audio Logic ---

  const lineTimings = useMemo(() => {
    if (!scenario || !totalAudioDuration) return [];
    
    // Base weight for pause/context
    const BASE_WEIGHT = 5; 
    
    const totalWeight = scenario.dialogue.reduce((acc, line) => acc + line.japanese.length + BASE_WEIGHT, 0);
    
    let currentTime = 0;
    return scenario.dialogue.map((line) => {
      const lineWeight = line.japanese.length + BASE_WEIGHT;
      const duration = (lineWeight / totalWeight) * totalAudioDuration;
      const start = currentTime;
      const end = currentTime + duration;
      currentTime = end;
      return { start, end };
    });
  }, [scenario, totalAudioDuration]);

  const handleTimeUpdate = (currentTime: number) => {
     if (currentTime === 0) {
        setHighlightedLineIndex(null);
        return;
     }

     const activeIndex = lineTimings.findIndex(t => currentTime >= t.start && currentTime < t.end);
     if (activeIndex !== -1 && activeIndex !== highlightedLineIndex) {
        setHighlightedLineIndex(activeIndex);
     }
  };

  const handleDurationLoaded = (duration: number) => {
     setTotalAudioDuration(duration);
  };

  const handleLineClick = (index: number) => {
      if (!audioPlayerRef.current || !lineTimings[index]) return;
      
      const startTime = lineTimings[index].start;
      audioPlayerRef.current.seek(startTime);
  };

  const goToFavorites = () => {
      if (currentView !== 'favorites') {
          setPreviousView(currentView as any); 
          setCurrentView('favorites');
          loadFavorites();
      }
  };

  const handleBack = () => {
    if (currentView === 'test') {
        setCurrentView('exercise');
    } else if (currentView === 'exercise') {
        setCurrentView('detail');
        if (selectedTopicId) {
            getSessionsByTopic(selectedTopicId).then(setSavedSessions);
        }
    } else if (currentView === 'detail') {
        setCurrentView('topic');
        setSelectedTopicId(null);
        loadSessionCounts(); // refresh counts
    } else if (currentView === 'loading') {
        setCurrentView('detail');
    } else if (currentView === 'favorites') {
        setCurrentView(previousView);
    }
    
    audioPlayerRef.current?.stop();
    setHighlightedLineIndex(null);
  };

  const selectedTopicDef = TOPICS.find(t => t.id === selectedTopicId);
  
  const getTopicLabel = (topic: any) => {
      if (!topic) return "";
      if (uiLanguage === 'jp') return topic.label_jp;
      if (uiLanguage === 'mm') return topic.label_mm;
      return topic.label;
  };

  const getLessonTitle = () => {
      if (!scenario) return "";
      if (uiLanguage === 'mm' && scenario.title_mm) return scenario.title_mm;
      if (uiLanguage === 'jp' && scenario.title_jp) return scenario.title_jp;
      if (uiLanguage === 'en' && scenario.title_en) return scenario.title_en;
      return scenario.title;
  };

  const getLessonSummary = () => {
      if (!scenario) return "";
      if (uiLanguage === 'mm' && scenario.summary_mm) return scenario.summary_mm;
      if (uiLanguage === 'jp' && scenario.summary_jp) return scenario.summary_jp;
      if (uiLanguage === 'en' && scenario.summary_en) return scenario.summary_en;
      return scenario.summary;
  };

  const themeConfig = THEMES[currentTheme];

  const renderSectionToggle = (
      enState: boolean, toggleEn: () => void, 
      mmState: boolean, toggleMm: () => void,
      furiganaState?: boolean, toggleFurigana?: () => void
  ) => (
      <div className="flex gap-2">
           {furiganaState !== undefined && toggleFurigana && (
              <button 
                onClick={toggleFurigana}
                className={`px-2 py-1 text-[10px] font-bold rounded border backdrop-blur-sm ${furiganaState ? `bg-white/50 border-white/40 ${themeConfig.text}` : `bg-transparent opacity-40 ${themeConfig.text} border-current`}`}
              >
                {t('toggle_furigana', uiLanguage)}
              </button>
           )}
           <button 
             onClick={toggleEn}
             className={`px-2 py-1 text-[10px] font-bold rounded border backdrop-blur-sm ${enState ? `bg-indigo-500/30 text-indigo-200 border-indigo-400/50 shadow-inner` : `bg-transparent opacity-40 ${themeConfig.text} border-current`}`}
           >
             EN
           </button>
           <button 
             onClick={toggleMm}
             className={`px-2 py-1 text-[10px] font-bold rounded border backdrop-blur-sm ${mmState ? `bg-emerald-500/30 text-emerald-200 border-emerald-400/50 shadow-inner` : `bg-transparent opacity-40 ${themeConfig.text} border-current`}`}
           >
             MM
           </button>
      </div>
  );

  const ThemeSelectorModal = () => (
      <div className={`absolute top-16 right-4 z-50 rounded-xl shadow-2xl p-4 border w-64 animate-fade-in grid grid-cols-2 gap-2 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700`}>
          {(Object.keys(THEMES) as AppTheme[]).map(key => (
              <button 
                key={key}
                onClick={() => { setCurrentTheme(key); setShowThemeSelector(false); }}
                className={`p-2 rounded text-xs font-bold capitalize flex items-center gap-2 transition-colors ${currentTheme === key ? `ring-2 ring-sakura-500 bg-stone-100 dark:bg-stone-800` : 'hover:bg-stone-100 dark:hover:bg-stone-800'}`}
              >
                  <span className="text-lg">{THEMES[key].icon}</span>
                  <span className={`text-stone-800 dark:text-stone-200`}>{t(`theme_${key}` as any, uiLanguage)}</span>
              </button>
          ))}
      </div>
  );

  // Helper to ensure styles on custom inputs
  const inputStyleClass = `w-full p-4 border-transparent rounded-xl bg-white/20 ${themeConfig.text} ${themeConfig.placeholder} focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors resize-y min-h-[80px] shadow-inner backdrop-blur-sm`;

  // Helper function to render text with furigana toggle support for titles
  const renderTitleWithRuby = (word: string, reading: string | undefined, showRuby: boolean) => {
    if (showRuby && reading && reading !== 'Grammar' && reading !== 'Phrase') {
        return (
            <ruby className={`text-xl font-bold ${themeConfig.text}`}>
                {word}
                <rt className="text-[10px] font-normal opacity-80">{reading}</rt>
            </ruby>
        );
    }
    return <span className={`text-xl font-bold ${themeConfig.text}`}>{word}</span>;
  };

  // Helper to render Favorites Item
  const renderFavoriteItem = (item: VocabularyItem) => (
    <div key={item.word} className={`p-5 rounded-xl shadow-sm border flex justify-between items-start animate-slide-up relative overflow-hidden backdrop-blur-md ${themeConfig.glass} ${themeConfig.border}`}>
        <div className="flex-1 pr-4">
            <div className="flex items-baseline gap-2 flex-wrap">
                {renderTitleWithRuby(item.word, item.reading, showFavoritesFurigana)}
                {!showFavoritesFurigana && item.reading && item.reading !== 'Grammar' && item.reading !== 'Phrase' && (
                    <span className={`text-sm opacity-70 ${themeConfig.text}`}>({item.reading})</span>
                )}
            </div>
            {showVocabEN && <p className={`mt-2 text-sm ${themeConfig.text} opacity-80`}>{item.meaning}</p>}
            {showVocabMM && item.meaning_mm && (
                <p className={`${themeConfig.mmText} font-myanmar mt-1 text-sm font-bold bg-white/40 inline-block px-1 rounded`}>{item.meaning_mm}</p>
            )}
            {(item.context || item.context_html) && (
                <div className="mt-2 p-2 rounded bg-white/20 border border-white/20">
                    <div className="flex items-start justify-between">
                    <div className="flex-1">
                        {showFavoritesFurigana && item.context_html ? (
                            <p className={`text-xs italic mb-1 ${themeConfig.text}`} dangerouslySetInnerHTML={{ __html: `Eg: ${item.context_html}` }} />
                        ) : (
                            <p className={`text-xs italic ${themeConfig.text}`}>Eg: {item.context}</p>
                        )}
                    </div>
                    <ExampleAudioButton text={item.context || ""} theme={currentTheme} textClass={themeConfig.text} />
                    </div>
                    
                    {showVocabEN && item.context_en && <p className={`text-xs opacity-70 mt-0.5 ${themeConfig.text}`}>{item.context_en}</p>}
                    {showVocabMM && item.context_mm && <p className={`text-xs ${themeConfig.mmText} font-myanmar mt-0.5`}>{item.context_mm}</p>}
                </div>
            )}
        </div>
        <button 
            onClick={() => toggleFavorite(item, item.type || 'vocab')}
            className="text-2xl text-yellow-400 hover:text-stone-300 transition-colors shrink-0"
            title="Remove from favorites"
        >
            ★
        </button>
    </div>
  );

  // Helper to determine footer text gradient based on theme
  const getFooterGradient = (theme: AppTheme) => {
    switch (theme) {
        case 'sakura': return 'from-pink-500 via-rose-300 to-pink-500';
        case 'fuji': return 'from-blue-600 via-cyan-300 to-blue-600';
        case 'fire': 
        case 'anime': return 'from-orange-500 via-yellow-300 to-orange-500';
        case 'forest': return 'from-emerald-400 via-green-200 to-emerald-400';
        case 'magic': 
        case 'galaxy': return 'from-purple-400 via-fuchsia-200 to-purple-400';
        case 'love': return 'from-red-500 via-pink-300 to-red-500';
        case 'hanabi': return 'from-yellow-400 via-pink-400 to-cyan-400';
        case 'winter': return 'from-blue-400 via-white to-blue-400';
        case 'one_piece': return 'from-yellow-400 via-blue-300 to-yellow-400';
        case 'three_d': return 'from-cyan-400 via-white to-cyan-400';
        case 'demon_slayer': return 'from-green-400 via-emerald-200 to-green-400';
        case 'night': return 'from-indigo-300 via-purple-200 to-indigo-300';
        case 'rain': return 'from-blue-300 via-slate-200 to-blue-300';
        default: return 'from-stone-600 via-stone-400 to-stone-600';
    }
  };

  return (
    <div className={`min-h-screen pb-20 transition-all duration-500 flex flex-col ${themeConfig.bg} ${uiLanguage === 'mm' ? 'font-myanmar' : ''}`}>
      
      <BackgroundEffects theme={currentTheme} />

      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b shadow-sm transition-colors ${themeConfig.glass} ${themeConfig.border}`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
             {currentView !== 'topic' && (
                <button 
                  onClick={handleBack}
                  className={`p-2 rounded-full transition-colors ${themeConfig.text} hover:bg-white/20`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
             )}
             <div>
                <h1 className={`text-xl font-bold bg-clip-text ${themeConfig.text}`}>
                    {t('app_title', uiLanguage)}
                </h1>
                <p className={`text-xs opacity-70 font-medium ${themeConfig.text}`}>{t('app_subtitle', uiLanguage)}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button
                onClick={toggleLanguage}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors text-xs font-bold hover:bg-white/20 ${themeConfig.text}`}
             >
                <span className="text-lg">🌐</span>
                {uiLanguage === 'en' ? 'EN' : uiLanguage === 'jp' ? 'JP' : 'MM'}
             </button>

             <button 
               onClick={() => setShowThemeSelector(!showThemeSelector)}
               className={`p-2 rounded-full hover:bg-white/20 ${themeConfig.text}`}
               title="Theme"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
             </button>

             <button
                onClick={goToFavorites}
                className={`p-2 rounded-full transition-all hover:bg-white/20 ${currentView === 'favorites' ? 'text-yellow-400' : themeConfig.text}`}
                title="Favorites Notebook"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={currentView === 'favorites' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             </button>
          </div>
          
          {showThemeSelector && <ThemeSelectorModal />}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 animate-fade-in flex-1 w-full z-10 relative">
        
        {currentView === 'topic' && (
          <div className="space-y-6">
             <div className={`text-center py-8 rounded-2xl ${themeConfig.glass} ${themeConfig.border} backdrop-blur-md shadow-sm border`}>
               <h2 className={`text-3xl font-bold mb-3 ${themeConfig.text}`}>{t('choose_topic_title', uiLanguage)}</h2>
               <p className={`${themeConfig.text} opacity-80 max-w-lg mx-auto`}>{t('choose_topic_desc', uiLanguage)}</p>
             </div>
             <TopicSelector 
                onSelect={handleTopicClick} 
                disabled={false} 
                language={uiLanguage}
                glassClass={themeConfig.glass}
                borderClass={themeConfig.border}
                textClass={themeConfig.text}
                counts={sessionCounts}
             />
          </div>
        )}

        {currentView === 'favorites' && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className={`px-6 py-2 rounded-full ${themeConfig.glass} ${themeConfig.border} backdrop-blur-md shadow-sm border`}>
                        <h2 className={`text-2xl font-bold ${themeConfig.text}`}>{t('favorites_title', uiLanguage)}</h2>
                    </div>
                    <div className="flex gap-2 items-center">
                        <button 
                            onClick={() => setShowFavoritesFurigana(!showFavoritesFurigana)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors backdrop-blur-md ${showFavoritesFurigana ? `bg-white/50 ${themeConfig.text} ${themeConfig.border}` : `bg-transparent opacity-50 border-current ${themeConfig.text}`}`}
                        >
                            {t('toggle_furigana', uiLanguage)}
                        </button>
                        {renderSectionToggle(showVocabEN, () => setShowVocabEN(!showVocabEN), showVocabMM, () => setShowVocabMM(!showVocabMM))}
                        <button 
                            onClick={handleBack}
                            className={`flex items-center gap-1 px-4 py-2 bg-white/30 rounded-lg hover:bg-white/50 transition-colors font-bold text-sm ${themeConfig.accent}`}
                        >
                            ← {t('back_button', uiLanguage)}
                        </button>
                    </div>
                </div>

                {favoritesList.length === 0 ? (
                    <div className={`text-center py-20 text-stone-400 rounded-2xl ${themeConfig.glass} ${themeConfig.border} backdrop-blur-md border`}>
                        <div className="text-4xl mb-4">📓</div>
                        <p>{t('no_favorites', uiLanguage)}</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Vocabulary Section */}
                        {favoritesList.some(i => !i.type || i.type === 'vocab') && (
                            <div className="space-y-4">
                                <h3 className={`text-lg font-bold uppercase tracking-wider opacity-80 ${themeConfig.text} border-b ${themeConfig.border} pb-2`}>
                                    {t('key_vocab_title', uiLanguage)}
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {favoritesList.filter(i => !i.type || i.type === 'vocab').map(renderFavoriteItem)}
                                </div>
                            </div>
                        )}

                        {/* Grammar Section */}
                        {favoritesList.some(i => i.type === 'grammar') && (
                            <div className="space-y-4">
                                <h3 className={`text-lg font-bold uppercase tracking-wider opacity-80 ${themeConfig.text} border-b ${themeConfig.border} pb-2`}>
                                    {t('grammar_notes_title', uiLanguage)}
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {favoritesList.filter(i => i.type === 'grammar').map(renderFavoriteItem)}
                                </div>
                            </div>
                        )}

                        {/* Phrases Section */}
                        {favoritesList.some(i => i.type === 'phrase') && (
                            <div className="space-y-4">
                                <h3 className={`text-lg font-bold uppercase tracking-wider opacity-80 ${themeConfig.text} border-b ${themeConfig.border} pb-2`}>
                                    {t('useful_phrases_title', uiLanguage)}
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {favoritesList.filter(i => i.type === 'phrase').map(renderFavoriteItem)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {currentView === 'detail' && selectedTopicDef && (
          <div className={`p-6 rounded-2xl shadow-sm border backdrop-blur-md ${themeConfig.glass} ${themeConfig.border}`}>
            <SavedSessionsList 
                sessions={savedSessions}
                topicLabel={getTopicLabel(selectedTopicDef)}
                topicId={selectedTopicDef.id}
                onPlay={handlePlaySaved}
                onDelete={handleDeleteSession}
                onCreateNew={handleGenerateNew}
                onPreviewVoice={handleVoicePreview}
                language={uiLanguage}
                textClass={themeConfig.text}
                glassClass={themeConfig.glass}
                borderClass={themeConfig.border}
                inputBgClass={themeConfig.inputBg}
            />
          </div>
        )}

        {currentView === 'loading' && (
           <LoadingScene progress={loadingProgress} step={loadingStep} theme={currentTheme} language={uiLanguage} />
        )}

        {currentView === 'test' && scenario && (
           <div className="space-y-6">
              <button 
                 onClick={() => setCurrentView('exercise')}
                 className={`mb-4 text-sm font-bold ${themeConfig.accent} hover:underline flex items-center gap-1 bg-white/40 px-3 py-1 rounded-full`}
              >
                 ← {t('test_back', uiLanguage)}
              </button>
              <VocabularyTest 
                items={scenario.vocabulary} 
                onExit={() => setCurrentView('exercise')} 
                language={uiLanguage}
                glassClass={themeConfig.glass}
                textClass={themeConfig.text}
                borderClass={themeConfig.border}
                accentClass={themeConfig.accent}
              />
           </div>
        )}

        {currentView === 'exercise' && scenario && (
          <div className="space-y-8 animate-slide-up">
            
            <div className={`p-6 rounded-2xl shadow-sm border backdrop-blur-md ${themeConfig.glass} ${themeConfig.border}`}>
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-block px-2 py-1 bg-white/50 text-xs font-bold rounded uppercase mb-2 tracking-wide ${themeConfig.accent} border ${themeConfig.border}`}>
                        {scenario.difficulty} Level
                    </span>
                    <h2 className={`text-2xl font-bold ${uiLanguage === 'mm' ? 'font-myanmar' : ''} ${themeConfig.text}`}>
                        {getLessonTitle()}
                    </h2>
                  </div>
               </div>
               
               <p className={`opacity-80 ${uiLanguage === 'mm' ? 'font-myanmar' : ''} ${themeConfig.text}`}>
                   {getLessonSummary()}
               </p>
            </div>

            <AudioPlayer 
               ref={audioPlayerRef} 
               audioData={audioData} 
               onTimeUpdate={handleTimeUpdate}
               onDurationLoaded={handleDurationLoaded}
               glassClass={themeConfig.glass}
               textClass={themeConfig.text}
               accentClass={themeConfig.accent}
               borderClass={themeConfig.border}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Left Column: Script */}
               <div className="lg:col-span-2 space-y-6">
                  <div className={`rounded-2xl shadow-sm border overflow-hidden backdrop-blur-md ${themeConfig.glass} ${themeConfig.border}`}>
                     <div className={`p-4 border-b flex flex-wrap gap-2 items-center justify-between bg-white/20 ${themeConfig.border}`}>
                        <h3 className={`font-bold ${themeConfig.text}`}>Dialogue</h3>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setShowFurigana(!showFurigana)}
                             className={`px-3 py-1 text-xs font-bold rounded-full transition-all backdrop-blur-sm ${showFurigana ? `bg-white/80 ${themeConfig.text} shadow-md` : `bg-white/20 opacity-60 ${themeConfig.text}`}`}
                           >
                             Furigana
                           </button>
                           <button 
                             onClick={() => setShowJapanese(!showJapanese)}
                             className={`px-3 py-1 text-xs font-bold rounded-full transition-all backdrop-blur-sm ${showJapanese ? `bg-white/80 ${themeConfig.text} shadow-md` : `bg-white/20 opacity-60 ${themeConfig.text}`}`}
                           >
                             JP
                           </button>
                           <button 
                             onClick={() => setShowEnglish(!showEnglish)}
                             className={`px-3 py-1 text-xs font-bold rounded-full transition-all backdrop-blur-sm ${showEnglish ? `bg-white/80 ${themeConfig.text} shadow-md` : `bg-white/20 opacity-60 ${themeConfig.text}`}`}
                           >
                             EN
                           </button>
                           <button 
                             onClick={() => setShowMyanmar(!showMyanmar)}
                             className={`px-3 py-1 text-xs font-bold rounded-full transition-all backdrop-blur-sm ${showMyanmar ? `bg-white/80 ${themeConfig.text} shadow-md` : `bg-white/20 opacity-60 ${themeConfig.text}`}`}
                           >
                             MM
                           </button>
                        </div>
                     </div>
                     <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar bg-white/5">
                        {scenario.dialogue.map((line, idx) => (
                           <div 
                              key={idx} 
                              onClick={() => handleLineClick(idx)}
                              className={`flex gap-4 p-3 rounded-xl transition-all cursor-pointer border ${
                                 highlightedLineIndex === idx
                                        ? `bg-white/40 ${themeConfig.border} shadow-sm transform scale-[1.01]`
                                        : 'border-transparent hover:bg-white/20 hover:shadow-sm'
                              }`}
                           >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm 
                                ${line.speaker === 'Narrator' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : line.speaker === 'A' 
                                    ? 'bg-orange-100 text-orange-700' 
                                    : line.speaker === 'B' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-green-100 text-green-700'}`}>
                                 {line.speaker === 'Narrator' ? 'N' : line.speaker}
                              </div>
                              <div className="flex-1 space-y-1">
                                 {showJapanese ? (
                                    showFurigana ? (
                                        <p className={`text-lg leading-relaxed ${themeConfig.text}`} dangerouslySetInnerHTML={{ __html: line.japanese_html }} />
                                    ) : (
                                        <p className={`text-lg leading-relaxed ${themeConfig.text}`}>{line.japanese}</p>
                                    )
                                 ) : (
                                    <div className="h-6 bg-stone-200/50 rounded w-3/4 animate-pulse"></div>
                                 )}
                                 
                                 {showEnglish && <p className={`text-sm opacity-70 ${themeConfig.text}`}>{line.english}</p>}
                                 {showMyanmar && <p className={`text-sm ${themeConfig.mmText} font-myanmar bg-white/30 inline-block px-1 rounded`}>{line.myanmar}</p>}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  
                  <Quiz 
                    questions={scenario.questions} 
                    language={uiLanguage}
                    glassClass={themeConfig.glass}
                    textClass={themeConfig.text}
                    borderClass={themeConfig.border}
                    accentClass={themeConfig.accent}
                  />
               </div>

               {/* Right Column: Vocab & New Sections */}
               <div className="space-y-6">
                  <div className={`border-2 ${themeConfig.border} rounded-xl p-6 shadow-lg relative overflow-hidden group cursor-pointer backdrop-blur-md ${themeConfig.glass}`} onClick={() => setCurrentView('test')}>
                     <div className="relative z-10">
                        <h3 className={`text-xl font-bold mb-1 ${themeConfig.text}`}>{t('vocab_test_btn', uiLanguage)}</h3>
                        <p className={`${themeConfig.text} opacity-70 text-sm mb-4`}>{t('vocab_test_desc', uiLanguage)}</p>
                        <button className={`bg-white ${themeConfig.accent} px-4 py-2 rounded-lg font-bold text-sm shadow-md group-hover:scale-105 transition-transform`}>{t('vocab_test_btn', uiLanguage)}</button>
                     </div>
                  </div>

                  {/* Vocabulary List */}
                  <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors backdrop-blur-md ${themeConfig.glass} ${themeConfig.border}`}>
                     <div className={`p-4 border-b bg-white/20 flex justify-between items-center flex-wrap gap-2 ${themeConfig.border}`}>
                        <h3 className={`font-bold ${themeConfig.text}`}>{t('key_vocab_title', uiLanguage)}</h3>
                        {renderSectionToggle(showVocabEN, () => setShowVocabEN(!showVocabEN), showVocabMM, () => setShowVocabMM(!showVocabMM), showVocabFurigana, () => setShowVocabFurigana(!showVocabFurigana))}
                     </div>
                     <div className={`divide-y ${themeConfig.border}`}>
                        {scenario.vocabulary.map((item, idx) => (
                           <div key={idx} className="p-4 hover:bg-white/20 transition-colors flex justify-between items-start group">
                              <div className="flex-1 pr-2">
                                 <div className="flex items-baseline gap-2 flex-wrap">
                                    {renderTitleWithRuby(item.word, item.reading, showVocabFurigana)}
                                    {!showVocabFurigana && (
                                        <span className={`text-xs opacity-70 ${themeConfig.text}`}>({item.reading})</span>
                                    )}
                                 </div>
                                 {showVocabEN && <p className={`text-sm opacity-80 ${themeConfig.text}`}>{item.meaning}</p>}
                                 {showVocabMM && item.meaning_mm && (
                                     <p className={`text-sm ${themeConfig.mmText} font-myanmar mt-1 font-bold bg-white/40 px-1 rounded inline-block`}>{item.meaning_mm}</p>
                                 )}
                                 {(item.context || item.context_html) && (
                                     <div className="mt-2 bg-white/20 p-2 rounded border border-white/20">
                                         <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                {showVocabFurigana && item.context_html ? (
                                                    <p className={`text-xs italic mb-1 ${themeConfig.text}`} dangerouslySetInnerHTML={{ __html: `Eg: ${item.context_html}` }} />
                                                ) : (
                                                    <p className={`text-xs italic mb-1 ${themeConfig.text}`}>Eg: {item.context}</p>
                                                )}
                                            </div>
                                            <ExampleAudioButton text={item.context || ""} theme={currentTheme} textClass={themeConfig.text} />
                                         </div>
                                         {showVocabEN && item.context_en && <p className={`text-xs opacity-70 ${themeConfig.text}`}>{item.context_en}</p>}
                                         {showVocabMM && item.context_mm && <p className={`text-xs ${themeConfig.mmText} font-myanmar font-bold`}>{item.context_mm}</p>}
                                     </div>
                                 )}
                              </div>
                              <button 
                                onClick={() => toggleFavorite(item, 'vocab')}
                                className={`text-2xl transition-transform active:scale-125 opacity-70 hover:opacity-100 ${favoriteWords.has(item.word) ? 'text-yellow-400' : `${themeConfig.text}`}`}
                              >
                                ★
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Useful Phrases */}
                  {scenario.useful_phrases && scenario.useful_phrases.length > 0 && (
                      <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors backdrop-blur-md ${themeConfig.glass} ${themeConfig.border}`}>
                         <div className={`p-4 border-b bg-indigo-500/10 flex justify-between items-center flex-wrap gap-2 ${themeConfig.border}`}>
                            <h3 className={`font-bold ${themeConfig.text}`}>{t('useful_phrases_title', uiLanguage)}</h3>
                            {renderSectionToggle(showPhrasesEN, () => setShowPhrasesEN(!showPhrasesEN), showPhrasesMM, () => setShowPhrasesMM(!showPhrasesMM), showPhrasesFurigana, () => setShowPhrasesFurigana(!showPhrasesFurigana))}
                         </div>
                         <div className={`divide-y ${themeConfig.border}`}>
                            {scenario.useful_phrases.map((phrase, idx) => (
                               <div key={idx} className="p-4 flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className={`font-bold text-lg ${themeConfig.text}`}>{phrase.phrase}</p>
                                    {showPhrasesEN && <p className={`text-sm italic opacity-80 ${themeConfig.text}`}>{phrase.meaning}</p>}
                                    {showPhrasesMM && phrase.meaning_mm && <p className={`text-sm ${themeConfig.mmText} italic font-myanmar bg-white/40 px-1 rounded inline-block`}>{phrase.meaning_mm}</p>}
                                    
                                    <div className="mt-2 bg-white/20 p-2 rounded border border-white/20">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                {showPhrasesFurigana && phrase.context_html ? (
                                                    <p className={`text-xs mb-1 ${themeConfig.text}`} dangerouslySetInnerHTML={{__html: `Eg: ${phrase.context_html}`}} />
                                                ) : (
                                                    <p className={`text-xs mb-1 ${themeConfig.text}`}>Eg: {phrase.context}</p>
                                                )}
                                            </div>
                                            <ExampleAudioButton text={phrase.context || ""} theme={currentTheme} textClass={themeConfig.text} />
                                        </div>
                                        {showPhrasesEN && phrase.context_en && <p className={`text-xs opacity-70 mt-1 ${themeConfig.text}`}>{phrase.context_en}</p>}
                                        {showPhrasesMM && phrase.context_mm && <p className={`text-xs ${themeConfig.mmText} font-myanmar mt-1 font-bold`}>{phrase.context_mm}</p>}
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => toggleFavorite(phrase, 'phrase')}
                                    className={`text-2xl transition-transform active:scale-125 ml-2 opacity-70 hover:opacity-100 ${favoriteWords.has(phrase.phrase) ? 'text-yellow-400' : `${themeConfig.text}`}`}
                                  >
                                    ★
                                  </button>
                               </div>
                            ))}
                         </div>
                      </div>
                  )}

                  {/* Grammar Notes */}
                  {scenario.grammar && scenario.grammar.length > 0 && (
                      <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors backdrop-blur-md ${themeConfig.glass} ${themeConfig.border}`}>
                         <div className={`p-4 border-b bg-emerald-500/10 flex justify-between items-center flex-wrap gap-2 ${themeConfig.border}`}>
                            <h3 className={`font-bold ${themeConfig.text}`}>{t('grammar_notes_title', uiLanguage)}</h3>
                            {renderSectionToggle(showGrammarEN, () => setShowGrammarEN(!showGrammarEN), showGrammarMM, () => setShowGrammarMM(!showGrammarMM), showGrammarFurigana, () => setShowGrammarFurigana(!showGrammarFurigana))}
                         </div>
                         <div className="p-4 space-y-4">
                            {scenario.grammar.map((g, idx) => (
                               <div key={idx} className="bg-white/30 p-3 rounded-lg flex justify-between items-start border border-white/30">
                                  <div className="flex-1">
                                    <p className={`font-bold font-mono text-sm mb-1 ${themeConfig.text}`}>{g.pattern}</p>
                                    {showGrammarEN && <p className={`text-sm mb-1 ${themeConfig.text}`}>{g.explanation}</p>}
                                    {showGrammarMM && g.explanation_mm && <p className={`text-sm ${themeConfig.mmText} mb-2 font-myanmar bg-white/50 px-1 rounded inline-block`}>{g.explanation_mm}</p>}
                                    <div className={`text-xs p-2 rounded border bg-white/40 ${themeConfig.border}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                {showGrammarFurigana && g.example_html ? (
                                                    <div className={themeConfig.text} dangerouslySetInnerHTML={{ __html: `Eg: ${g.example_html}`}} />
                                                ) : (
                                                    <div className={themeConfig.text}>Eg: {g.example}</div>
                                                )}
                                            </div>
                                            <ExampleAudioButton text={g.example || ""} theme={currentTheme} textClass={themeConfig.text} />
                                        </div>
                                        {showGrammarEN && g.example_en && <div className={`mt-1 opacity-70 ${themeConfig.text}`}>{g.example_en}</div>}
                                        {showGrammarMM && g.example_mm && <div className={`mt-1 ${themeConfig.mmText} font-myanmar font-bold`}>{g.example_mm}</div>}
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => toggleFavorite(g, 'grammar')}
                                    className={`text-2xl transition-transform active:scale-125 ml-2 opacity-70 hover:opacity-100 ${favoriteWords.has(g.pattern) ? 'text-yellow-400' : `${themeConfig.text}`}`}
                                  >
                                    ★
                                  </button>
                               </div>
                            ))}
                         </div>
                      </div>
                  )}

               </div>
            </div>
          </div>
        )}
      </main>

      <footer className={`text-center py-6 text-sm mt-auto border-t relative z-10 backdrop-blur-md ${themeConfig.glass} ${themeConfig.border} ${themeConfig.text}`}>
         <p className="font-bold opacity-80">
           &copy; 2025 {t('footer_text', uiLanguage)} <span className={`bg-gradient-to-r ${getFooterGradient(currentTheme)} bg-clip-text text-transparent animate-text-shine bg-[length:200%_auto] font-extrabold`}>Hein Htet Soe</span>.
         </p>
      </footer>
    </div>
  );
}