import React, { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import type { ChatMessage } from '../../types';
import { useSession } from '../../context/SessionContext';
// Placeholder Icons REMOVED
// const UserIcon = () => <div className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-900 flex items-center justify-center text-xs text-blue-800 dark:text-blue-200">User</div>;
// const BotIcon = () => <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-100">AI</div>;

const backendBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

/**
 * PronunciationPlayer renders a floating play button overlay in the top-right of the bubble.
 * Shows a playing state while audio is playing.
 */
const PronunciationPlayer: React.FC<{ sessionId: string | null; word: string }> = ({ sessionId, word }) => {
  const playedWordsRef = useRef<{ [session: string]: Set<string> }>({});
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (sessionId && word) {
      const wordKey = word.toLowerCase();
      if (!playedWordsRef.current[sessionId]) playedWordsRef.current[sessionId] = new Set();
      const sessionWords = playedWordsRef.current[sessionId];
      const url = `${backendBase}/speech/${wordKey}`;
      setAudioUrl(url);
      if (!sessionWords.has(wordKey)) {
        sessionWords.add(wordKey);
        setTimeout(() => {
          try { audioRef.current?.play(); } catch {}
        }, 150);
      }
    } else {
      setAudioUrl(null);
    }
  }, [sessionId, word]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setPlaying(true);
    const handleEnded = () => setPlaying(false);
    const handlePause = () => setPlaying(false);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl]);

  const handlePlay = () => {
    try { audioRef.current?.play(); } catch {}
  };

  if (!audioUrl) return null;
  return (
    <div style={{ position: 'relative', width: '100%', height: 0 }}>
      <button
        onClick={handlePlay}
        aria-label="Play pronunciation"
        style={{
          position: 'absolute',
          top: -8,
          right: -8,
          zIndex: 2,
          background: playing
            ? 'radial-gradient(circle at 50% 50%, #a5b4fc 60%, #6366f1 100%)'
            : 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)',
          border: 'none',
          borderRadius: '50%',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: playing
            ? '0 0 0 4px #6366f155, 0 2px 8px rgba(0,0,0,0.10)'
            : '0 2px 8px rgba(0,0,0,0.10)',
          cursor: 'pointer',
          opacity: 0.92,
          transition: 'opacity 0.2s, box-shadow 0.2s, background 0.2s',
        }}
        onMouseOver={e => (e.currentTarget.style.opacity = '1')}
        onMouseOut={e => (e.currentTarget.style.opacity = '0.92')}
      >
        <svg width="18" height="18" viewBox="0 0 22 22" fill="white" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="11" fill="none"/>
          <polygon points="8,6 16,11 8,16" fill="white"/>
        </svg>
      </button>
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
    </div>
  );
};

/**
 * Renders an individual chat message with styling similar to modern chat apps.
 */
const MessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { sessionId } = useSession();
  const isUser = message.role === 'user';
  
  if (message.role === 'checkpoint') {
    return (
      <div className="w-full flex justify-center my-2">
        <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded font-semibold shadow">
          {message.content}
        </div>
      </div>
    );
  }
  
  // Define base classes for the message bubble
  const bubbleBaseClasses = 'max-w-[75%] p-3 rounded-lg shadow-sm relative';
  
  // Define specific classes based on the sender
  const userClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100';
  // Removed border from botClasses
  const botClasses = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'; // Re-added shadow-sm here as border is gone

  return (
    // Removed icon layout classes (items-start, gap-3), added margin-bottom
    <div className={clsx('flex mb-3', isUser ? 'justify-end' : 'justify-start')}>
      {/* Bot Icon REMOVED */} 
      {/* {!isUser && <BotIcon />} */} 
      
      {/* Message Bubble */} 
      <div
        className={clsx(
          bubbleBaseClasses,
          isUser ? userClasses : botClasses,
          message.isLoading && 'opacity-60 italic' // Slightly softer opacity
        )}
      >
        {/* Use min-h-[1.5rem] to prevent collapse when loading */}
        <p className="whitespace-pre-wrap min-h-[1.5rem]">
          {message.content || (message.isLoading && !isUser ? '...' : '')}
        </p>
        {/* Floating PronunciationPlayer overlay in the assistant bubble */}
        {!isUser && message.currentWordProgress === 'pronunciation' && message.currentWord && sessionId && (
          <PronunciationPlayer sessionId={sessionId} word={message.currentWord} />
        )}
      </div>
      
      {/* User Icon REMOVED */}
      {/* {isUser && <UserIcon />} */} 
    </div>
  );
};

export default MessageItem; 