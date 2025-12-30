import React from 'react';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onRestart }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 z-10 p-4 animate-fade-in">
      <h1 className="text-red-500 text-6xl md:text-7xl text-center leading-tight drop-shadow-[0_5px_5px_rgba(255,0,0,0.5)]">
        GAME OVER
      </h1>

      <div className="text-white text-3xl md:text-4xl text-center">
        SCORE<br/>
        <span className="text-yellow-400 mt-6 block">{score}</span>
      </div>

      <button
        onClick={onRestart}
        className="mt-8 text-cyan-400 hover:text-white text-xl md:text-2xl transition-colors border-2 border-cyan-400 hover:border-white px-6 py-4 rounded"
      >
        NEW GAME
      </button>
    </div>
  );
};