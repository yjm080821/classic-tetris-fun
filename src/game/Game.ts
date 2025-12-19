/**
 * Game 클래스: 테트리스 게임 전체 로직 관리
 * 게임 상태, 점수, 레벨, 블록 생성 등을 담당합니다.
 */

import { Board, Cell } from './Board';
import { Piece, createRandomPiece } from './Piece';
import {
  LEVEL_SPEEDS,
  LINE_POINTS,
  LINES_PER_LEVEL,
  SOFT_DROP_POINTS,
  HARD_DROP_POINTS,
} from './constants';

// 게임 상태 타입
export type GameState = 'ready' | 'playing' | 'paused' | 'gameOver';

export class Game {
  // 게임 보드
  board: Board;
  
  // 현재 움직이는 블록
  currentPiece: Piece | null = null;
  
  // 홀드된 블록
  holdPiece: Piece | null = null;
  
  // 이번 턴에 홀드를 사용했는지 (한 턴에 한 번만 홀드 가능)
  canHold: boolean = true;
  
  // 다음 블록들 (미리보기용)
  nextPieces: Piece[] = [];
  
  // 게임 상태
  state: GameState = 'ready';
  
  // 점수
  score: number = 0;
  
  // 현재 레벨
  level: number = 0;
  
  // 지운 라인 수
  lines: number = 0;
  
  // 마지막 업데이트 시간 (낙하 타이밍용)
  lastDropTime: number = 0;
  
  // 낙하 간격 (밀리초)
  dropInterval: number = LEVEL_SPEEDS[0];

  constructor() {
    this.board = new Board();
    this.initNextPieces();
  }

  /**
   * 다음 블록들 초기화 (3개 생성)
   */
  initNextPieces(): void {
    this.nextPieces = [];
    for (let i = 0; i < 3; i++) {
      this.nextPieces.push(createRandomPiece());
    }
  }

  /**
   * 게임 시작
   */
  start(): void {
    this.reset();
    this.state = 'playing';
    this.spawnPiece();
    this.lastDropTime = Date.now();
  }

  /**
   * 게임 리셋
   */
  reset(): void {
    this.board.reset();
    this.currentPiece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.score = 0;
    this.level = 0;
    this.lines = 0;
    this.dropInterval = LEVEL_SPEEDS[0];
    this.initNextPieces();
  }

  /**
   * 새 블록 생성 (스폰)
   */
  spawnPiece(): boolean {
    // 다음 블록 큐에서 가져오기
    this.currentPiece = this.nextPieces.shift() || createRandomPiece();
    
    // 새 블록을 큐에 추가
    this.nextPieces.push(createRandomPiece());
    
    // 홀드 가능 상태로 변경
    this.canHold = true;

    // 스폰 위치가 유효한지 확인 (게임 오버 체크)
    if (!this.board.isValidPosition(this.currentPiece)) {
      this.state = 'gameOver';
      return false;
    }

    return true;
  }

  /**
   * 일시정지 토글
   */
  togglePause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.lastDropTime = Date.now();
    }
  }

  /**
   * 블록 왼쪽 이동
   */
  moveLeft(): boolean {
    if (this.state !== 'playing' || !this.currentPiece) return false;

    if (this.board.isValidPosition(this.currentPiece, -1, 0)) {
      this.currentPiece.moveLeft();
      return true;
    }
    return false;
  }

  /**
   * 블록 오른쪽 이동
   */
  moveRight(): boolean {
    if (this.state !== 'playing' || !this.currentPiece) return false;

    if (this.board.isValidPosition(this.currentPiece, 1, 0)) {
      this.currentPiece.moveRight();
      return true;
    }
    return false;
  }

  /**
   * 블록 아래로 이동 (소프트 드롭)
   */
  moveDown(): boolean {
    if (this.state !== 'playing' || !this.currentPiece) return false;

    if (this.board.isValidPosition(this.currentPiece, 0, 1)) {
      this.currentPiece.moveDown();
      this.score += SOFT_DROP_POINTS;
      return true;
    } else {
      // 더 이상 내려갈 수 없으면 블록 고정
      this.lockCurrentPiece();
      return false;
    }
  }

  /**
   * 블록 회전
   * Wall Kick: 벽에 부딪히면 옆으로 밀어서 회전 시도
   */
  rotate(): boolean {
    if (this.state !== 'playing' || !this.currentPiece) return false;

    const rotatedShape = this.currentPiece.rotate();

    // 기본 회전 시도
    if (this.board.isValidPosition(this.currentPiece, 0, 0, rotatedShape)) {
      this.currentPiece.applyRotation();
      return true;
    }

    // Wall Kick 시도 (좌우로 1~2칸 밀어보기)
    const kicks = [1, -1, 2, -2];
    for (const kick of kicks) {
      if (this.board.isValidPosition(this.currentPiece, kick, 0, rotatedShape)) {
        this.currentPiece.x += kick;
        this.currentPiece.applyRotation();
        return true;
      }
    }

    return false;
  }

  /**
   * 하드 드롭 (즉시 바닥으로)
   */
  hardDrop(): void {
    if (this.state !== 'playing' || !this.currentPiece) return;

    let dropDistance = 0;

    // 바닥까지 내리기
    while (this.board.isValidPosition(this.currentPiece, 0, 1)) {
      this.currentPiece.moveDown();
      dropDistance++;
    }

    // 하드드롭 점수 추가
    this.score += dropDistance * HARD_DROP_POINTS;

    // 블록 고정
    this.lockCurrentPiece();
  }

  /**
   * 홀드 기능
   * 현재 블록을 보관하고 홀드된 블록과 교체
   */
  hold(): boolean {
    if (this.state !== 'playing' || !this.currentPiece || !this.canHold) {
      return false;
    }

    // 홀드 사용 불가로 설정 (한 턴에 한 번만)
    this.canHold = false;

    if (this.holdPiece === null) {
      // 처음 홀드: 현재 블록 저장하고 새 블록 생성
      this.holdPiece = new Piece(this.currentPiece.type);
      this.spawnPiece();
    } else {
      // 교체: 홀드된 블록과 현재 블록 교환
      const temp = this.currentPiece.type;
      this.currentPiece = new Piece(this.holdPiece.type);
      this.holdPiece = new Piece(temp);
    }

    return true;
  }

  /**
   * 현재 블록 고정 및 라인 클리어 처리
   */
  lockCurrentPiece(): void {
    if (!this.currentPiece) return;

    // 보드에 블록 고정
    this.board.lockPiece(this.currentPiece);

    // 완성된 라인 찾기
    const completedLines = this.board.findCompleteLines();

    if (completedLines.length > 0) {
      // 라인 클리어
      this.board.clearLines(completedLines);

      // 점수 추가 (레벨에 따른 보너스)
      this.score += LINE_POINTS[completedLines.length] * (this.level + 1);

      // 라인 수 업데이트
      this.lines += completedLines.length;

      // 레벨업 체크
      const newLevel = Math.floor(this.lines / LINES_PER_LEVEL);
      if (newLevel > this.level) {
        this.level = newLevel;
        // 낙하 속도 업데이트
        this.dropInterval = LEVEL_SPEEDS[Math.min(this.level, LEVEL_SPEEDS.length - 1)];
      }
    }

    // 새 블록 생성
    this.spawnPiece();
  }

  /**
   * 게임 업데이트 (매 프레임 호출)
   * 자동 낙하 처리
   */
  update(): void {
    if (this.state !== 'playing') return;

    const now = Date.now();
    
    // 낙하 시간이 됐으면 블록 내리기
    if (now - this.lastDropTime >= this.dropInterval) {
      this.moveDown();
      this.lastDropTime = now;
    }
  }

  /**
   * 현재 보드 상태 가져오기 (렌더링용)
   * 고정된 블록 + 현재 블록 + 고스트 블록을 합친 상태
   */
  getBoardState(): { grid: Cell[][]; ghostY: number } {
    const ghostY = this.currentPiece 
      ? this.board.getGhostPosition(this.currentPiece) 
      : 0;

    return {
      grid: this.board.grid,
      ghostY,
    };
  }
}

