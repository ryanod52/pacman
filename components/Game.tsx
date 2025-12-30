import React, { useEffect, useRef } from 'react';
import { PACMAN } from '../services/pacmanEngine';

interface GameProps {
  lives: number;
  onGameOver: (score: number) => void;
}

export const Game: React.FC<GameProps> = ({ lives, onGameOver }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Initialize game
      PACMAN.init(containerRef.current, "https://raw.githubusercontent.com/daleharvey/pacman/master/", lives, onGameOver);
    }

    return () => {
      PACMAN.stop();
    };
  }, [lives, onGameOver]);

  return (
    <div className="relative flex flex-col items-center">
      <div 
        id="pacman" 
        ref={containerRef} 
        className="relative mx-auto"
        style={{ height: '470px', width: '382px' }} // Match original aspect ratio
      ></div>
      <button 
        onClick={() => {
            PACMAN.stop();
            onGameOver(0);
        }}
        className="mt-8 text-gray-500 hover:text-white text-sm"
      >
        QUIT GAME
      </button>
    </div>
  );
};