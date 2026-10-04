export interface SaveData {
  coins: number;
  cannonLevel: number;
  shieldLevel: number;
  bulletColor: 'default' | 'fire' | 'ice' | 'poison' | 'plasma';
  selectedSpecies?: string;
  lastSavedAt?: string;
  dragonLevel: number;
  snakeLevel: number;
  scorpionLevel: number;
  totalWins: number;
  winStreak: number;
  lossStreak: number;
  cannonStars: Record<number, number>;
  armor: {
    boots: number;
    chain: number;
    vest: number;
    helmet: number;
  };
  talents: {
    crit: number;
    vamp: number;
    haste: number;
    skyStrike: number;
  };
  inventory: {
    cannon: Record<number, number>;
    shield: Record<number, number>;
    medkit: Record<number, number>;
  };
  unlocked: {
    cannon: Record<number, boolean>;
    shield: Record<number, boolean>;
    medkit: Record<number, boolean>;
    armor: {
      boots: Record<number, boolean>;
      chain: Record<number, boolean>;
      vest: Record<number, boolean>;
      helmet: Record<number, boolean>;
    };
    bullet: {
      fire: boolean;
      ice: boolean;
      poison: boolean;
      plasma: boolean;
    };
  };
}

export const DEFAULT_SAVE: SaveData = {
  coins: 0,
  cannonLevel: 1,
  shieldLevel: 1,
  bulletColor: 'default',
  selectedSpecies: 'rex',
  dragonLevel: 1,
  snakeLevel: 0,
  scorpionLevel: 0,
  totalWins: 0,
  winStreak: 0,
  lossStreak: 0,
  cannonStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  armor: { boots: 0, chain: 0, vest: 0, helmet: 0 },
  talents: { crit: 0, vamp: 0, haste: 0, skyStrike: 0 },
  inventory: {
    cannon: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    shield: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    medkit: { 1: 1, 2: 0, 3: 0 },
  },
  unlocked: {
    cannon: { 1: true, 2: false, 3: false, 4: false, 5: false },
    shield: { 1: true, 2: false, 3: false, 4: false, 5: false },
    medkit: { 1: true, 2: false, 3: false },
    armor: {
      boots: { 1: false, 2: false, 3: false, 4: false },
      chain: { 1: false, 2: false, 3: false, 4: false },
      vest: { 1: false, 2: false, 3: false, 4: false },
      helmet: { 1: false, 2: false, 3: false, 4: false },
    },
    bullet: { fire: false, ice: false, poison: false, plasma: false },
  },
};

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem('dinoFightLegendaryV4');
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    const merged: SaveData = structuredClone(DEFAULT_SAVE);
    if (typeof parsed.coins === 'number') merged.coins = parsed.coins;
    if (typeof parsed.cannonLevel === 'number') merged.cannonLevel = parsed.cannonLevel;
    if (typeof parsed.shieldLevel === 'number') merged.shieldLevel = parsed.shieldLevel;
    if (parsed.bulletColor) merged.bulletColor = parsed.bulletColor;
    if (typeof parsed.selectedSpecies === 'string') merged.selectedSpecies = parsed.selectedSpecies;
    if (typeof parsed.lastSavedAt === 'string') merged.lastSavedAt = parsed.lastSavedAt;
    if (typeof parsed.dragonLevel === 'number' && parsed.dragonLevel >= 1) {
      merged.dragonLevel = parsed.dragonLevel;
    } else {
      merged.dragonLevel = 1;
    }
    if (typeof parsed.snakeLevel === 'number') merged.snakeLevel = parsed.snakeLevel;
    if (typeof parsed.scorpionLevel === 'number') merged.scorpionLevel = parsed.scorpionLevel;
    if (typeof parsed.totalWins === 'number') merged.totalWins = parsed.totalWins;
    if (typeof parsed.winStreak === 'number') merged.winStreak = parsed.winStreak;
    if (typeof parsed.lossStreak === 'number') merged.lossStreak = parsed.lossStreak;
    if (parsed.cannonStars) Object.assign(merged.cannonStars, parsed.cannonStars);
    if (parsed.armor) Object.assign(merged.armor, parsed.armor);
    if (parsed.talents) Object.assign(merged.talents, parsed.talents);
    if (parsed.inventory) {
      if (parsed.inventory.cannon) Object.assign(merged.inventory.cannon, parsed.inventory.cannon);
      if (parsed.inventory.shield) Object.assign(merged.inventory.shield, parsed.inventory.shield);
      if (parsed.inventory.medkit) Object.assign(merged.inventory.medkit, parsed.inventory.medkit);
    }
    if (parsed.unlocked) {
      if (parsed.unlocked.cannon) Object.assign(merged.unlocked.cannon, parsed.unlocked.cannon);
      if (parsed.unlocked.shield) Object.assign(merged.unlocked.shield, parsed.unlocked.shield);
      if (parsed.unlocked.medkit) Object.assign(merged.unlocked.medkit, parsed.unlocked.medkit);
      if (parsed.unlocked.bullet) Object.assign(merged.unlocked.bullet, parsed.unlocked.bullet);
      if (parsed.unlocked.armor) {
        (['boots', 'chain', 'vest', 'helmet'] as const).forEach((s) => {
          if (parsed.unlocked.armor[s])
            Object.assign(merged.unlocked.armor[s], parsed.unlocked.armor[s]);
        });
      }
    }
    return merged;
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function persistSaveData(save: SaveData) {
  try {
    localStorage.setItem('dinoFightLegendaryV4', JSON.stringify(save));
  } catch {
    // ignore storage errors
  }
}

export const PRICES = {
  cannon: { 2: 50, 3: 120, 4: 250, 5: 500 } as Record<number, number>,
  shield: { 2: 40, 3: 100, 4: 220, 5: 450 } as Record<number, number>,
  medkit: { 1: 20, 2: 30, 3: 60 } as Record<number, number>,
  armor: {
    boots: { 1: 30, 2: 80, 3: 180, 4: 400 } as Record<number, number>,
    chain: { 1: 40, 2: 100, 3: 220, 4: 480 } as Record<number, number>,
    vest: { 1: 50, 2: 130, 3: 280, 4: 600 } as Record<number, number>,
    helmet: { 1: 35, 2: 90, 3: 200, 4: 450 } as Record<number, number>,
  },
  pet: {
    dragon: { 1: 100, 2: 250, 3: 600 } as Record<number, number>,
    snake: { 1: 100, 2: 250, 3: 600 } as Record<number, number>,
    scorpion: { 1: 120, 2: 280, 3: 650 } as Record<number, number>,
  },
  bullet: { fire: 100, ice: 120, poison: 150, plasma: 250 } as Record<string, number>,
  talent: {
    crit: { 1: 60, 2: 140, 3: 300 } as Record<number, number>,
    vamp: { 1: 70, 2: 160, 3: 340 } as Record<number, number>,
    haste: { 1: 55, 2: 130, 3: 280 } as Record<number, number>,
    skyStrike: { 1: 65, 2: 150, 3: 320 } as Record<number, number>,
  },
};

export function getPlayerEvo(save: SaveData): number {
  const w = save.totalWins || 0;
  if (w >= 35) return 5;
  if (w >= 20) return 4;
  if (w >= 10) return 3;
  if (w >= 5) return 2;
  return 1;
}

export const EVO_NAMES: Record<number, string> = {
  1: 'Новичок',
  2: 'Воин',
  3: 'Чемпион',
  4: 'Мастер',
  5: 'ЛЕГЕНДА',
};

export const EVO_COLORS: Record<number, string> = {
  1: '#86efac',
  2: '#a3e635',
  3: '#fbbf24',
  4: '#f59e0b',
  5: '#f472b6',
};

export function cannonStarsFor(save: SaveData, lvl: number): number {
  return Math.min(3, Math.floor((save.cannonStars[lvl] || 0) / 100));
}

export function cannonXPFor(save: SaveData, lvl: number): number {
  return save.cannonStars[lvl] || 0;
}

export function cannonDamage(save: SaveData, l: number): number {
  const base = 10 + (l - 1) * 5;
  const stars = cannonStarsFor(save, l);
  return Math.round(base * (1 + stars * 0.12));
}

export function cannonSpeed(l: number): number {
  return 12 + (l - 1) * 2;
}

export function cannonBulletSize(l: number): number {
  return 14 + (l - 1) * 2;
}

export function cannonBulletCount(l: number): number {
  return [1, 2, 3, 4, 5][l - 1] || 1;
}

export function cannonSpread(l: number): number {
  return [0, 22, 20, 18, 16][l - 1] || 0;
}

export function medkitHeal(l: number): number {
  return [25, 45, 75][l - 1] || 25;
}

export function armorBonus(slot: 'boots' | 'chain' | 'vest' | 'helmet', lvl: number): number {
  if (!lvl) return 0;
  const t = { boots: 10, chain: 15, vest: 20, helmet: 5 };
  return (t[slot] || 10) * lvl;
}

export function totalArmorBonus(save: SaveData): number {
  let t = 0;
  (['boots', 'chain', 'vest', 'helmet'] as const).forEach((s) => {
    t += armorBonus(s, save.armor[s]);
  });
  return t;
}

export function damageReduction(save: SaveData): number {
  const n = save.armor.boots + save.armor.chain + save.armor.vest + save.armor.helmet;
  return Math.min(0.5, n * 0.03);
}

export function calcEnemyEvo(save: SaveData): number {
  const wins = save.totalWins || 0;
  if (wins >= 30) return 5;
  if (wins >= 20) return 4;
  if (wins >= 12) return 3;
  if (wins >= 5) return 2;
  return 1;
}

export function evoMult(level: number): number {
  return [1.0, 1.07, 1.15, 1.24, 1.35][level - 1] || 1.0;
}

export const CANNON_NAMES: Record<number, string> = {
  1: 'Обычная',
  2: 'Фиолетовая',
  3: 'Золотая',
  4: 'Розовая',
  5: 'Бирюзовая',
};

export const CANNON_DESC: Record<number, string> = {
  1: '1 пуля',
  2: '2 пули',
  3: '3 пули',
  4: '4 пули',
  5: '5 пуль',
};

export const SHIELD_NAMES: Record<number, string> = {
  1: 'Синий',
  2: 'Фиолетовый',
  3: 'Золотой',
  4: 'Розовый',
  5: 'Бирюзовый',
};

export const SHIELD_DESC: Record<number, string> = {
  1: 'Маленький энергетический щит',
  2: 'Средний силовой щит',
  3: 'Большой золотой барьер',
  4: 'Огромный плазменный купол',
  5: 'Гигантская сфера защиты',
};

export const ARMOR_NAMES: Record<'boots' | 'chain' | 'vest' | 'helmet', string> = {
  boots: 'Броневые сапоги',
  chain: 'Броневая кольчуга',
  vest: 'Бронежилет',
  helmet: 'Бронешлем',
};

export const ARMOR_TIER: Record<number, string> = {
  1: 'Серебро',
  2: 'Сталь',
  3: 'Золото',
  4: 'Мифрил',
};

export const ARMOR_TIER_COLOR: Record<number, string> = {
  1: '#e2e8f0',
  2: '#bae6fd',
  3: '#fef3c7',
  4: '#ddd6fe',
};

export const BULLET_NAMES: Record<string, string> = {
  fire: 'Огненные',
  ice: 'Ледяные',
  poison: 'Ядовитые',
  plasma: 'Плазменные',
};

export interface WeatherType {
  id: 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'petals' | 'sand';
  name: string;
  desc: string;
  color: string;
  fogColor: number;
  ambientIntensity: number;
  skyTop: string;
  bulletMod: number;
  gravityMod: number;
}

export const WEATHERS: WeatherType[] = [
  {
    id: 'clear',
    name: '☀️ Ясно',
    desc: 'Идеальная тропическая погода для боя',
    color: '#fbbf24',
    fogColor: 0x7dd3fc,
    ambientIntensity: 0.82,
    skyTop: '#041f33',
    bulletMod: 1.0,
    gravityMod: 1.0,
  },
  {
    id: 'rain',
    name: '🌧️ Тропический ливень',
    desc: 'Снаряды тяжелее на 10%',
    color: '#6bb6ff',
    fogColor: 0x38bdf8,
    ambientIntensity: 0.65,
    skyTop: '#081021',
    bulletMod: 0.95,
    gravityMod: 1.1,
  },
  {
    id: 'snow',
    name: '❄️ Ледниковый бриз',
    desc: 'Холодный воздух ускоряет полёт снарядов',
    color: '#a5f3fc',
    fogColor: 0xbae6fd,
    ambientIntensity: 0.85,
    skyTop: '#131b2e',
    bulletMod: 1.05,
    gravityMod: 0.95,
  },
  {
    id: 'fog',
    name: '🌫️ Туман Джунглей',
    desc: 'Плотный туман скрывает манёвры',
    color: '#a78bfa',
    fogColor: 0x64748b,
    ambientIntensity: 0.65,
    skyTop: '#1b1030',
    bulletMod: 0.98,
    gravityMod: 1.0,
  },
  {
    id: 'storm',
    name: '⛈️ Муссонная Гроза',
    desc: 'Попутный шторм разгоняет снаряды на +12%',
    color: '#fbbf24',
    fogColor: 0x1e293b,
    ambientIntensity: 0.55,
    skyTop: '#05030a',
    bulletMod: 1.12,
    gravityMod: 1.05,
  },
  {
    id: 'petals',
    name: '🌸 Цветущий Остров',
    desc: 'Лёгкая гравитация для высоких навесных залпов',
    color: '#fbcfe8',
    fogColor: 0xf9a8d4,
    ambientIntensity: 0.85,
    skyTop: '#1c0b26',
    bulletMod: 1.04,
    gravityMod: 0.88,
  },
  {
    id: 'sand',
    name: '🏜️ Песчаный Хамсин',
    desc: 'Ветер пустыни сопротивляется полёту пуль',
    color: '#d4a574',
    fogColor: 0xfde68a,
    ambientIntensity: 0.72,
    skyTop: '#29180c',
    bulletMod: 0.92,
    gravityMod: 1.08,
  },
];

export interface ChestType {
  key: string;
  name: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  coins: number;
  buff?: 'speed' | 'doubleDmg' | 'invul';
  heal?: number;
  medkit?: number;
  cannon?: number;
  pet?: 'dragon' | 'snake' | 'scorpion';
}

export const CHEST_TYPES: Record<string, ChestType> = {
  coin: { key: 'coin', name: 'СУНДУК ЗОЛОТА', color: '#fbbf24', rarity: 'common', coins: 15 },
  heal: {
    key: 'heal',
    name: 'ТРОПИЧЕСКИЙ НЕКТАР (+35 HP)',
    color: '#4ade80',
    rarity: 'common',
    coins: 8,
    heal: 35,
  },
  speed: {
    key: 'speed',
    name: 'УСКОРЕНИЕ ДЖУНГЛЕЙ',
    color: '#22d3ee',
    rarity: 'common',
    coins: 10,
    buff: 'speed',
  },
  double: {
    key: 'double',
    name: 'ДВОЙНОЙ УРОН (8с)',
    color: '#f472b6',
    rarity: 'rare',
    coins: 12,
    buff: 'doubleDmg',
  },
  invul: {
    key: 'invul',
    name: 'НЕУЯЗВИМЫЙ БАРЬЕР (6с)',
    color: '#a78bfa',
    rarity: 'rare',
    coins: 12,
    buff: 'invul',
  },
  medkitItem: {
    key: 'medkitItem',
    name: 'АПТЕЧКА В ИНВЕНТАРЬ',
    color: '#f87171',
    rarity: 'rare',
    coins: 10,
    medkit: 1,
  },
  cannon1: {
    key: 'cannon1',
    name: 'ПУШКА УР.1',
    color: '#cbd5e1',
    rarity: 'common',
    coins: 10,
    cannon: 1,
  },
  cannon2: {
    key: 'cannon2',
    name: 'ПУШКА УР.2!',
    color: '#a78bfa',
    rarity: 'rare',
    coins: 18,
    cannon: 2,
  },
  cannon3: {
    key: 'cannon3',
    name: 'ЗОЛОТАЯ ПУШКА УР.3!',
    color: '#fbbf24',
    rarity: 'epic',
    coins: 28,
    cannon: 3,
  },
  cannon4: {
    key: 'cannon4',
    name: 'РОЗОВАЯ ПУШКА УР.4!',
    color: '#f472b6',
    rarity: 'legendary',
    coins: 45,
    cannon: 4,
  },
  cannon5: {
    key: 'cannon5',
    name: 'МИФИЧЕСКАЯ ПУШКА УР.5!',
    color: '#22d3ee',
    rarity: 'mythic',
    coins: 75,
    cannon: 5,
  },
  eggDragon: {
    key: 'eggDragon',
    name: 'ЯЙЦО ОГНЕННОГО ДРАКОНА!',
    color: '#f59e0b',
    rarity: 'epic',
    coins: 25,
    pet: 'dragon',
  },
  eggSnake: {
    key: 'eggSnake',
    name: 'ЯЙЦО ЯДОВИТОЙ ЗМЕИ!',
    color: '#22d3ee',
    rarity: 'epic',
    coins: 25,
    pet: 'snake',
  },
  eggScorp: {
    key: 'eggScorp',
    name: 'ЯЙЦО ИМПЕРСКОГО СКОРПИОНА!',
    color: '#a855f7',
    rarity: 'epic',
    coins: 25,
    pet: 'scorpion',
  },
};

const CHEST_WEIGHTS = [
  { type: 'coin', w: 15 },
  { type: 'heal', w: 15 },
  { type: 'speed', w: 12 },
  { type: 'double', w: 8 },
  { type: 'invul', w: 6 },
  { type: 'medkitItem', w: 10 },
  { type: 'cannon1', w: 12 },
  { type: 'cannon2', w: 6 },
  { type: 'cannon3', w: 3 },
  { type: 'cannon4', w: 1.2 },
  { type: 'cannon5', w: 0.6 },
  { type: 'eggDragon', w: 1.5 },
  { type: 'eggSnake', w: 1.5 },
  { type: 'eggScorp', w: 1.5 },
];

export function pickChestType(): ChestType {
  let total = 0;
  for (const c of CHEST_WEIGHTS) total += c.w;
  let r = Math.random() * total;
  for (const c of CHEST_WEIGHTS) {
    r -= c.w;
    if (r <= 0) return CHEST_TYPES[c.type];
  }
  return CHEST_TYPES.coin;
}
