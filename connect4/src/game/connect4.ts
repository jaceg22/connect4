// Connect 4 game logic module

export type Player = 1 | 2 | 0;
export type Board = Player[][]; // 6 rows x 7 columns

export const ROWS = 6;
export const COLS = 7;

export class Connect4 {
  board: Board;
  currentPlayer: Player;
  winner: Player | 'draw';
  moves: number;

  constructor() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.currentPlayer = 1;
    this.winner = 0;
    this.moves = 0;
  }

  clone(): Connect4 {
    const clone = new Connect4();
    clone.board = this.board.map(row => [...row]);
    clone.currentPlayer = this.currentPlayer;
    clone.winner = this.winner;
    clone.moves = this.moves;
    return clone;
  }

  getValidMoves(): number[] {
    return this.board[0].map((cell, col) => (cell === 0 ? col : -1)).filter(col => col !== -1);
  }

  makeMove(col: number): boolean {
    if (this.winner || col < 0 || col >= COLS || this.board[0][col] !== 0) return false;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (this.board[row][col] === 0) {
        this.board[row][col] = this.currentPlayer;
        this.moves++;
        if (this.checkWin(row, col)) {
          this.winner = this.currentPlayer;
        } else if (this.moves === ROWS * COLS) {
          this.winner = 'draw'; // Draw
        } else {
          this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        }
        return true;
      }
    }
    return false;
  }

  checkWin(row: number, col: number): boolean {
    const player = this.board[row][col];
    if (!player) return false;
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    for (const [dr, dc] of directions) {
      let count = 1;
      for (let d = 1; d < 4; d++) {
        const r = row + dr * d, c = col + dc * d;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || this.board[r][c] !== player) break;
        count++;
      }
      for (let d = 1; d < 4; d++) {
        const r = row - dr * d, c = col - dc * d;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || this.board[r][c] !== player) break;
        count++;
      }
      if (count >= 4) return true;
    }
    return false;
  }

  reset() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.currentPlayer = 1;
    this.winner = 0;
    this.moves = 0;
  }
} 