import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Target, Shield, Zap, Sparkles, ShoppingBag } from 'lucide-react';

interface GameOverModalProps {
  winner: 'player' | 'ai' | 'draw';
  rewardCoins: number;
  playerEvoMsg: string;
  enemyEvoMsg: string;
  shotsFired: number;
  shotsHit: number;
  damageDealt: number;
  chestsOpened: number;
  onRestart: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  rewardCoins,
  playerEvoMsg,
  enemyEvoMsg,
  shotsFired,
  shotsHit,
  damageDealt,
  chestsOpened,
  onRestart,
  onOpenShop,
}) => {
  const isVictory = winner === 'player';
  const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#fbbf24', '#a855f7', '#ffffff'],
      });
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Victory / Defeat Badge */}
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-xl ${
            isVictory
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-emerald-500/20'
              : 'bg-rose-500/20 text-rose-400 border border-rose-400/40 shadow-rose-500/20'
          }`}
        >
          {isVictory ? <Trophy className="w-10 h-10 animate-bounce" /> : <Skull className="w-10 h-10" />}
        </div>

        <h2
          className={`font-display text-3xl md:text-4xl font-black tracking-tight mb-1 ${
            isVictory ? 'text-emerald-400' : winner === 'draw' ? 'text-amber-400' : 'text-rose-400'
          }`}
        >
          {isVictory ? 'ПОБЕДА ЧУДО-РЕКСА!' : winner === 'draw' ? 'БОЕВАЯ НИЧЬЯ!' : 'РАПТОР ПОБЕДИЛ...'}
        </h2>
        <p className="text-xs text-slate-400 mb-3">
          {isVictory
            ? 'Доисторическая 3D-арена покорена! Отличная меткость и тактика!'
            : 'Красный Раптор оказался хитрее. Улучшите пушку и броню в Магазине!'}
        </p>

        <div className="font-mono tabular-nums text-xl font-black text-amber-400 mb-4">
          Награда: +{rewardCoins} монет
        </div>

        {playerEvoMsg && (
          <div className="w-full p-3 mb-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-bold">
            {playerEvoMsg}
          </div>
        )}

        {enemyEvoMsg && (
          <div className="w-full p-2.5 mb-4 rounded-xl bg-pink-500/15 border border-pink-400/40 text-pink-300 text-xs font-bold">
            {enemyEvoMsg}
          </div>
        )}

        {/* Match Statistics Grid (Snow-Game Style) */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-6 text-left">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Точность</div>
              <div className="text-base font-bold text-white font-mono tabular-nums">{accuracy}%</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Попаданий</div>
              <div className="text-base font-bold text-amber-300 font-mono tabular-nums">{shotsHit}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Урон нанесён</div>
              <div className="text-base font-bold text-emerald-400 font-mono tabular-nums">{damageDealt}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Сундуков взято</div>
              <div className="text-base font-bold text-purple-300 font-mono tabular-nums">{chestsOpened}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Играть снова</span>
          </button>

          <button
            onClick={onOpenShop}
            className="w-full py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 hover:text-amber-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Магазин, Броня и Кузница Пушек</span>
          </button>
        </div>
      </div>
    </div>
  );
};
