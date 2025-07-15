import { Connect4 } from './connect4';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

class GeminiAI {
  private apiKey: string;
  private model: string;
  private temperature: number;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
    this.temperature = parseFloat(import.meta.env.VITE_GEMINI_TEMP) || 0.1;
  }

  async getBestMove(game: Connect4, difficulty: 'easy' | 'hard'): Promise<number> {
    const validMoves = game.getValidMoves();
    if (validMoves.length === 0) return -1;
    const board = game.board;
    const player = game.currentPlayer; // 1 (Red) or 2 (Yellow)
    const opponent = player === 1 ? 2 : 1;

    if (difficulty === 'easy') {
      return await this.getEnhancedEasyMove(board, validMoves, player, opponent);
    } else {
      return await this.getEnhancedHardMove(board, validMoves, player, opponent);
    }
  }

  private async getEnhancedEasyMove(board: number[][], validMoves: number[], player: number, opponent: number): Promise<number> {
    // Create clear board visualization like in Python
    const boardVisual = this.createBoardVisual(board);
    
    // Check for basic opportunities
    const canWin = validMoves.some(col => isWinningMove(board, col, player));
    const mustBlock = validMoves.some(col => isWinningMove(board, col, opponent));
    
    // Build situation awareness
    let situation: string;
    if (canWin) {
      situation = "🟡 YOU CAN WIN! Look for your 3-in-a-row that you can extend to 4.";
    } else if (mustBlock) {
      situation = "🔴 OPPONENT CAN WIN NEXT TURN! You must find and block their 3-in-a-row.";
    } else {
      situation = "⚪ Build your position. Look for 2-in-a-row you can extend, or play center.";
    }

    const playerSymbol = player === 1 ? 'R' : 'Y';
    const opponentSymbol = player === 1 ? 'Y' : 'R';
    
    const prompt = `You are a Connect Four player as ${playerSymbol} (${player === 1 ? 'Red' : 'Yellow'}).

BOARD (row 0 = bottom where pieces land):
${boardVisual}

Available columns: ${validMoves.join(', ')}

CURRENT SITUATION:
${situation}

STRATEGY GUIDE:
1. ALWAYS win if you can (look for ${playerSymbol}${playerSymbol}${playerSymbol} that you can extend to ${playerSymbol}${playerSymbol}${playerSymbol}${playerSymbol})
2. ALWAYS block if opponent can win (look for ${opponentSymbol}${opponentSymbol}${opponentSymbol} that you must block)
3. Otherwise: Build connections (try to get ${playerSymbol}${playerSymbol} in a row) or control center (column 3)

EXAMPLES:
- If you see "${playerSymbol} ${playerSymbol} ${playerSymbol} ." anywhere → play the dot to win
- If you see "${opponentSymbol} ${opponentSymbol} ${opponentSymbol} ." anywhere → play the dot to block
- If you see "${playerSymbol} ${playerSymbol} . ." → extend to make ${playerSymbol}${playerSymbol}${playerSymbol}
- No immediate threats → play center (column 3) or near center

Look at the board carefully and make your move!

Explain your reasoning briefly, then respond with "MOVE: [column_number]".`;

    console.log('🤖 Easy Mode AI Prompt:');
    console.log('=====================================');
    console.log(prompt);
    console.log('=====================================');

    return await this.makeGeminiMove(prompt, validMoves);
  }

  private async getEnhancedHardMove(board: number[][], validMoves: number[], player: number, opponent: number): Promise<number> {
    // Use code to detect forced moves first
    const winningMoves = this.detectWinningMoves(board, validMoves, player);
    const blockingMoves = this.detectBlockingMoves(board, validMoves, opponent);
    
    console.log(`🔍 Analysis: Winning moves: ${winningMoves.join(', ') || 'none'}`);
    console.log(`🔍 Analysis: Blocking moves: ${blockingMoves.join(', ') || 'none'}`);
    
    const playerSymbol = player === 1 ? 'R' : 'Y';
    let prompt: string;
    
    // Handle forced moves (wins/blocks)
    if (winningMoves.length > 0) {
      const forcedCol = winningMoves[0];
      console.log(`🎯 FORCED WIN: Column ${forcedCol}`);
      prompt = `You are playing Connect 4 as ${playerSymbol} (${player === 1 ? 'Red' : 'Yellow'}) at expert level.
The analysis shows that column ${forcedCol} is the only correct move (winning move).

Think step by step:
1. Why is this move critical?
2. What happens if I don't play it?

Explain your reasoning briefly, then respond with "MOVE: ${forcedCol}".`;
      
      console.log('🤖 Hard Mode AI Prompt (FORCED WIN):');
      console.log('=====================================');
      console.log(prompt);
      console.log('=====================================');
      
      return await this.makeGeminiMove(prompt, validMoves);
    }
    
    if (blockingMoves.length > 0) {
      const forcedCol = blockingMoves[0];
      console.log(`🛡️ FORCED BLOCK: Column ${forcedCol}`);
      prompt = `You are playing Connect 4 as ${playerSymbol} (${player === 1 ? 'Red' : 'Yellow'}) at expert level.
The analysis shows that column ${forcedCol} is the only correct move (blocking opponent's win).

Think step by step:
1. Why is this move critical?
2. What happens if I don't play it?

Explain your reasoning briefly, then respond with "MOVE: ${forcedCol}".`;
      
      console.log('🤖 Hard Mode AI Prompt (FORCED BLOCK):');
      console.log('=====================================');
      console.log(prompt);
      console.log('=====================================');
      
      return await this.makeGeminiMove(prompt, validMoves);
    }
    
    // No forced moves - strategic play
    console.log('🎲 STRATEGIC PLAY: No forced moves detected');
    const boardVisual = this.createBoardVisual(board);
    
    prompt = `You are a Connect Four expert AI playing as ${playerSymbol} (${player === 1 ? 'Red' : 'Yellow'}).

BOARD (row 0 = bottom, pieces fall down):
${boardVisual}

Available columns: ${validMoves.join(', ')}

Play at an expert level. Think strategically about:
1. Immediate wins and threats
2. Creating multiple winning opportunities
3. Controlling center columns
4. Setting up future winning patterns
5. Blocking opponent's strategic positions

Analyze the position step by step, then choose the best column (0-6) and respond with your reasoning followed by "MOVE: [column_number]".`;

    console.log('🤖 Hard Mode AI Prompt (STRATEGIC):');
    console.log('=====================================');
    console.log(prompt);
    console.log('=====================================');

    const move = await this.makeGeminiMove(prompt, validMoves);
    
    // Fallback if Gemini fails completely
    if (move === -1) {
      console.log('🔄 Gemini failed, using center preference fallback');
      const centerPreference = [3, 2, 4, 1, 5, 0, 6];
      for (const col of centerPreference) {
        if (validMoves.includes(col)) {
          console.log(`🎯 Fallback move: Column ${col}`);
          return col;
        }
      }
      return validMoves[0];
    }
    
    return move;
  }

  private createBoardVisual(board: number[][]): string {
    let visual = "";
    for (let i = 0; i < board.length; i++) {
      const rowStr = board[i].map(cell => {
        if (cell === 0) return ".";
        if (cell === 1) return "R";
        return "Y";
      }).join(" ");
      visual += `${i}| ${rowStr}\n`;
    }
    visual += "   0 1 2 3 4 5 6";
    return visual;
  }

  private detectWinningMoves(board: number[][], validMoves: number[], player: number): number[] {
    const winningMoves: number[] = [];
    console.log(`🔍 Checking for player ${player} winning moves...`);
    
    for (const col of validMoves) {
      // Find where piece would drop
      let dropRow = -1;
      for (let row = 5; row >= 0; row--) {
        if (board[row][col] === 0) {
          dropRow = row;
          break;
        }
      }
      
      if (dropRow === -1) continue;
      
      // Temporarily place piece
      board[dropRow][col] = player;
      
      let winFound = false;
      
      // Check horizontal
      for (let startCol = Math.max(0, col - 3); startCol <= Math.min(3, col); startCol++) {
        if (startCol + 3 < 7) {
          if (board[dropRow][startCol] === player && 
              board[dropRow][startCol + 1] === player && 
              board[dropRow][startCol + 2] === player && 
              board[dropRow][startCol + 3] === player) {
            winFound = true;
            console.log(`🎯 Win found horizontally at row ${dropRow}, cols ${startCol}-${startCol + 3}`);
            break;
          }
        }
      }
      
      // Check vertical
      if (!winFound) {
        for (let startRow = Math.max(0, dropRow - 3); startRow <= Math.min(2, dropRow); startRow++) {
          if (startRow + 3 < 6) {
            if (board[startRow][col] === player && 
                board[startRow + 1][col] === player && 
                board[startRow + 2][col] === player && 
                board[startRow + 3][col] === player) {
              winFound = true;
              console.log(`🎯 Win found vertically at col ${col}, rows ${startRow}-${startRow + 3}`);
              break;
            }
          }
        }
      }
      
      // Check diagonal (top-left to bottom-right)
      if (!winFound) {
        for (let offset = -3; offset <= 0; offset++) {
          const startRow = dropRow + offset;
          const startCol = col + offset;
          if (startRow >= 0 && startRow <= 2 && startCol >= 0 && startCol <= 3) {
            if (board[startRow][startCol] === player && 
                board[startRow + 1][startCol + 1] === player && 
                board[startRow + 2][startCol + 2] === player && 
                board[startRow + 3][startCol + 3] === player) {
              winFound = true;
              console.log(`🎯 Win found diagonally (\\) at ${startRow},${startCol}`);
              break;
            }
          }
        }
      }
      
      // Check diagonal (top-right to bottom-left)
      if (!winFound) {
        for (let offset = -3; offset <= 0; offset++) {
          const startRow = dropRow + offset;
          const startCol = col - offset;
          if (startRow >= 0 && startRow <= 2 && startCol >= 3 && startCol <= 6) {
            if (board[startRow][startCol] === player && 
                board[startRow + 1][startCol - 1] === player && 
                board[startRow + 2][startCol - 2] === player && 
                board[startRow + 3][startCol - 3] === player) {
              winFound = true;
              console.log(`🎯 Win found diagonally (/) at ${startRow},${startCol}`);
              break;
            }
          }
        }
      }
      
      // Remove temporary piece
      board[dropRow][col] = 0;
      
      if (winFound) {
        winningMoves.push(col);
        console.log(`✅ WINNING MOVE FOUND: Column ${col}`);
      }
    }
    
    return winningMoves;
  }

  private detectBlockingMoves(board: number[][], validMoves: number[], opponent: number): number[] {
    const blockingMoves: number[] = [];
    console.log(`🔍 Checking for opponent ${opponent} threats that need blocking...`);
    
    for (const col of validMoves) {
      // Find where opponent piece would drop
      let dropRow = -1;
      for (let row = 5; row >= 0; row--) {
        if (board[row][col] === 0) {
          dropRow = row;
          break;
        }
      }
      
      if (dropRow === -1) continue;
      
      // Temporarily place opponent piece
      board[dropRow][col] = opponent;
      
      let threatFound = false;
      
      // Check horizontal
      for (let startCol = Math.max(0, col - 3); startCol <= Math.min(3, col); startCol++) {
        if (startCol + 3 < 7) {
          if (board[dropRow][startCol] === opponent && 
              board[dropRow][startCol + 1] === opponent && 
              board[dropRow][startCol + 2] === opponent && 
              board[dropRow][startCol + 3] === opponent) {
            threatFound = true;
            console.log(`🚨 Horizontal threat at row ${dropRow}, cols ${startCol}-${startCol + 3}`);
            break;
          }
        }
      }
      
      // Check vertical
      if (!threatFound) {
        for (let startRow = Math.max(0, dropRow - 3); startRow <= Math.min(2, dropRow); startRow++) {
          if (startRow + 3 < 6) {
            if (board[startRow][col] === opponent && 
                board[startRow + 1][col] === opponent && 
                board[startRow + 2][col] === opponent && 
                board[startRow + 3][col] === opponent) {
              threatFound = true;
              console.log(`🚨 Vertical threat at col ${col}, rows ${startRow}-${startRow + 3}`);
              break;
            }
          }
        }
      }
      
      // Check diagonal (top-left to bottom-right)
      if (!threatFound) {
        for (let offset = -3; offset <= 0; offset++) {
          const startRow = dropRow + offset;
          const startCol = col + offset;
          if (startRow >= 0 && startRow <= 2 && startCol >= 0 && startCol <= 3) {
            if (board[startRow][startCol] === opponent && 
                board[startRow + 1][startCol + 1] === opponent && 
                board[startRow + 2][startCol + 2] === opponent && 
                board[startRow + 3][startCol + 3] === opponent) {
              threatFound = true;
              console.log(`🚨 Diagonal threat (\\) at ${startRow},${startCol}`);
              break;
            }
          }
        }
      }
      
      // Check diagonal (top-right to bottom-left)
      if (!threatFound) {
        for (let offset = -3; offset <= 0; offset++) {
          const startRow = dropRow + offset;
          const startCol = col - offset;
          if (startRow >= 0 && startRow <= 2 && startCol >= 3 && startCol <= 6) {
            if (board[startRow][startCol] === opponent && 
                board[startRow + 1][startCol - 1] === opponent && 
                board[startRow + 2][startCol - 2] === opponent && 
                board[startRow + 3][startCol - 3] === opponent) {
              threatFound = true;
              console.log(`🚨 Diagonal threat (/) at ${startRow},${startCol}`);
              break;
            }
          }
        }
      }
      
      // Remove temporary piece
      board[dropRow][col] = 0;
      
      if (threatFound) {
        blockingMoves.push(col);
        console.log(`🛡️ BLOCKING MOVE REQUIRED: Column ${col}`);
      }
    }
    
    // Also check for 2-in-a-row horizontal threats with spaces on both sides
    console.log(`🔍 Checking for 2-in-a-row horizontal threats...`);
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col <= 3; col++) {
        // Pattern: empty, opponent, opponent, empty (. O O .)
        if (col + 3 < 7 && 
            board[row][col] === 0 && 
            board[row][col + 1] === opponent && 
            board[row][col + 2] === opponent && 
            board[row][col + 3] === 0) {
          
          console.log(`🔍 Found 2-in-a-row horizontal threat at row ${row}, cols ${col}-${col + 3}`);
          
          const leftCol = col;
          const rightCol = col + 3;
          
          // Must be able to drop piece (either bottom row or has support)
          const leftValid = validMoves.includes(leftCol) && 
                           (row === 5 || board[row + 1][leftCol] !== 0);
          const rightValid = validMoves.includes(rightCol) && 
                            (row === 5 || board[row + 1][rightCol] !== 0);
          
          // Must have at least 2 spaces on one side for guaranteed win setup
          const leftHasSpace = (col > 0 && board[row][col - 1] === 0);
          const rightHasSpace = (col + 4 < 7 && board[row][col + 4] === 0);
          
          console.log(`🔍 Left col ${leftCol} valid: ${leftValid}, has space: ${leftHasSpace}`);
          console.log(`🔍 Right col ${rightCol} valid: ${rightValid}, has space: ${rightHasSpace}`);
          
          // Block the side that creates immediate threat (next to opponent pieces)
          if (leftValid && (leftHasSpace || rightHasSpace)) {
            blockingMoves.push(leftCol);
            console.log(`🛡️ BLOCKING 2-in-a-row threat at column ${leftCol}`);
          } else if (rightValid && (leftHasSpace || rightHasSpace)) {
            blockingMoves.push(rightCol);
            console.log(`🛡️ BLOCKING 2-in-a-row threat at column ${rightCol}`);
          }
        }
      }
    }
    
    return blockingMoves;
  }

  private async makeGeminiMove(prompt: string, validMoves: number[]): Promise<number> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: 200,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text || '';
      
      console.log('🧠 Gemini AI Reasoning:');
      console.log('=====================================');
      console.log(text);
      console.log('=====================================');

      const move = this.parseMove(text, validMoves);
      if (move !== -1) {
        console.log(`✅ Final Move Selected: Column ${move}`);
        return move;
      } else {
        console.log('⚠️ Failed to parse valid move from Gemini response');
        return -1; // Signal failure to calling method
      }
    } catch (error) {
      console.error('❌ Gemini AI error:', error);
      // Fallback: center preference then random
      const centerPreference = [3, 2, 4, 1, 5, 0, 6];
      for (const col of centerPreference) {
        if (validMoves.includes(col)) {
          console.log(`🔄 Fallback move: Column ${col} (center preference)`);
          return col;
        }
      }
      const fallbackMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      console.log(`🎲 Fallback move: Column ${fallbackMove} (random)`);
      return fallbackMove;
    }
  }

  private parseMove(text: string, validMoves: number[]): number {
    // First try to find "MOVE: X" pattern
    const moveMatch = text.match(/MOVE:\s*(\d+)/i);
    if (moveMatch) {
      const move = parseInt(moveMatch[1]);
      if (validMoves.includes(move)) {
        return move;
      }
    }
    
    // Fallback to any number in the text
    const matches = text.match(/\d+/g);
    if (matches) {
      for (const match of matches) {
        const move = parseInt(match);
        if (validMoves.includes(move)) {
          return move;
        }
      }
    }
    
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
}

// Helper: check if dropping a piece in col for player results in a win
function isWinningMove(board: number[][], col: number, player: number): boolean {
  // Find the row where the piece would land
  let row = -1;
  for (let r = board.length - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      row = r;
      break;
    }
  }
  if (row === -1) return false;
  // Temporarily place the piece
  board[row][col] = player;
  const win = checkWin(board, row, col, player);
  board[row][col] = 0; // Undo
  return win;
}
// Helper: check win condition for a given cell
function checkWin(board: number[][], row: number, col: number, player: number): boolean {
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1]
  ];
  for (const [dr, dc] of directions) {
    let count = 1;
    for (let d = 1; d < 4; d++) {
      const r = row + dr * d, c = col + dc * d;
      if (r < 0 || r >= 6 || c < 0 || c >= 7 || board[r][c] !== player) break;
      count++;
    }
    for (let d = 1; d < 4; d++) {
      const r = row - dr * d, c = col - dc * d;
      if (r < 0 || r >= 6 || c < 0 || c >= 7 || board[r][c] !== player) break;
      count++;
    }
    if (count >= 4) return true;
  }
  return false;
}

export const geminiAI = new GeminiAI();