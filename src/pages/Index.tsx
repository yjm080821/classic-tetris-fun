/**
 * 테트리스 게임 메인 페이지
 * 레트로 아케이드 스타일의 테트리스 게임입니다.
 */

import { TetrisGame } from '@/components/TetrisGame';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <header className="py-4 px-4 text-center">
        <h1 className="font-arcade text-2xl md:text-3xl text-primary text-glow-cyan tracking-wider animate-float">
          TETRIS
        </h1>
        <p className="font-tech text-xs text-muted-foreground mt-2">
          Classic Block Puzzle Game
        </p>
      </header>

      {/* 게임 영역 */}
      <main className="flex-1 flex items-start justify-center py-4">
        <TetrisGame />
      </main>

      {/* 푸터 */}
      <footer className="py-3 text-center">
        <p className="font-tech text-[10px] text-muted-foreground">
          Built with React & Canvas • Press Enter to Start
        </p>
      </footer>
    </div>
  );
};

export default Index;
