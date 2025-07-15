import { Connect4 } from '../game/connect4';
import type { Player } from '../game/connect4';

//  Utility function 
export function evaluateBoard(game: Connect4, player: Player): number {
  if (game.winner === player) return 1000;
  if (game.winner === 'draw') return 0;
  if (game.winner && game.winner !== player) return -1000;
  return 0;
}

//  Minimax 
export function minimax(game: Connect4, depth: number, maximizingPlayer: boolean, player: Player): number {
  if (game.winner || depth === 0) {
    return evaluateBoard(game, player);
  }

  const moves = game.getValidMoves();
  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newGame = game.clone();
      newGame.makeMove(move);
      const evalScore = minimax(newGame, depth - 1, false, player);
      maxEval = Math.max(maxEval, evalScore);
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newGame = game.clone();
      newGame.makeMove(move);
      const evalScore = minimax(newGame, depth - 1, true, player);
      minEval = Math.min(minEval, evalScore);
    }
    return minEval;
  }
}

export function getBestMoveMinimax(game: Connect4, depth: number): number {
  const player = game.currentPlayer;
  let bestScore = -Infinity;
  let bestMove = -1;
  for (const move of game.getValidMoves()) {
    const newGame = game.clone();
    newGame.makeMove(move);
    const score = minimax(newGame, depth - 1, false, player);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

//  Alpha-Beta Pruning 
export function alphabeta(game: Connect4, depth: number, alpha: number, beta: number, maximizingPlayer: boolean, player: Player): number {
  if (game.winner || depth === 0) {
    return evaluateBoard(game, player);
  }

  const moves = game.getValidMoves();
  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newGame = game.clone();
      newGame.makeMove(move);
      const evalScore = alphabeta(newGame, depth - 1, alpha, beta, false, player);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // prune
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newGame = game.clone();
      newGame.makeMove(move);
      const evalScore = alphabeta(newGame, depth - 1, alpha, beta, true, player);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // prune
    }
    return minEval;
  }
}

export function getBestMoveAlphaBeta(game: Connect4, depth: number): number {
  const player = game.currentPlayer;
  let bestScore = -Infinity;
  let bestMove = -1;
  for (const move of game.getValidMoves()) {
    const newGame = game.clone();
    newGame.makeMove(move);
    const score = alphabeta(newGame, depth - 1, -Infinity, Infinity, false, player);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

//  Expectiminimax 
export function expectiminimax(
  game: Connect4,
  depth: number,
  nodeType: 'max' | 'min' | 'chance',
  player: Player
): number {
  if (game.winner || depth === 0) {
    return evaluateBoard(game, player);
  }

  const moves = game.getValidMoves();
  if (nodeType === 'max') {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newGame = game.clone();
      newGame.makeMove(move);
      const evalScore = expectiminimax(newGame, depth - 1, 'min', player);
      maxEval = Math.max(maxEval, evalScore);
    }
    return maxEval;
  } else if (nodeType === 'min') {
    let minEval = Infinity;
    for (const move of moves) {
      const newGame = game.clone();
      newGame.makeMove(move);
      const evalScore = expectiminimax(newGame, depth - 1, 'max', player);
      minEval = Math.min(minEval, evalScore);
    }
    return minEval;
  } else {
    // Chance node 
    let total = 0;
    for (const move of moves) {
      const newGame = game.clone();
      newGame.makeMove(move);
      total += expectiminimax(newGame, depth - 1, 'max', player);
    }
    return total / moves.length;
  }
}

export function getBestMoveExpectiminimax(game: Connect4, depth: number): number {
  const player = game.currentPlayer;
  let bestScore = -Infinity;
  let bestMove = -1;
  for (const move of game.getValidMoves()) {
    const newGame = game.clone();
    newGame.makeMove(move);
    const score = expectiminimax(newGame, depth - 1, 'min', player);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}
