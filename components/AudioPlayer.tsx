import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { decodeBase64, decodeAudioData } from '../services/audioUtils';

interface AudioPlayerProps {
  audioData: string | null; // Base64 PCM
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationLoaded?: (duration: number) => void;
  glassClass?: string;
  textClass?: string;
  accentClass?: string;
  borderClass?: string;
}

export interface AudioPlayerRef {
  stop: () => void;
  seek: (time: number) => void;
  play: () => void;
  isPlaying: boolean;
}

// Updated speeds including 0.8x
const PLAYBACK_SPEEDS = [0.8, 1.0, 1.15, 1.25, 1.5];

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ 
  audioData, 
  onPlayStart, 
  onPlayEnd, 
  onTimeUpdate,
  onDurationLoaded,
  glassClass,
  textClass,
  accentClass,
  borderClass
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);

  // Audio Context & Nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Timing State
  const rafRef = useRef<number | null>(null);
  const lastRafTime = useRef<number>(0);

  // Initialize Audio Buffer
  useEffect(() => {
    stopAudio();
    audioBufferRef.current = null;
    setDuration(0);
    setCurrentTime(0);

    if (!audioData) return;

    const initAudio = async () => {
      try {
        if (!audioContextRef.current) {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const bytes = decodeBase64(audioData);
        const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
        
        audioBufferRef.current = buffer;
        const safeDuration = buffer.duration || 0.1;
        setDuration(safeDuration);
        setHasError(false);
        
        if (onDurationLoaded) {
            onDurationLoaded(safeDuration);
        }
      } catch (e) {
        console.error("Audio decoding failed", e);
        setHasError(true);
      }
    };

    initAudio();
    
    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (sourceNodeRef.current) {
             try { sourceNodeRef.current.stop(); } catch(e){}
        }
    };
  }, [audioData]);

  const stopAudio = () => {
      if (sourceNodeRef.current) {
          try { sourceNodeRef.current.stop(); } catch(e){}
          sourceNodeRef.current = null;
      }
      if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
      }
      setIsPlaying(false);
  };

  const updateProgressDelta = (timestamp: number) => {
      if (!isPlaying || !sourceNodeRef.current) return;

      if (!lastRafTime.current) lastRafTime.current = timestamp;
      const deltaTime = (timestamp - lastRafTime.current) / 1000;
      lastRafTime.current = timestamp;

      setCurrentTime(prev => {
          const next = prev + (deltaTime * sourceNodeRef.current!.playbackRate.value);
          if (next >= duration) {
              stopAudio();
              if (onPlayEnd) onPlayEnd();
              return duration;
          }
          if (onTimeUpdate) onTimeUpdate(next);
          return next;
      });

      rafRef.current = requestAnimationFrame(updateProgressDelta);
  };

  const playAudioWithDelta = async (offset: number) => {
      if (!audioBufferRef.current || !audioContextRef.current) return;
      
      if (sourceNodeRef.current) {
          try { sourceNodeRef.current.stop(); } catch(e){}
          sourceNodeRef.current = null;
      }

      if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
      }

      const safeOffset = Math.max(0, Math.min(offset, duration));

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.playbackRate.value = playbackRate;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
          // Manual stop check
      };

      source.start(0, safeOffset);
      sourceNodeRef.current = source;
      setIsPlaying(true);
      setCurrentTime(safeOffset);
      
      if (onPlayStart) onPlayStart();
      
      lastRafTime.current = 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProgressDelta);
  };

  useImperativeHandle(ref, () => ({ 
    stop: () => {
        stopAudio();
        setCurrentTime(0);
        if (onTimeUpdate) onTimeUpdate(0);
    },
    seek: (time: number) => {
        const safeTime = Math.max(0, Math.min(time, duration));
        setCurrentTime(safeTime);
        if (onTimeUpdate) onTimeUpdate(safeTime);
        if (isPlaying) {
            playAudioWithDelta(safeTime);
        }
    },
    play: () => {
        if (!isPlaying) {
            playAudioWithDelta(currentTime);
        }
    },
    isPlaying
  }));

  const togglePlay = () => {
      if (isPlaying) {
          stopAudio();
      } else {
          let resumeTime = currentTime;
          if (resumeTime >= duration - 0.1) resumeTime = 0;
          playAudioWithDelta(resumeTime);
      }
  };

  const skip = (seconds: number) => {
      let newTime = currentTime + seconds;
      newTime = Math.max(0, Math.min(newTime, duration));
      setCurrentTime(newTime);
      if (onTimeUpdate) onTimeUpdate(newTime);
      if (isPlaying) {
          playAudioWithDelta(newTime);
      }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newTime = parseFloat(e.target.value);
      if (newTime > duration) newTime = duration;
      
      setCurrentTime(newTime);
      if (onTimeUpdate) onTimeUpdate(newTime);
      
      if (isPlaying) {
          playAudioWithDelta(newTime);
      }
  };

  const changeSpeed = () => {
      const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackRate);
      const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
      const newRate = PLAYBACK_SPEEDS[nextIndex];
      
      setPlaybackRate(newRate);
      if (sourceNodeRef.current) {
           sourceNodeRef.current.playbackRate.value = newRate;
      }
  };

  const formatTime = (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!audioData) return null;

  return (
    <div className={`w-full backdrop-blur-xl border p-5 rounded-2xl shadow-xl mb-6 sticky top-4 z-50 ${glassClass || 'bg-white/20'} ${borderClass || 'border-white/20'} ${textClass || 'text-stone-800'}`}>
      
      <div className="flex items-center justify-between mb-3">
         <div className="flex flex-col">
            <span className={`text-[10px] uppercase tracking-widest font-bold opacity-70`}>Audio Player</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-mono opacity-90">{formatTime(currentTime)}</span>
                <span className="text-xs opacity-50">/</span>
                <span className="text-sm font-mono opacity-60">{formatTime(duration)}</span>
            </div>
         </div>
         
         <button 
            onClick={changeSpeed}
            className={`text-xs font-bold px-3 py-1.5 rounded transition-colors border flex items-center gap-1 bg-white/10 hover:bg-white/20 ${borderClass}`}
         >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
            {playbackRate}x
         </button>
      </div>

      <div className="relative w-full h-6 flex items-center mb-6 group touch-none">
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            step="0.01"
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className="absolute w-full h-8 -mt-1 bg-transparent opacity-0 cursor-pointer z-20"
          />
          <div className="w-full h-2 bg-black/20 rounded-lg overflow-hidden relative pointer-events-none">
              <div 
                className="h-full transition-all duration-75 ease-linear shadow-sm bg-current opacity-80"
                style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
              ></div>
          </div>
          <div 
            className="absolute h-4 w-4 bg-white rounded-full shadow-md pointer-events-none transition-all duration-75 ease-linear transform -translate-x-1/2 z-10"
            style={{ left: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          ></div>
      </div>

      {hasError ? (
         <div className="text-red-400 text-sm">Error decoding audio.</div>
      ) : (
        <div className="flex justify-center items-center gap-4">
            {/* Rewind 5s */}
            <button 
                onClick={() => skip(-5)}
                className={`p-2 transition-colors rounded-full hover:bg-white/20 ${textClass}`}
                title="-5 seconds"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
                <span className="text-[10px] block text-center font-bold -mt-1">-5s</span>
            </button>

            {/* Play/Pause */}
            <button
            onClick={togglePlay}
            className={`flex items-center justify-center gap-2 w-14 h-14 rounded-full font-bold transition-all shadow-lg transform active:scale-95 ${textClass} bg-white/80 hover:bg-white`}
            style={{ color: 'inherit' }} // Use inherited text color or explicit override if needed
            >
            {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="black"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="black" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
            )}
            </button>

             {/* Forward 5s */}
            <button 
                onClick={() => skip(5)}
                className={`p-2 transition-colors rounded-full hover:bg-white/20 ${textClass}`}
                title="+5 seconds"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
                <span className="text-[10px] block text-center font-bold -mt-1">+5s</span>
            </button>
        </div>
      )}
    </div>
  );
});