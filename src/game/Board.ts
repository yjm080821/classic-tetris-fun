/**
 * Board 클래스: 테트리스 보드(게임판) 관리
 * 고정된 블록들의 상태, 충돌 감지, 라인 클리어를 담당합니다.
 */

import { BOARD_WIDTH, BOARD_HEIGHT } from './constants';
import { Piece } from './Piece';

// 보드의 각 셀 타입: null(빈 공간) 또는 색상 문자열
export type Cell = string | null;

export class Board {
  // 보드 상태: 2차원 배열로 각 셀의 색상을 저장
  grid: Cell[][];

  constructor() {
    // 빈 보드 생성 (모든 셀이 null)
    this.grid = this.createEmptyGrid();
  }

  /**
   * 빈 보드 생성
   * 20행 x 10열의 2차원 배열을 만듭니다.
   */
  createEmptyGrid(): Cell[][] {
    return Array.from({ length: BOARD_HEIGHT }, () =>
      Array.from({ length: BOARD_WIDTH }, () => null)
    );
  }

  /**
   * 보드 초기화 (게임 재시작 시 사용)
   */
  reset(): void {
    this.grid = this.createEmptyGrid();
  }

  /**
   * 특정 위치가 유효한지 확인
   * 보드 범위 내에 있고 빈 공간인지 체크합니다.
   */
  isValidPosition(piece: Piece, offsetX = 0, offsetY = 0, newShape?: number[][]): boolean {
    const shape = newShape || piece.shape;
    const newX = piece.x + offsetX;
    const newY = piece.y + offsetY;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        // 블록이 있는 위치만 체크
        if (shape[row][col]) {
          const boardX = newX + col;
          const boardY = newY + row;

          // 보드 경계 체크
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return false;
          }

          // 위쪽 경계는 음수 허용 (스폰 영역)
          if (boardY < 0) {
            continue;
          }

          // 다른 블록과 충돌 체크
          if (this.grid[boardY][boardX] !== null) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * 블록을 보드에 고정
   * 블록이 더 이상 내려갈 수 없을 때 호출됩니다.
   */
  lockPiece(piece: Piece): void {
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const boardX = piece.x + col;
          const boardY = piece.y + row;

          // 유효한 위치에만 고정
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            this.grid[boardY][boardX] = piece.color;
          }
        }
      }
    }
  }

  /**
   * 완성된 라인 찾기
   * 한 줄이 모두 채워지면 해당 행 번호를 반환합니다.
   */
  findCompleteLines(): number[] {
    const completeLines: number[] = [];

    for (let row = 0; row < BOARD_HEIGHT; row++) {
      // 해당 행의 모든 셀이 채워져 있는지 확인
      if (this.grid[row].every(cell => cell !== null)) {
        completeLines.push(row);
      }
    }

    return completeLines;
  }

  /**
   * 라인 제거
   * 완성된 라인을 제거하고 위의 블록들을 아래로 내립니다.
   */
  clearLines(lines: number[]): number {
    // 아래에서 위로 정렬 (아래 줄부터 제거해야 인덱스가 꼬이지 않음)
    lines.sort((a, b) => b - a);

    for (const line of lines) {
      // 해당 줄 제거
      this.grid.splice(line, 1);
      // 맨 위에 빈 줄 추가
      this.grid.unshift(Array(BOARD_WIDTH).fill(null));
    }

    return lines.length;
  }

  /**
   * 게임 오버 체크
   * 맨 위 줄에 블록이 있으면 게임 오버
   */
  isGameOver(): boolean {
    return this.grid[0].some(cell => cell !== null);
  }

  /**
   * 고스트 피스 위치 계산
   * 현재 블록이 하드드롭 시 어디에 떨어질지 미리 보여줍니다.
   */
  getGhostPosition(piece: Piece): number {
    let ghostY = 0;

    // 충돌할 때까지 아래로 이동
    while (this.isValidPosition(piece, 0, ghostY + 1)) {
      ghostY++;
    }

    return ghostY;
  }
}
