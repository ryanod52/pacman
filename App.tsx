import React, { useState } from 'react';
import { Game } from './components/Game';
import { StartScreen } from './components/StartScreen';
import { GameOverScreen } from './components/GameOverScreen';

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [initialLives, setInitialLives] = useState(3);
  const [finalScore, setFinalScore] = useState(0);

  const handleStartGame = (lives: number) => {
    setInitialLives(lives);
    setGameState('playing');
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState('gameover');
  };

  const handleRestart = () => {
    setGameState('start');
  };

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {gameState === 'start' && (
        <StartScreen onStart={handleStartGame} />
      )}
      {gameState === 'playing' && (
        <Game lives={initialLives} onGameOver={handleGameOver} />
      )}
      {gameState === 'gameover' && (
        <GameOverScreen score={finalScore} onRestart={handleRestart} />
      )}
    </div>
  );
}