import { useState, useEffect } from 'react';
import { Connect4 } from './game/connect4';
import { Board } from './components/Board';
import {
  getBestMoveMinimax,
  getBestMoveAlphaBeta,
  getBestMoveExpectiminimax
} from './algorithms/algorithms';
import { geminiAI } from './game/geminiAI';
import './App.css';

const gameInstance = new Connect4();

function App() {
  const [game, setGame] = useState(() => gameInstance.clone());
  const [algorithm, setAlgorithm] = useState('alphabeta');
  const [difficulty, setDifficulty] = useState<number | string>(4);
  const [isAIThinking, setIsAIThinking] = useState(false);

  const handleColumnClick = async (col: number) => {
    if (game.winner || game.currentPlayer !== 1 || isAIThinking) return;

    const newGame = game.clone();
    if (newGame.makeMove(col)) {
      setGame(newGame);

      if (newGame.winner) {
        return;
      }

      // AI Turn
      setIsAIThinking(true);
      setTimeout(async () => {
        const aiGame = newGame.clone();
        if (!aiGame.winner && aiGame.currentPlayer === 2) {
          const aiMove = await getAIMove(aiGame);
          aiGame.makeMove(aiMove);
          setGame(aiGame);
        }
        setIsAIThinking(false);
      }, 300);
    }
  };

  const handleReset = () => {
    const newGame = game.clone();
    newGame.reset();
    setGame(newGame);
  };


  const getAIMove = async (state: Connect4): Promise<number> => {
    if (algorithm === 'gemini') {
      const aiDifficulty = difficulty as 'easy' | 'hard';
      return await geminiAI.getBestMove(state, aiDifficulty);
    }
    
    const numericDifficulty = difficulty as number;
    switch (algorithm) {
      case 'minimax':
        return getBestMoveMinimax(state, numericDifficulty);
      case 'alphabeta':
        return getBestMoveAlphaBeta(state, numericDifficulty);
      case 'expectiminimax':
        return getBestMoveExpectiminimax(state, numericDifficulty);
      default:
        return getBestMoveAlphaBeta(state, numericDifficulty);
    }
  };

  let status = '';
  if (game.winner === 'draw') {
    status = "It's a draw!";
  } else if (game.winner) {
    status = `Player ${game.winner} wins!`;
  } else if (isAIThinking && game.currentPlayer === 2) {
    status = 'AI is thinking...';
  } else {
    status = `Player ${game.currentPlayer}'s turn`;
  }


  useEffect(() => {
    // Reset difficulty when algorithm changes
    if (algorithm === 'gemini' && typeof difficulty === 'number') {
      setDifficulty('easy');
    } else if (algorithm !== 'gemini' && typeof difficulty === 'string') {
      setDifficulty(4);
    }
  }, [algorithm]);


  return (
    <div className="App" style={{ textAlign: 'center', marginTop: 40 }}>
      <h1>Connect 4</h1>
      <Board
        board={game.board}
        onColumnClick={handleColumnClick}
        winner={game.winner}
        algorithm={algorithm}
        difficulty={difficulty}
        onAlgorithmChange={setAlgorithm}
        onDifficultyChange={setDifficulty}
      />
      <div style={{ margin: '16px 0', fontSize: 20 }}>{status}</div>
      <button onClick={handleReset} style={{ padding: '8px 16px', fontSize: 16 }}>Reset</button>
    </div>
  );
}

export default App;
