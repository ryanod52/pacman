import React, { useState, useEffect } from 'react';

interface StartScreenProps {
  onStart: (lives: number) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 z-10 p-4">
      <h1 className="text-yellow-400 text-6xl md:text-7xl text-center leading-tight drop-shadow-[0_5px_5px_rgba(255,255,0,0.5)]">
        PAC-MAN
      </h1>

      <div className={`text-red-500 text-3xl md:text-5xl transition-opacity duration-100 ${blink ? 'opacity-100' : 'opacity-0'}`}>
        INSERT COIN
      </div>

      <div className="flex flex-col space-y-6 mt-8">
        <button
          onClick={() => onStart(1)}
          className="text-cyan-400 hover:text-white text-xl md:text-2xl transition-colors text-center"
        >
          1 COIN  - 1 LIFE
        </button>
        <button
          onClick={() => onStart(2)}
          className="text-pink-400 hover:text-white text-xl md:text-2xl transition-colors text-center"
        >
          2 COINS - 2 LIVES
        </button>
        <button
          onClick={() => onStart(3)}
          className="text-green-400 hover:text-white text-xl md:text-2xl transition-colors text-center"
        >
          3 COINS - 3 LIVES
        </button>
      </div>

      <div className="text-gray-500 text-xs mt-12 text-center max-w-md leading-6">
        USE ARROW KEYS TO MOVE.
      </div>
    </div>
  );
};