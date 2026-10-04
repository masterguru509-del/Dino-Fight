import React, { useState } from 'react';
import {
  SaveData,
  PRICES,
  cannonStarsFor,
  cannonXPFor,
  cannonDamage,
  totalArmorBonus,
  damageReduction,
  armorBonus,
  medkitHeal,
  CANNON_NAMES,
  CANNON_DESC,
  SHIELD_NAMES,
  SHIELD_DESC,
  ARMOR_NAMES,
  ARMOR_TIER,
  ARMOR_TIER_COLOR,
  BULLET_NAMES,
} from '../types/game';
import { Shield, Crosshair, Hammer, Heart, Sparkles, Flame, Zap, Save, Check, ArrowLeft } from 'lucide-react';

interface ShopModalProps {
  save: SaveData;
  hasDropCannon: boolean;
  onClose: () => void;
  onSaveProgress: () => void;
  onBuyItem: (type: 'cannon' | 'shield' | 'medkit', lvl: number) => void;
  onBuyArmor: (slot: 'boots' | 'chain' | 'vest' | 'helmet', lvl: number) => void;
  onBuyPet: (type: 'dragon' | 'snake' | 'scorpion', lvl: number) => void;
  onBuyBullet: (color: 'default' | 'fire' | 'ice' | 'poison' | 'plasma') => void;
  onMergeCannon: (lvl: number) => void;
  onUpgradeTalent: (key: 'crit' | 'vamp' | 'haste' | 'skyStrike') => void;
}

type TabKey = 'forge' | 'talents' | 'cannon' | 'shield' | 'armor' | 'medkit' | 'pet' | 'bullet';

export const ShopModal: React.FC<ShopModalProps> = ({
  save,
  hasDropCannon,
  onClose,
  onSaveProgress,
  onBuyItem,
  onBuyArmor,
  onBuyPet,
  onBuyBullet,
  onMergeCannon,
  onUpgradeTalent,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('forge');
  const [justSaved, setJustSaved] = useState(false);

  const handleSaveClick = () => {
    onSaveProgress();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const tabs: { id: TabKey; label: string; icon: React.ReactNode }[] = [
    { id: 'forge', label: 'Кузница', icon: <Hammer className="w-4 h-4" /> },
    { id: 'talents', label: 'Таланты Доминатора', icon: <Zap className="w-4 h-4" /> },
    { id: 'cannon', label: 'Пушки', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'shield', label: 'Щиты', icon: <Shield className="w-4 h-4" /> },
    { id: 'armor', label: 'Броня', icon: <Shield className="w-4 h-4" /> },
    { id: 'medkit', label: 'Аптечки', icon: <Heart className="w-4 h-4" /> },
    { id: 'pet', label: 'Питомцы', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'bullet', label: 'Цвет пуль', icon: <Flame className="w-4 h-4" /> },
  ];

  const activeLvl = save.cannonLevel;
  const stars = cannonStarsFor(save, activeLvl);
  const xp = cannonXPFor(save, activeLvl);
  const xpInLevel = xp - stars * 100;
  const xpPercent = stars >= 3 ? 100 : (xpInLevel / 100) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050510]/85 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#110a26]/95 border border-amber-400/25 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wider text-amber-400">
              АРСЕНАЛ И КУЗНИЦА 3D
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Все покупки и улучшения сохраняются и сразу отображаются на 3D-динозавре
              {save.lastSavedAt ? ` · Сохранено в ${save.lastSavedAt}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-1">
              <span className="text-xs text-slate-400 block">Баланс</span>
              <span className="font-mono tabular-nums text-xl font-bold text-amber-400">
                {save.coins} монет
              </span>
            </div>
            <button
              onClick={handleSaveClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                justSaved
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_#10b981]'
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/40'
              }`}
            >
              {justSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {justSaved ? 'Сохранено!' : 'Сохранить'}
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
          </div>
        </div>

        {/* Interactive Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 px-6 py-3 bg-black/30 border-b border-white/10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? t.id === 'forge'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'forge' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-400/25 text-sm text-purple-200 leading-relaxed">
                Слияние пушек: объединяйте 3 одинаковые пушки уровня N в 1 пушку уровня N+1. Каждое попадание в бою даёт +1 XP активной пушке (100 XP = +1 звезда и +10% к урону, максимум 3 звезды).
              </div>

              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-center">
                <div className="font-display text-lg font-bold text-amber-300 tracking-wide">
                  {hasDropCannon
                    ? 'ДВОЙНАЯ ПУШКА ИЗ ДРОПА (ВРЕМЕННАЯ)'
                    : `АКТИВНАЯ ПУШКА УРОВНЯ ${activeLvl} — ${CANNON_NAMES[activeLvl]}`}
                </div>
                <div className="text-2xl font-bold text-amber-400 my-2 tracking-widest">
                  {'★'.repeat(stars)}
                  {'☆'.repeat(3 - stars)}
                </div>
                <div className="w-full max-w-md mx-auto h-3 bg-black/60 rounded-full overflow-hidden border border-amber-400/40 my-3">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
                <div className="text-xs font-semibold text-amber-200 tabular-nums">
                  {stars >= 3
                    ? 'МАКСИМАЛЬНЫЙ РАНГ ЗВЁЗД (3/3)'
                    : `${xpInLevel} / 100 XP до ${stars + 1}-й звезды`}
                  <span className="mx-2">·</span>
                  <span>Текущий урон: {cannonDamage(save, activeLvl)}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-purple-300 tracking-wider uppercase">
                  Доступные слияния (3 в 1)
                </h3>
                {[1, 2, 3, 4].map((lvl) => {
                  const cnt = save.inventory.cannon[lvl] || 0;
                  const canMerge = cnt >= 3;
                  return (
                    <div
                      key={lvl}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          Пушка ур.{lvl} ({CANNON_NAMES[lvl]})
                          <span className="mx-2 text-slate-500">·</span>
                          <span className="font-mono tabular-nums text-amber-400">
                            В запасе: {cnt} шт.
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Урон: {cannonDamage(save, lvl)} · После слияния: Пушка ур.{lvl + 1} (урон{' '}
                          {cannonDamage(save, lvl + 1)})
                        </div>
                      </div>
                      <button
                        disabled={!canMerge}
                        onClick={() => onMergeCannon(lvl)}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                      >
                        {canMerge ? `Слить 3 → Ур.${lvl + 1}` : `Нужно ещё ${3 - cnt} шт.`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'talents' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-400/30 text-sm text-amber-200 leading-relaxed">
                <strong>Генетические Таланты Доминатора:</strong> пассивные RPG-мутации в духе <em>Dominators: Fighting Dinosaurs</em>, которые навсегда усиливают боевой стиль вашего динозавра.
              </div>
              {(
                [
                  {
                    key: 'crit' as const,
                    title: '💥 Критический Калибр',
                    desc: 'Шанс выпустить гигантское КРИТ-ядро (×2.0 урона + золотая вспышка)',
                    bonuses: ['0%', '15% шанс (×2 урон)', '28% шанс (×2 урон)', '42% шанс (×2 урон)'],
                  },
                  {
                    key: 'vamp' as const,
                    title: '🧛 Вампиризм Хищника',
                    desc: 'Каждое попадание по врагу мгновенно восстанавливает ваше здоровье в бою',
                    bonuses: ['0 HP', '+5 HP за попадание', '+10 HP за попадание', '+16 HP за попадание'],
                  },
                  {
                    key: 'haste' as const,
                    title: '⚡ Реактивный Импульс',
                    desc: 'Ускоряет зарядку пушки ЛКМ и регенерацию стамины для рывков и щита',
                    bonuses: ['Базовая', '+22% скорость заряда', '+44% скорость заряда', '+65% скорость заряда'],
                  },
                  {
                    key: 'skyStrike' as const,
                    title: '☄️ Гейзерный Авиаудар (Sky-Strike)',
                    desc: 'Выстрелы в прыжке с гейзера-трамплина наносят сокрушительный бонусный урон сверху',
                    bonuses: ['0%', '+35% урон в воздухе', '+65% урон в воздухе', '+100% урон в воздухе'],
                  },
                ]
              ).map((item) => {
                const curLvl = save.talents?.[item.key] || 0;
                const nextLvl = curLvl + 1;
                const isMax = curLvl >= 3;
                const price = !isMax ? PRICES.talent[item.key][nextLvl] : 0;
                return (
                  <div
                    key={item.key}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="space-y-1">
                      <div className="font-display font-bold text-white text-base flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-mono">
                          Ур. {curLvl}/3
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{item.desc}</div>
                      <div className="text-xs font-semibold text-emerald-300">
                        Текущий бонус: {item.bonuses[curLvl]}
                        {!isMax && (
                          <span className="text-amber-300 ml-2">
                            → След. уровень: {item.bonuses[nextLvl]}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      disabled={isMax || save.coins < price}
                      onClick={() => onUpgradeTalent(item.key)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isMax ? 'МАКСИМУМ (3/3)' : `Прокачать · ${price} монет`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'cannon' && (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const un = save.unlocked.cannon[lvl];
                const cnt = save.inventory.cannon[lvl] || 0;
                const price = PRICES.cannon[lvl] || 0;
                const isCurrent = save.cannonLevel === lvl && !hasDropCannon;
                const canAutoEquip = !un && lvl > save.cannonLevel && !hasDropCannon;

                return (
                  <div
                    key={lvl}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        Пушка ур.{lvl} — {CANNON_NAMES[lvl]}
                        {isCurrent && (
                          <span className="ml-3 text-xs font-bold text-amber-400">
                            [В РУКАХ]
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
                        {CANNON_DESC[lvl]} · Урон за снаряд: {cannonDamage(save, lvl)} · В запасе: {cnt} шт.
                      </div>
                    </div>
                    <div>
                      {lvl === 1 ? (
                        <span className="text-xs font-semibold text-emerald-400">Базовая</span>
                      ) : (
                        <button
                          disabled={save.coins < price}
                          onClick={() => onBuyItem('cannon', lvl)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed ${
                            canAutoEquip
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {!un
                            ? canAutoEquip
                              ? `Купить и надеть · ${price} монет`
                              : `Разблокировать · ${price} монет`
                            : `+1 в запас · ${price} монет`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'shield' && (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const un = save.unlocked.shield[lvl];
                const cnt = save.inventory.shield[lvl] || 0;
                const price = PRICES.shield[lvl] || 0;
                const isCurrent = save.shieldLevel === lvl;

                return (
                  <div
                    key={lvl}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        3D-Щит ур.{lvl} — {SHIELD_NAMES[lvl]}
                        {isCurrent && (
                          <span className="ml-3 text-xs font-bold text-cyan-400">
                            [АКТИВЕН]
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
                        {SHIELD_DESC[lvl]} · В запасе: {cnt} шт.
                      </div>
                    </div>
                    <div>
                      {lvl === 1 ? (
                        <span className="text-xs font-semibold text-emerald-400">Базовый</span>
                      ) : (
                        <button
                          disabled={save.coins < price}
                          onClick={() => onBuyItem('shield', lvl)}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                        >
                          {!un
                            ? `Купить и надеть · ${price} монет`
                            : `+1 в запас · ${price} монет`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'armor' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-400/25 text-sm text-cyan-200 flex items-center justify-between">
                <span>Суммарный бонус надетой 3D-брони:</span>
                <span className="font-mono tabular-nums font-bold text-cyan-300">
                  +{totalArmorBonus(save)} MAX HP · −{Math.round(damageReduction(save) * 100)}% урона
                </span>
              </div>

              {(['helmet', 'vest', 'chain', 'boots'] as const).map((slot) => (
                <div key={slot} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {ARMOR_NAMES[slot]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {[1, 2, 3, 4].map((lvl) => {
                      const un = save.unlocked.armor[slot][lvl];
                      const eq = save.armor[slot] === lvl;
                      const price = PRICES.armor[slot][lvl];
                      return (
                        <div
                          key={lvl}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div>
                            <div
                              className="font-semibold text-sm"
                              style={{ color: ARMOR_TIER_COLOR[lvl] }}
                            >
                              {ARMOR_TIER[lvl]} · Ур.{lvl}
                            </div>
                            <div className="text-xs text-slate-400 tabular-nums">
                              +{armorBonus(slot, lvl)} HP · −3% урона за ур.
                            </div>
                          </div>
                          <button
                            disabled={eq || (!un && save.coins < price)}
                            onClick={() => onBuyArmor(slot, lvl)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${
                              eq
                                ? 'bg-amber-400 text-slate-950'
                                : un
                                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white'
                            }`}
                          >
                            {eq ? 'НАДЕТО' : un ? 'Надеть' : `Купить · ${price}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'medkit' && (
            <div className="space-y-2.5">
              {[1, 2, 3].map((lvl) => {
                const un = save.unlocked.medkit[lvl];
                const cnt = save.inventory.medkit[lvl] || 0;
                const price = PRICES.medkit[lvl];
                return (
                  <div
                    key={lvl}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        Аптечка ур.{lvl} (клавиша {lvl} в бою)
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
                        Мгновенно восстанавливает +{medkitHeal(lvl)} HP · В запасе: {cnt} шт.
                      </div>
                    </div>
                    <button
                      disabled={save.coins < price}
                      onClick={() => onBuyItem('medkit', lvl)}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                    >
                      {!un ? `Разблокировать · ${price} монет` : `+1 шт. · ${price} монет`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'pet' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-400/25 text-xs text-amber-200 leading-relaxed">
                3D-питомцы сражаются вместе с вами на арене: Дракон парит в воздухе и атакует самонаводящимися файерболами, а Змея и Скорпион преследуют врага по земле и накладывают смертельный яд.
              </div>

              {(['dragon', 'snake', 'scorpion'] as const).map((type) => {
                const name =
                  type === 'dragon' ? 'Огненный Дракон' : type === 'snake' ? 'Ядовитая Змея' : 'Боевой Скорпион';
                const currentLevel =
                  type === 'dragon'
                    ? save.dragonLevel
                    : type === 'snake'
                    ? save.snakeLevel
                    : save.scorpionLevel;

                return (
                  <div key={type} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {name} · Текущий уровень: {currentLevel}/3
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {[1, 2, 3].map((lvl) => {
                        const owned = currentLevel >= lvl;
                        const locked = lvl > currentLevel + 1;
                        const price = PRICES.pet[type][lvl];
                        const desc =
                          type === 'dragon'
                            ? `Файербол: ${2 + lvl} урона${lvl === 3 ? ' (залп ×3)' : ''}`
                            : type === 'snake'
                            ? `Укус: 2 урона · Яд: ${1 + lvl}/сек`
                            : `Жало: 3 урона · Яд: ${2 + lvl}/сек`;

                        return (
                          <div
                            key={lvl}
                            className="flex flex-col justify-between p-4 rounded-xl bg-white/5 border border-white/10 gap-3"
                          >
                            <div>
                              <div className="font-semibold text-white text-sm">
                                {name} · Ур.{lvl}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">{desc}</div>
                            </div>
                            <button
                              disabled={owned || locked || save.coins < price}
                              onClick={() => onBuyPet(type, lvl)}
                              className={`w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                                owned
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white'
                              }`}
                            >
                              {owned
                                ? 'АКТИВЕН'
                                : locked
                                ? `Требуется Ур.${lvl - 1}`
                                : `Призвать · ${price} монет`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'bullet' && (
            <div className="space-y-2.5">
              {(['fire', 'ice', 'poison', 'plasma'] as const).map((c) => {
                const un = save.unlocked.bullet[c];
                const active = save.bulletColor === c;
                const price = PRICES.bullet[c];
                return (
                  <div
                    key={c}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <div className="font-semibold text-white">{BULLET_NAMES[c]} 3D-снаряды</div>
                      <div className="text-xs text-slate-400">
                        Динамическое свечение и 3D-частицы при попадании
                      </div>
                    </div>
                    <button
                      disabled={active || (!un && save.coins < price)}
                      onClick={() => onBuyBullet(c)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                        active
                          ? 'bg-amber-400 text-slate-950'
                          : un
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white'
                      }`}
                    >
                      {active ? 'АКТИВНО' : un ? 'Выбрать' : `Купить · ${price} монет`}
                    </button>
                  </div>
                );
              })}

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-semibold text-white">Стандартные энергетические снаряды</div>
                  <div className="text-xs text-slate-400">Базовое изумрудное свечение</div>
                </div>
                <button
                  disabled={save.bulletColor === 'default'}
                  onClick={() => onBuyBullet('default')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    save.bulletColor === 'default'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {save.bulletColor === 'default' ? 'АКТИВНО' : 'Выбрать'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
