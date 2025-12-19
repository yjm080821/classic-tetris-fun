/**
 * TetrisGame 컴포넌트: 테트리스 게임 메인 컴포넌트
 * 캔버스 렌더링, 키보드/터치 입력, 게임 UI를 담당합니다.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Game, GameState } from '@/game/Game';
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, TETROMINO_COLORS, TetrominoType } from '@/game/constants';
import { Piece } from '@/game/Piece';
import { 
  Play, 
  Pause, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  ArrowDown, 
  ChevronDown,
  Square
} from 'lucide-react';

// 캔버스 크기 계산
const CANVAS_WIDTH = BOARD_WIDTH * CELL_SIZE;
const CANVAS_HEIGHT = BOARD_HEIGHT * CELL_SIZE;

export function TetrisGame() {
  // 캔버스 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 게임 인스턴스 참조 (리렌더링 없이 유지)
  const gameRef = useRef<Game>(new Game());
  
  // UI 업데이트용 상태
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [lines, setLines] = useState(0);
  const [nextPieces, setNextPieces] = useState<Piece[]>([]);
  const [holdPiece, setHoldPiece] = useState<Piece | null>(null);
  
  // 애니메이션 프레임 ID
  const animationFrameRef = useRef<number>();

  /**
   * 보드 렌더링 함수
   * 캔버스에 게임 상태를 그립니다.
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const game = gameRef.current;

    if (!canvas || !ctx) return;

    // 배경 그리기
    ctx.fillStyle = 'hsl(240, 20%, 6%)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 격자 그리기
    ctx.strokeStyle = 'hsl(180, 50%, 15%)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }

    // 고정된 블록 그리기
    const { grid, ghostY } = game.getBoardState();
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (grid[y][x]) {
          drawBlock(ctx, x, y, grid[y][x]!);
        }
      }
    }

    // 고스트 피스 그리기 (반투명)
    if (game.currentPiece && game.state === 'playing') {
      const ghostPiece = game.currentPiece;
      for (let row = 0; row < ghostPiece.shape.length; row++) {
        for (let col = 0; col < ghostPiece.shape[row].length; col++) {
          if (ghostPiece.shape[row][col]) {
            const x = ghostPiece.x + col;
            const y = ghostPiece.y + ghostY + row;
            if (y >= 0) {
              drawBlock(ctx, x, y, ghostPiece.color, 0.2);
            }
          }
        }
      }
    }

    // 현재 블록 그리기
    if (game.currentPiece) {
      for (let row = 0; row < game.currentPiece.shape.length; row++) {
        for (let col = 0; col < game.currentPiece.shape[row].length; col++) {
          if (game.currentPiece.shape[row][col]) {
            const x = game.currentPiece.x + col;
            const y = game.currentPiece.y + row;
            if (y >= 0) {
              drawBlock(ctx, x, y, game.currentPiece.color);
            }
          }
        }
      }
    }

    // 일시정지/게임오버 오버레이
    if (game.state === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'hsl(180, 100%, 50%)';
      ctx.font = '16px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    if (game.state === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'hsl(0, 100%, 50%)';
      ctx.font = '14px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillStyle = 'hsl(180, 100%, 50%)';
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText('Press R to', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillText('Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
  }, []);

  /**
   * 블록 그리기 헬퍼 함수
   */
  const drawBlock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    alpha: number = 1
  ) => {
    const padding = 1;
    const size = CELL_SIZE - padding * 2;

    ctx.globalAlpha = alpha;

    // 메인 블록
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL_SIZE + padding, y * CELL_SIZE + padding, size, size);

    // 하이라이트 (3D 효과)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x * CELL_SIZE + padding, y * CELL_SIZE + padding, size, 3);
    ctx.fillRect(x * CELL_SIZE + padding, y * CELL_SIZE + padding, 3, size);

    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x * CELL_SIZE + padding, y * CELL_SIZE + size - 2, size, 3);
    ctx.fillRect(x * CELL_SIZE + size - 2, y * CELL_SIZE + padding, 3, size);

    // 글로우 효과
    if (alpha === 1) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'transparent';
      ctx.fillRect(x * CELL_SIZE + padding, y * CELL_SIZE + padding, size, size);
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
  };

  /**
   * 게임 루프
   */
  const gameLoop = useCallback(() => {
    const game = gameRef.current;
    
    // 게임 상태 업데이트
    game.update();
    
    // UI 상태 동기화
    setGameState(game.state);
    setScore(game.score);
    setLevel(game.level);
    setLines(game.lines);
    setNextPieces([...game.nextPieces]);
    setHoldPiece(game.holdPiece);
    
    // 렌더링
    render();
    
    // 다음 프레임 요청
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [render]);

  /**
   * 게임 시작
   */
  const startGame = useCallback(() => {
    gameRef.current.start();
  }, []);

  /**
   * 키보드 입력 처리
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const game = gameRef.current;

      // 게임 시작 전에는 일부 키만 허용
      if (game.state === 'ready') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          game.moveLeft();
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          game.moveRight();
          break;
        case 'arrowdown':
        case 's':
          e.preventDefault();
          game.moveDown();
          break;
        case 'arrowup':
        case 'w':
        case 'x':
          e.preventDefault();
          game.rotate();
          break;
        case ' ':
          e.preventDefault();
          game.hardDrop();
          break;
        case 'c':
          e.preventDefault();
          game.hold();
          break;
        case 'p':
          e.preventDefault();
          game.togglePause();
          break;
        case 'r':
          e.preventDefault();
          if (game.state === 'gameOver' || game.state === 'paused') {
            startGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame]);

  /**
   * 게임 루프 시작/정지
   */
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  /**
   * 모바일 버튼 핸들러
   */
  const handleMobileControl = (action: string) => {
    const game = gameRef.current;
    
    if (game.state === 'ready' && action === 'start') {
      startGame();
      return;
    }

    switch (action) {
      case 'left':
        game.moveLeft();
        break;
      case 'right':
        game.moveRight();
        break;
      case 'down':
        game.moveDown();
        break;
      case 'rotate':
        game.rotate();
        break;
      case 'drop':
        game.hardDrop();
        break;
      case 'hold':
        game.hold();
        break;
      case 'pause':
        game.togglePause();
        break;
    }
  };

  /**
   * 미니 블록 렌더링 (다음/홀드 미리보기용)
   */
  const renderMiniPiece = (piece: Piece | null, size: number = 16) => {
    if (!piece) {
      return (
        <div 
          className="flex items-center justify-center"
          style={{ width: size * 4, height: size * 4 }}
        >
          <span className="text-muted-foreground text-xs">-</span>
        </div>
      );
    }

    const color = TETROMINO_COLORS[piece.type as TetrominoType];
    
    return (
      <div 
        className="grid gap-0.5"
        style={{ 
          gridTemplateColumns: `repeat(${piece.shape[0].length}, ${size}px)`,
        }}
      >
        {piece.shape.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className="rounded-sm"
              style={{
                width: size,
                height: size,
                backgroundColor: cell ? color : 'transparent',
                boxShadow: cell ? `0 0 8px ${color}` : 'none',
              }}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-8 p-4">
      {/* 왼쪽 패널: 홀드 & 컨트롤 안내 */}
      <div className="flex flex-row lg:flex-col gap-4">
        {/* 홀드 영역 */}
        <div className="stat-display">
          <h3 className="font-arcade text-[10px] text-primary mb-2 text-glow-cyan">HOLD</h3>
          <div className="flex items-center justify-center min-h-[64px] min-w-[64px]">
            {renderMiniPiece(holdPiece)}
          </div>
        </div>

        {/* 키 안내 (데스크톱) */}
        <div className="hidden md:block stat-display">
          <h3 className="font-arcade text-[10px] text-primary mb-3 text-glow-cyan">CONTROLS</h3>
          <div className="space-y-1.5 text-[8px] font-tech text-muted-foreground">
            <div className="flex justify-between gap-3">
              <span>←→</span>
              <span>Move</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>↓</span>
              <span>Soft Drop</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Space</span>
              <span>Hard Drop</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>↑/X</span>
              <span>Rotate</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>C</span>
              <span>Hold</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>P</span>
              <span>Pause</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>R</span>
              <span>Restart</span>
            </div>
          </div>
        </div>
      </div>

      {/* 중앙: 게임 보드 */}
      <div className="flex flex-col items-center gap-4">
        <div className="arcade-border rounded-lg p-1 bg-card/50 backdrop-blur-sm">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block"
          />
          <div className="scanlines rounded-lg" />
        </div>

        {/* 시작 버튼 */}
        {gameState === 'ready' && (
          <button
            onClick={startGame}
            className="arcade-button animate-pulse-glow"
          >
            <Play className="inline-block w-4 h-4 mr-2" />
            Press Enter to Start
          </button>
        )}

        {/* 모바일 컨트롤 */}
        <div className="md:hidden flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <button
              className="mobile-control-btn"
              onTouchStart={() => handleMobileControl('rotate')}
              onClick={() => handleMobileControl('rotate')}
            >
              <RotateCw className="w-6 h-6" />
            </button>
            <button
              className="mobile-control-btn"
              onTouchStart={() => handleMobileControl('hold')}
              onClick={() => handleMobileControl('hold')}
            >
              <Square className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="mobile-control-btn"
              onTouchStart={() => handleMobileControl('left')}
              onClick={() => handleMobileControl('left')}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              className="mobile-control-btn"
              onTouchStart={() => handleMobileControl('down')}
              onClick={() => handleMobileControl('down')}
            >
              <ArrowDown className="w-6 h-6" />
            </button>
            <button
              className="mobile-control-btn"
              onTouchStart={() => handleMobileControl('right')}
              onClick={() => handleMobileControl('right')}
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="mobile-control-btn w-32"
              onTouchStart={() => handleMobileControl('drop')}
              onClick={() => handleMobileControl('drop')}
            >
              <ChevronDown className="w-6 h-6" />
              <ChevronDown className="w-6 h-6 -ml-3" />
            </button>
            <button
              className="mobile-control-btn"
              onClick={() => handleMobileControl('pause')}
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽 패널: 점수 & 다음 블록 */}
      <div className="flex flex-row lg:flex-col gap-4">
        {/* 점수/레벨/라인 */}
        <div className="stat-display min-w-[100px]">
          <div className="space-y-3">
            <div>
              <h3 className="font-arcade text-[8px] text-muted-foreground mb-1">SCORE</h3>
              <p className="font-arcade text-sm text-primary text-glow-cyan">
                {score.toString().padStart(6, '0')}
              </p>
            </div>
            <div>
              <h3 className="font-arcade text-[8px] text-muted-foreground mb-1">LEVEL</h3>
              <p className="font-arcade text-sm text-secondary text-glow-pink">
                {level}
              </p>
            </div>
            <div>
              <h3 className="font-arcade text-[8px] text-muted-foreground mb-1">LINES</h3>
              <p className="font-arcade text-sm text-accent">
                {lines}
              </p>
            </div>
          </div>
        </div>

        {/* 다음 블록 미리보기 */}
        <div className="stat-display">
          <h3 className="font-arcade text-[10px] text-primary mb-2 text-glow-cyan">NEXT</h3>
          <div className="space-y-3">
            {nextPieces.slice(0, 3).map((piece, index) => (
              <div 
                key={index} 
                className="flex items-center justify-center"
                style={{ opacity: 1 - index * 0.2 }}
              >
                {renderMiniPiece(piece, index === 0 ? 14 : 10)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
