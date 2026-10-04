import React from 'react';
import {
  SaveData,
  WeatherType,
  EVO_NAMES,
  EVO_COLORS,
  evoMult,
  CANNON_NAMES,
  SHIELD_NAMES,
} from '../types/game';
import { DinoSpecies } from '../three/SceneEntities';
import {
  Music,
  Volume2,
  VolumeX,
  ShoppingBag,
  Pause,
  RefreshCw,
  Info,
  Shield,
  Zap,
  Flame,
  Sparkles,
  Crosshair,
  Save,
  Check,
} from 'lucide-react';

const SPECIES_LABELS: Record<DinoSpecies, string> = {
  rex: 'ТИРАННОЗАВР РЕКС',
  triceratops: 'ТРИЦЕРАТОПС',
  spinosaurus: 'СПИНОЗАВР',
  raptor: 'ВЕЛОЦИРАПТОР',
  ankylosaurus: 'АНКИЛОЗАВР-ТИТАН',
  stegosaurus: 'ЭЛЕКТРО-СТЕГОЗАВР',
  pteranodon: 'КИБЕР-ПТЕРАНОДОН',
  mecha_rex: 'МЕХА-ДОМИНАТОР',
};

interface HUDProps {
  save: SaveData;
  species: DinoSpecies;
  enemySpecies: DinoSpecies;
  isPlayerBlocking: boolean;
  p1Hp: number;
  p1MaxHp: number;
  p2Hp: number;
  p2MaxHp: number;
  p2Poison: number;
  stamina: number;
  rage: number;
  rageActive: number;
  charge: number;
  aiStatus: 'ГОТОВ' | 'БЛОК' | 'УКЛОНЕНИЕ' | 'ОТСТУПЛЕНИЕ' | 'ОХОТА ЗА ДРОПОМ';
  isBoss: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  enemyEvo: number;
  playerEvo: number;
  weather: WeatherType;
  combo: number;
  buffSpeed: number;
  buffDouble: number;
  buffInvul: number;
  hasDropCannon: boolean;
  dropPickupProgress: number;
  isMuted: boolean;
  isMusicPlaying: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onToggleDifficulty: () => void;
  onTriggerRage: () => void;
  onOpenShop: () => void;
  onSaveProgress: () => void;
  onOpenAnalysis: () => void;
  onRestart: () => void;
  onTogglePause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  save,
  species,
  enemySpecies,
  isPlayerBlocking,
  p1Hp,
  p1MaxHp,
  p2Hp,
  p2MaxHp,
  p2Poison,
  stamina,
  rage,
  rageActive,
  charge,
  aiStatus,
  isBoss,
  difficulty,
  enemyEvo,
  playerEvo,
  weather,
  combo,
  buffSpeed,
  buffDouble,
  buffInvul,
  hasDropCannon,
  dropPickupProgress,
  isMuted,
  isMusicPlaying,
  onToggleMute,
  onToggleMusic,
  onToggleDifficulty,
  onTriggerRage,
  onOpenShop,
  onSaveProgress,
  onOpenAnalysis,
  onRestart,
  onTogglePause,
}) => {
  const [justSaved, setJustSaved] = React.useState(false);

  const handleSaveClick = () => {
    onSaveProgress();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  const p1Percentage = Math.max(0, Math.min(100, (p1Hp / p1MaxHp) * 100));
  const p2Percentage = Math.max(0, Math.min(100, (p2Hp / p2MaxHp) * 100));
  const p2PoisonPercentage = Math.max(0, Math.min(100, (p2Poison / p2MaxHp) * 100));

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-6">
      {/* Top Bar: Player Dino Card — Center Controls — Enemy Raptor Card */}
      <div className="flex items-start justify-between gap-4 w-full">
        {/* Player 1 Card */}
        <div className="flex flex-col gap-1.5 bg-slate-900/75 backdrop-blur-xl border border-emerald-400/35 rounded-2xl p-3.5 shadow-2xl min-w-[240px] md:min-w-[300px]">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
            <span className="flex items-center gap-1.5 font-display tracking-wide text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#4ade80]" />
              {SPECIES_LABELS[species]} · ЭВО {playerEvo}/5
            </span>
            <span className="font-mono text-white tabular-nums">
              {Math.round(p1Hp)} / {Math.round(p1MaxHp)} HP
            </span>
          </div>

          {/* Health Bar */}
          <div className="w-full h-3 bg-slate-950/85 rounded-full overflow-hidden border border-emerald-500/30">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-green-300 transition-all duration-200"
              style={{ width: `${p1Percentage}%` }}
            />
          </div>

          {/* Stamina / Dash Bar */}
          <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-100"
              style={{ width: `${stamina}%` }}
            />
          </div>

          {/* Primal Rage Bar (Q Ultimate) */}
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-2 bg-slate-950/90 rounded-full overflow-hidden border border-amber-500/30">
              <div
                className={`h-full transition-all duration-150 ${
                  rageActive > 0
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-orange-400 animate-pulse'
                    : 'bg-gradient-to-r from-amber-600 to-yellow-400'
                }`}
                style={{ width: `${rageActive > 0 ? (rageActive / 8) * 100 : rage}%` }}
              />
            </div>
            <button
              onClick={onTriggerRage}
              disabled={rage < 100 && rageActive <= 0}
              className={`pointer-events-auto px-2 py-0.5 rounded text-[10px] font-display font-bold tracking-wider uppercase transition-all cursor-pointer ${
                rageActive > 0
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_#fbbf24]'
                  : rage >= 100
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 animate-bounce shadow-[0_0_14px_#f59e0b]'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700'
              }`}
            >
              {rageActive > 0 ? `ЯРОСТЬ ${rageActive.toFixed(1)}С` : `ЯРОСТЬ [Q] ${Math.round(rage)}%`}
            </button>
            <div
              className={`px-2 py-0.5 rounded text-[10px] font-display font-bold tracking-wider uppercase transition-all flex items-center gap-1 ${
                isPlayerBlocking
                  ? 'bg-sky-400 text-slate-950 shadow-[0_0_12px_#38bdf8]'
                  : 'bg-slate-800/80 text-sky-300 border border-sky-500/30'
              }`}
            >
              <Shield className="w-3 h-3" />
              {isPlayerBlocking ? 'ЩИТ АКТИВЕН!' : 'ЩИТ [E / R]'}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 mt-0.5">
            <span className="truncate">
              {hasDropCannon ? (
                <strong className="text-fuchsia-300">ДРОП-ПУШКА ×2</strong>
              ) : (
                <span>
                  {CANNON_NAMES[save.cannonLevel]} · {SHIELD_NAMES[save.shieldLevel]}
                </span>
              )}
            </span>
            <span
              style={{ color: EVO_COLORS[playerEvo] }}
              className="font-bold tracking-wider uppercase ml-2"
            >
              {EVO_NAMES[playerEvo]}
            </span>
          </div>
        </div>

        {/* Center Top Bar: Weather, Coins & Quick Actions */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-1.5 shadow-2xl">
            {/* Weather Badge */}
            <div
              className="px-3 py-1.5 rounded-xl bg-slate-950/75 border border-slate-800 text-xs font-medium text-slate-200 flex items-center gap-1.5"
              title={weather.desc}
            >
              <span>{weather.name}</span>
            </div>

            {/* Coins Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs font-mono font-bold text-amber-300 tabular-nums flex items-center gap-1.5">
              <span>🪙</span>
              <span>{save.coins}</span>
            </div>

            {/* Difficulty Toggle */}
            <button
              onClick={onToggleDifficulty}
              className={`px-2.5 py-1.5 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer ${
                difficulty === 'hard'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                  : difficulty === 'normal'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              }`}
              title="Переключить сложность ИИ"
            >
              {difficulty === 'hard' ? '🔥 ХАРД' : difficulty === 'normal' ? '⚔️ НОРМ' : '🌿 ЛЕГКО'}
            </button>

            <button
              onClick={onToggleMusic}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isMusicPlaying
                  ? 'bg-amber-500/25 text-amber-300'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isMusicPlaying ? 'Выключить музыку' : 'Включить музыку'}
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="w-px h-5 bg-slate-700/60 mx-0.5" />

            <button
              onClick={onOpenShop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-orange-500/25 hover:from-amber-500/35 hover:to-orange-500/35 text-amber-300 border border-amber-500/40 transition-all text-xs font-bold tracking-wide cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">КУЗНИЦА И МАГАЗИН</span>
            </button>

            <button
              onClick={handleSaveClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-bold tracking-wide cursor-pointer ${
                justSaved
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_14px_#10b981]'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-400/40'
              }`}
              title="Сохранить игровой прогресс и покупки"
            >
              {justSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{justSaved ? 'СОХРАНЕНО!' : 'СОХРАНИТЬ'}</span>
            </button>

            <button
              onClick={onOpenAnalysis}
              className="p-2 rounded-xl hover:bg-slate-800 text-sky-300 hover:text-sky-200 transition-colors cursor-pointer"
              title="Управление и 3D Архитектура"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              onClick={onRestart}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Начать раунд заново"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePause}
              className="p-2 rounded-xl hover:bg-slate-800 text-amber-300 hover:text-white transition-colors cursor-pointer"
              title="Пауза / Главное меню (ESC)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Combo & Active Buffs Banner */}
          <div className="flex items-center gap-2">
            {combo >= 2 && (
              <div className="px-3.5 py-1 rounded-xl bg-amber-500/25 border border-amber-400 text-amber-200 font-display font-black text-xs tracking-wider uppercase animate-bounce shadow-lg">
                🔥 КОМБО ×{combo} (+{Math.min(combo * 10, 50)}% УРОНА)
              </div>
            )}
            {buffSpeed > 0 && (
              <div className="px-2.5 py-1 rounded-lg bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" /> УСКОРЕНИЕ {buffSpeed.toFixed(1)}с
              </div>
            )}
            {buffDouble > 0 && (
              <div className="px-2.5 py-1 rounded-lg bg-orange-500/25 border border-orange-400/50 text-orange-200 text-xs font-mono font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" /> 2× УРОН {buffDouble.toFixed(1)}с
              </div>
            )}
            {buffInvul > 0 && (
              <div className="px-2.5 py-1 rounded-lg bg-amber-500/25 border border-amber-400/50 text-amber-200 text-xs font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> НЕУЯЗВИМОСТЬ {buffInvul.toFixed(1)}с
              </div>
            )}
          </div>
        </div>

        {/* Player 2 (Хищный Раптор ИИ / Альфа-Босс) Card */}
        <div
          className={`flex flex-col gap-1.5 bg-slate-900/75 backdrop-blur-xl border rounded-2xl p-3.5 shadow-2xl min-w-[240px] md:min-w-[300px] ${
            isBoss ? 'border-amber-400/70 shadow-amber-500/20' : 'border-rose-500/35'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
            <span className="font-mono text-white tabular-nums">
              {Math.round(p2Hp)} / {Math.round(p2MaxHp)} HP
            </span>
            <span className="flex items-center gap-1.5 font-display tracking-wide text-sm">
              {isBoss ? (
                <span className="text-amber-300 font-black">
                  👑 БОСС {SPECIES_LABELS[enemySpecies]} · ЭВО {enemyEvo}/5
                </span>
              ) : (
                <span>
                  {SPECIES_LABELS[enemySpecies]} · ЭВО {enemyEvo}/5
                </span>
              )}
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isBoss
                    ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
                    : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
                }`}
              />
            </span>
          </div>

          {/* Enemy Health + Poison Bar */}
          <div className="relative w-full h-3 bg-slate-950/85 rounded-full overflow-hidden border border-rose-500/30">
            <div
              className="h-full bg-gradient-to-l from-rose-600 via-rose-500 to-orange-400 transition-all duration-200 ml-auto"
              style={{ width: `${p2Percentage}%` }}
            />
            {p2Poison > 0 && (
              <div
                className="absolute inset-y-0 right-0 bg-lime-400/60 transition-all duration-200"
                style={{ width: `${p2PoisonPercentage}%` }}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
            <span
              style={{ color: EVO_COLORS[enemyEvo] }}
              className="font-bold tracking-wider uppercase"
            >
              {EVO_NAMES[enemyEvo]} (×{evoMult(enemyEvo).toFixed(2)})
            </span>
            <span className="font-mono text-xs text-slate-200">
              Статус: <strong className="text-amber-300">{aiStatus}</strong>
              {p2Poison > 0 && (
                <span className="ml-1.5 text-lime-400 font-bold">ЯД:{Math.round(p2Poison)}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Center Reticle & Drop Pickup Progress */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 pointer-events-none">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-6 h-6 rounded-full border transition-all duration-75 ${
              charge > 0.8
                ? 'border-amber-400 scale-125 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                : charge > 0.05
                ? 'border-emerald-400 scale-110'
                : 'border-white/35'
            }`}
          />
          <div
            className={`absolute w-1.5 h-1.5 rounded-full ${
              charge > 0.8 ? 'bg-amber-400' : 'bg-emerald-400/80'
            }`}
          />
        </div>

        {/* Charge Bar under crosshair */}
        {charge > 0.02 && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-28 h-2.5 bg-slate-950/85 rounded-full overflow-hidden border border-white/25 p-0.5 backdrop-blur-sm">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  charge > 0.8
                    ? 'bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_10px_#f59e0b]'
                    : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                }`}
                style={{ width: `${Math.min(100, charge * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold drop-shadow">
              {charge > 0.85 ? 'СУПЕР-ЗАЛП!' : 'ЗАРЯД ПУШКИ'}
            </span>
          </div>
        )}

        {/* Special Drop Pickup Progress */}
        {dropPickupProgress > 0 && (
          <div className="px-4 py-2 rounded-xl bg-fuchsia-950/90 border border-fuchsia-400 text-fuchsia-200 text-xs font-display font-bold tracking-wider uppercase shadow-xl">
            ЗАХВАТ СПЕЦ-ОРУЖИЯ: {Math.round(dropPickupProgress * 100)}% (СТОЙ В КОЛЬЦЕ ИЛИ [E])
          </div>
        )}
      </div>

      {/* Bottom Bar: Controls & Medkits Belt */}
      <div className="hidden md:flex justify-between items-end w-full">
        {/* Controls Card */}
        <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-3 text-slate-300 text-xs space-y-1 shadow-xl">
          <div className="font-bold text-emerald-300 mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Управление на Тропическом Острове
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-[11px]">
            <div>
              <span className="text-white font-semibold">W, A, S, D</span> — Свободный бег
            </div>
            <div>
              <span className="text-white font-semibold">ЛКМ (зажать)</span> — Заряд и Залп
            </div>
            <div>
              <span className="text-sky-300 font-semibold">Удерж. E / R / C</span> — 3D-Щит (Блок)
            </div>
            <div>
              <span className="text-white font-semibold">SHIFT / ПРОБЕЛ</span> — Рывок / Прыжок
            </div>
            <div>
              <span className="text-amber-300 font-semibold">Q (100% Ярости)</span> — Супероружие + Берсерк
            </div>
            <div>
              <span className="text-white font-semibold">ПКМ + мышь</span> — Поворот камеры
            </div>
          </div>
        </div>

        {/* Medkits Belt & Active Pets */}
        <div className="flex items-center gap-2 bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-2.5 shadow-xl">
          {[1, 2, 3].map((lvl) => {
            const count = save.inventory.medkit[lvl] || 0;
            const colors = [
              'border-rose-500/40 text-rose-300',
              'border-orange-500/40 text-orange-300',
              'border-amber-400/50 text-amber-300',
            ];
            return (
              <div
                key={lvl}
                className={`px-3 py-1.5 rounded-xl bg-slate-950/80 border ${colors[lvl - 1]} flex items-center gap-2 text-xs font-mono`}
              >
                <span className="text-[10px] text-slate-400">[{lvl}]</span>
                <span>💊 Ур.{lvl}</span>
                <strong className="text-white">×{count}</strong>
              </div>
            );
          })}

          {(save.dragonLevel > 0 || save.snakeLevel > 0 || save.scorpionLevel > 0) && (
            <div className="pl-2 border-l border-slate-700/60 flex items-center gap-1.5 text-xs">
              {save.dragonLevel > 0 && (
                <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 font-bold">
                  🐉 Ур.{save.dragonLevel}
                </span>
              )}
              {save.snakeLevel > 0 && (
                <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  🐍 Ур.{save.snakeLevel}
                </span>
              )}
              {save.scorpionLevel > 0 && (
                <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 font-bold">
                  🦂 Ур.{save.scorpionLevel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
