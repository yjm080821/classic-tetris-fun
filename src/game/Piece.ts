/**
 * Piece 클래스: 테트로미노(블록) 관리
 * 현재 움직이는 블록의 위치, 회전, 이동을 담당합니다.
 */

import { TetrominoType, TETROMINOES, TETROMINO_COLORS, BOARD_WIDTH } from './constants';

export class Piece {
  // 블록의 타입 (I, O, T, S, Z, J, L 중 하나)
  type: TetrominoType;
  
  // 블록의 현재 모양 (2차원 배열)
  shape: number[][];
  
  // 블록의 위치 (보드 좌표 기준)
  x: number;
  y: number;
  
  // 블록의 색상
  color: string;

  constructor(type: TetrominoType) {
    this.type = type;
    // 원본 배열을 복사하여 사용 (깊은 복사)
    this.shape = TETROMINOES[type].map(row => [...row]);
    this.color = TETROMINO_COLORS[type];
    
    // 블록을 보드 중앙 상단에 배치
    this.x = Math.floor((BOARD_WIDTH - this.shape[0].length) / 2);
    this.y = 0;
  }

  /**
   * 블록을 시계 방향으로 90도 회전
   * 2차원 배열을 회전시키는 알고리즘을 사용합니다.
   */
  rotate(): number[][] {
    const rows = this.shape.length;
    const cols = this.shape[0].length;
    
    // 새로운 회전된 배열 생성
    const rotated: number[][] = [];
    
    for (let col = 0; col < cols; col++) {
      const newRow: number[] = [];
      for (let row = rows - 1; row >= 0; row--) {
        newRow.push(this.shape[row][col]);
      }
      rotated.push(newRow);
    }
    
    return rotated;
  }

  /**
   * 실제로 블록을 회전 적용
   */
  applyRotation(): void {
    this.shape = this.rotate();
  }

  /**
   * 블록을 왼쪽으로 이동
   */
  moveLeft(): void {
    this.x -= 1;
  }

  /**
   * 블록을 오른쪽으로 이동
   */
  moveRight(): void {
    this.x += 1;
  }

  /**
   * 블록을 아래로 이동
   */
  moveDown(): void {
    this.y += 1;
  }

  /**
   * 블록 복제 (미리보기용)
   */
  clone(): Piece {
    const cloned = new Piece(this.type);
    cloned.x = this.x;
    cloned.y = this.y;
    cloned.shape = this.shape.map(row => [...row]);
    return cloned;
  }
}

/**
 * 랜덤 테트로미노 타입 생성
 * 7-bag 시스템: 7개의 블록을 한 세트로 섞어서 제공
 * 이 방식은 같은 블록이 연속으로 나오는 것을 방지합니다.
 */
export function getRandomPieceType(): TetrominoType {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * 새 테트로미노 생성
 */
export function createRandomPiece(): Piece {
  return new Piece(getRandomPieceType());
}
