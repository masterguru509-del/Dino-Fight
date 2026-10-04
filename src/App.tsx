import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  SaveData,
  loadSaveData,
  persistSaveData,
  PRICES,
  getPlayerEvo,
  EVO_NAMES,
  EVO_COLORS,
  cannonStarsFor,
  cannonDamage,
  cannonBulletCount,
  medkitHeal,
  totalArmorBonus,
  damageReduction,
  calcEnemyEvo,
  evoMult,
  WEATHERS,
  WeatherType,
  pickChestType,
  ChestType,
  DEFAULT_SAVE,
  CANNON_NAMES,
  SHIELD_NAMES,
} from './types/game';
import { AudioEngine } from './audio/AudioEngine';
import {
  createDinoRig,
  rebuildCannonMesh,
  updateDinoAppearance,
  setDinoSpecies,
  createPetMesh,
  createChestMesh,
  createMedkitMesh,
  DinoRig,
  DinoSpecies,
} from './three/SceneEntities';
import { HUD } from './components/HUD';
import { ShopModal } from './components/ShopModal';
import { GameOverModal } from './components/GameOverModal';
import { BlueprintModal } from './components/BlueprintModal';
import { TouchControls } from './components/TouchControls';
import {
  Play,
  ShoppingBag,
  RotateCcw,
  Compass,
  Sparkles,
  Shield,
  Zap,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  Music,
  Save,
  Check,
} from 'lucide-react';

interface FloatingPopup {
  id: number;
  text: string;
  xPercent: number;
  yPercent: number;
  color: string;
}

interface Projectile3D {
  mesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
  velocity: THREE.Vector3;
  owner: 'player' | 'enemy' | 'pet';
  damage: number;
  radius: number;
  life: number;
}

interface CoverBoulder3D {
  group: THREE.Group;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  respawnTimer: number;
}

interface Footprint3D {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

interface Chest3D {
  position: THREE.Vector3;
  vy: number;
  falling: boolean;
  life: number;
  type: ChestType;
  forPlayer: boolean;
  mesh: THREE.Group;
}

interface Medkit3D {
  position: THREE.Vector3;
  vy: number;
  falling: boolean;
  life: number;
  level: number;
  mesh: THREE.Group;
}

interface Pet3D {
  type: 'dragon' | 'snake' | 'scorpion';
  level: number;
  position: THREE.Vector3;
  baseY: number;
  attackCd: number;
  bobPhase: number;
  mesh: THREE.Group;
}

interface Particle3D {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  gravity: number;
  life: number;
  maxLife: number;
}

interface Drop3D {
  position: THREE.Vector3;
  phase: 'falling' | 'landed';
  landedTimer: number;
  pickupProgress: number;
  mesh: THREE.Group;
}

const SPECIES_CONFIG: Array<{
  id: DinoSpecies;
  name: string;
  rarity: string;
  title: string;
  bonus: string;
  accent: string;
}> = [
  {
    id: 'rex',
    name: 'Тираннозавр Рекс',
    rarity: 'РЕДКИЙ',
    title: 'Король Острова',
    bonus: '+15% к урону всех пушек',
    accent: 'from-emerald-500/30 to-teal-500/20 border-emerald-400/60 text-emerald-300',
  },
  {
    id: 'triceratops',
    name: 'Трицератопс',
    rarity: 'РЕДКИЙ',
    title: 'Бронированный Титан',
    bonus: '+40 Макс. HP и крепкий щит (88%)',
    accent: 'from-amber-500/30 to-orange-500/20 border-amber-400/60 text-amber-300',
  },
  {
    id: 'raptor',
    name: 'Велоцираптор',
    rarity: 'ЭПИЧЕСКИЙ',
    title: 'Молниеносный Охотник',
    bonus: '+22% скорость бега и прыжка',
    accent: 'from-rose-500/30 to-pink-500/20 border-rose-400/60 text-rose-300',
  },
  {
    id: 'spinosaurus',
    name: 'Спинозавр',
    rarity: 'ЭПИЧЕСКИЙ',
    title: 'Владыка Лагуны',
    bonus: '+30% скорость заряда и Ярости',
    accent: 'from-purple-500/30 to-fuchsia-500/20 border-purple-400/60 text-purple-300',
  },
  {
    id: 'ankylosaurus',
    name: 'Анкилозавр-Титан',
    rarity: 'ЛЕГЕНДАРНЫЙ',
    title: 'Зеркальный Бастион',
    bonus: '+25 HP · Щит [E] отражает снаряды во врага!',
    accent: 'from-lime-500/30 to-emerald-500/20 border-lime-400/60 text-lime-300',
  },
  {
    id: 'stegosaurus',
    name: 'Электро-Стегозавр',
    rarity: 'ЛЕГЕНДАРНЫЙ',
    title: 'Плазменный Снайпер',
    bonus: '+25% скорость ядер и электро-урон',
    accent: 'from-sky-500/30 to-blue-500/20 border-sky-400/60 text-sky-300',
  },
  {
    id: 'pteranodon',
    name: 'Кибер-Птеранодон',
    rarity: 'МИФИЧЕСКИЙ',
    title: 'Властелин Небес',
    bonus: 'Планирование в прыжке +40% урон сверху',
    accent: 'from-cyan-500/30 to-teal-500/20 border-cyan-400/60 text-cyan-300',
  },
  {
    id: 'mecha_rex',
    name: 'Меха-Доминатор',
    rarity: 'МИФИЧЕСКИЙ',
    title: 'Киборг Омега',
    bonus: '+1 дополнительное ядро при каждом выстреле!',
    accent: 'from-amber-400/35 to-rose-500/25 border-amber-300/80 text-amber-200',
  },
];

const ENEMY_SPECIES_ROSTER: DinoSpecies[] = [
  'raptor',
  'triceratops',
  'spinosaurus',
  'ankylosaurus',
  'stegosaurus',
  'pteranodon',
  'rex',
  'mecha_rex',
];

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [save, setSave] = useState<SaveData>(() => loadSaveData());
  const saveRef = useRef<SaveData>(save);
  saveRef.current = save;

  const [selectedSpecies, setSelectedSpecies] = useState<DinoSpecies>(
    () => (save.selectedSpecies as DinoSpecies) || 'rex'
  );
  const speciesRef = useRef<DinoSpecies>(selectedSpecies);
  speciesRef.current = selectedSpecies;

  const [justSavedUI, setJustSavedUI] = useState<boolean>(false);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);

  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const difficultyRef = useRef<'easy' | 'normal' | 'hard'>('normal');
  difficultyRef.current = difficulty;

  const [bossModeForced, setBossModeForced] = useState<boolean>(false);
  const bossModeForcedRef = useRef<boolean>(false);
  bossModeForcedRef.current = bossModeForced;

  const [showMainMenu, setShowMainMenu] = useState<boolean>(true);
  const [showPauseMenu, setShowPauseMenu] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showBlueprint, setShowBlueprint] = useState<boolean>(false);
  const [shopReturnTo, setShopReturnTo] = useState<'main' | 'pause' | 'game'>('main');

  const touchActionRef = useRef({
    moveX: 0,
    moveY: 0,
    lookX: 0,
    lookY: 0,
    isCharging: false,
    doDash: false,
    doJump: false,
    isBlocking: false,
  });

  const [hudState, setHudState] = useState({
    p1Hp: 100,
    p1MaxHp: 100,
    p2Hp: 90,
    p2MaxHp: 90,
    p2Poison: 0,
    stamina: 100,
    rage: 0,
    rageActive: 0,
    charge: 0,
    isPlayerBlocking: false,
    enemySpecies: 'raptor' as DinoSpecies,
    aiStatus: 'ГОТОВ' as 'ГОТОВ' | 'БЛОК' | 'УКЛОНЕНИЕ' | 'ОТСТУПЛЕНИЕ' | 'ОХОТА ЗА ДРОПОМ',
    isBoss: false,
    enemyEvo: 1,
    playerEvo: 1,
    weather: WEATHERS[0],
    combo: 0,
    buffSpeed: 0,
    buffDouble: 0,
    buffInvul: 0,
    hasDropCannon: false,
    dropPickupProgress: 0,
    winner: null as null | 'player' | 'ai' | 'draw',
    rewardCoins: 0,
    playerEvoMsg: '',
    enemyEvoMsg: '',
    shotsFired: 0,
    shotsHit: 0,
    damageDealt: 0,
    chestsOpened: 0,
  });

  const [popups, setPopups] = useState<FloatingPopup[]>([]);
  const popupIdCounter = useRef(1);

  const addPopup = useCallback((text: string, color = '#fbbf24') => {
    const id = popupIdCounter.current++;
    const xPercent = 42 + (Math.random() - 0.5) * 24;
    const yPercent = 32 + (Math.random() - 0.5) * 16;
    setPopups((prev) => [...prev.slice(-8), { id, text, xPercent, yPercent, color }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 1150);
  }, []);

  const engineRef = useRef<{
    paused: boolean;
    inMainMenu: boolean;
    running: boolean;
    spawnPetFn?: (type: 'dragon' | 'snake' | 'scorpion') => void;
    restartFn?: () => void;
    useMedkitFn?: (lvl: number) => void;
    triggerRageFn?: () => void;
    setSpeciesFn?: (sp: DinoSpecies) => void;
  }>({
    paused: true,
    inMainMenu: true,
    running: true,
  });

  useEffect(() => {
    engineRef.current.inMainMenu = showMainMenu;
    engineRef.current.paused = showMainMenu || showPauseMenu || showShop || showBlueprint;
  }, [showMainMenu, showPauseMenu, showShop, showBlueprint]);

  // Global ESC key handler for Pause Menu & Modals
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        if (showBlueprint) {
          setShowBlueprint(false);
          return;
        }
        if (showShop) {
          setShowShop(false);
          if (shopReturnTo === 'main') setShowMainMenu(true);
          else if (shopReturnTo === 'pause') setShowPauseMenu(true);
          return;
        }
        if (!showMainMenu) {
          setShowPauseMenu((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [showBlueprint, showShop, showMainMenu, shopReturnTo]);

  // --- MAIN THREE.JS SMOOTH ORGANIC JURASSIC ISLAND ENGINE ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    // 1. Golden Hour Tropical Sky Gradient CanvasTexture
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 2;
    skyCanvas.height = 512;
    const skyCtx = skyCanvas.getContext('2d')!;
    const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0, '#041f33');
    skyGrad.addColorStop(0.28, '#0284c7');
    skyGrad.addColorStop(0.58, '#38bdf8');
    skyGrad.addColorStop(0.82, '#fde047');
    skyGrad.addColorStop(1, '#fb923c');
    skyCtx.fillStyle = skyGrad;
    skyCtx.fillRect(0, 0, 2, 512);
    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0032);

    const camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Warm Tropical Sun & Lagoon Bounce Lighting
    const ambientLight = new THREE.AmbientLight(0xfffbeb, 0.82);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfef08a, 0x0d9488, 1.05);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.3);
    sunLight.position.set(65, 115, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -75;
    sunLight.shadow.camera.right = 75;
    sunLight.shadow.camera.top = 75;
    sunLight.shadow.camera.bottom = -75;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.95);
    rimLight.position.set(-60, 45, -60);
    scene.add(rimLight);

    // 3. Golden Tropical Sun with Additive Corona Glow
    const sunGroup = new THREE.Group();
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(16, 36, 36),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    sunGroup.add(sunMesh);

    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const hctx = haloCanvas.getContext('2d')!;
    const hgrad = hctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    hgrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    hgrad.addColorStop(0.45, 'rgba(251, 146, 60, 0.4)');
    hgrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    hctx.fillStyle = hgrad;
    hctx.fillRect(0, 0, 128, 128);
    const sunGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(haloCanvas),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sunGroup.add(sunGlow);
    sunGroup.position.set(125, 145, -110);
    scene.add(sunGroup);

    // 4. Glossy Turquoise Tropical Ocean with Shore Foam Ring
    const oceanGeo = new THREE.PlaneGeometry(900, 900, 32, 32);
    const oceanMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      roughness: 0.14,
      metalness: 0.15,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.92,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.65;
    scene.add(ocean);

    // 5. Smooth Sculpted Sandy Island Terrain (Expanded 2.2x for vast open running space!)
    const islandH = (x: number, z: number): number => {
      const r = Math.hypot(x, z);
      if (r < 95) return 0; // Vast smooth open combat beach
      if (r < 126) {
        const wave = Math.sin(x * 0.055) * Math.cos(z * 0.055);
        if (wave < -0.25) return -1.8;
        const t = (r - 95) / 31;
        return t * t * (wave + 1.1) * 4.5;
      }
      const t = Math.min(1, (r - 126) / 65);
      return t * t * (Math.sin(x * 0.04) * Math.cos(z * 0.04) + 1.35) * 14.5 - 1.2;
    };

    const sandGeo = new THREE.PlaneGeometry(560, 560, 120, 120);
    const pa = sandGeo.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      pa.setZ(i, islandH(pa.getX(i), -pa.getY(i)));
    }
    sandGeo.computeVertexNormals();

    const sandCanvas = document.createElement('canvas');
    sandCanvas.width = 512;
    sandCanvas.height = 512;
    const sgc = sandCanvas.getContext('2d')!;
    sgc.fillStyle = '#fde68a';
    sgc.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5000; i++) {
      sgc.fillStyle =
        Math.random() < 0.5 ? 'rgba(217, 119, 6, 0.12)' : 'rgba(255, 251, 235, 0.65)';
      sgc.beginPath();
      sgc.arc(Math.random() * 512, Math.random() * 512, 1.5, 0, Math.PI * 2);
      sgc.fill();
    }
    const sandTex = new THREE.CanvasTexture(sandCanvas);
    sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
    sandTex.repeat.set(55, 55);
    sandTex.colorSpace = THREE.SRGBColorSpace;

    const islandMesh = new THREE.Mesh(
      sandGeo,
      new THREE.MeshStandardMaterial({
        map: sandTex,
        roughness: 0.82,
        metalness: 0.04,
      })
    );
    islandMesh.rotation.x = -Math.PI / 2;
    islandMesh.receiveShadow = true;
    scene.add(islandMesh);

    // 6. Majestic Smoking Volcano on the Horizon
    const volcanoGroup = new THREE.Group();
    const volcanoConeGeo = new THREE.CylinderGeometry(16, 68, 75, 48, 16, true);
    const vPos = volcanoConeGeo.attributes.position;
    for (let i = 0; i < vPos.count; i++) {
      const vx = vPos.getX(i);
      const vy = vPos.getY(i);
      const vz = vPos.getZ(i);
      const noise = Math.sin(vx * 0.14 + vy * 0.1) * Math.cos(vz * 0.14) * 2.8;
      vPos.setX(i, vx + noise);
      vPos.setZ(i, vz + noise);
    }
    volcanoConeGeo.computeVertexNormals();
    const volcanoMesh = new THREE.Mesh(
      volcanoConeGeo,
      new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.92 })
    );
    volcanoMesh.position.y = 35;
    volcanoGroup.add(volcanoMesh);

    const lavaCaldera = new THREE.Mesh(
      new THREE.CircleGeometry(15.5, 36),
      new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide })
    );
    lavaCaldera.rotation.x = -Math.PI / 2;
    lavaCaldera.position.y = 71;
    volcanoGroup.add(lavaCaldera);
    volcanoGroup.position.set(-145, -4, -185);
    scene.add(volcanoGroup);

    // 7. Smooth High-Poly Ancient Sun Stone Altar (Visible ONLY in Main Menu so combat space is 100% open!) & Geyser Jump Pads
    const altarGroup = new THREE.Group();
    const altarStoneMat = new THREE.MeshPhysicalMaterial({
      color: 0xe7e5e4,
      roughness: 0.65,
      metalness: 0.08,
      clearcoat: 0.25,
    });
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });

    const outerSlab = new THREE.Mesh(
      new THREE.CylinderGeometry(8.6, 9.8, 0.35, 48),
      altarStoneMat
    );
    outerSlab.position.y = 0.17;
    outerSlab.receiveShadow = true;
    altarGroup.add(outerSlab);

    const innerSlab = new THREE.Mesh(
      new THREE.CylinderGeometry(5.2, 5.8, 0.28, 48),
      altarStoneMat
    );
    innerSlab.position.y = 0.35;
    innerSlab.receiveShadow = true;
    altarGroup.add(innerSlab);

    const innerRuneRing = new THREE.Mesh(new THREE.RingGeometry(5.9, 6.7, 48), runeMat);
    innerRuneRing.rotation.x = -Math.PI / 2;
    innerRuneRing.position.y = 0.37;
    altarGroup.add(innerRuneRing);
    scene.add(altarGroup);

    // 6 Smooth Sculpted Steam Geyser Jump Pads (Kept & spread across the spacious island!)
    const geyserPositions = [
      new THREE.Vector3(-36, 0, 0),
      new THREE.Vector3(36, 0, 0),
      new THREE.Vector3(0, 0, -36),
      new THREE.Vector3(0, 0, 36),
      new THREE.Vector3(-26, 0, -26),
      new THREE.Vector3(26, 0, 26),
    ];
    const geyserRings: THREE.Mesh[] = [];
    geyserPositions.forEach((gPos) => {
      const crater = new THREE.Mesh(
        new THREE.TorusGeometry(2.5, 0.65, 20, 36),
        new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.8 })
      );
      crater.rotation.x = Math.PI / 2;
      crater.position.copy(gPos).setY(0.18);
      scene.add(crater);

      const coreGlow = new THREE.Mesh(
        new THREE.CircleGeometry(2.2, 32),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      coreGlow.rotation.x = -Math.PI / 2;
      coreGlow.position.copy(gPos).setY(0.32);
      scene.add(coreGlow);
      geyserRings.push(coreGlow);
    });

    // 8. Smooth Curved TubeGeometry Palm Trees with Arching Organic Fronds (No blocky boxes!)
    const palmGroup = new THREE.Group();
    const palmLeaves: THREE.Group[] = [];
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const leafMat = new THREE.MeshPhysicalMaterial({
      color: 0x16a34a,
      roughness: 0.4,
      clearcoat: 0.35,
      side: THREE.DoubleSide,
    });
    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });

    const createSmoothPalmTree = (x: number, z: number, scale = 1) => {
      const tree = new THREE.Group();
      const leanAngle = Math.random() * Math.PI * 2;
      const leanDist = 2.6 * scale;
      const height = 11.2 * scale;

      // Smooth curved spline trunk
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(leanAngle) * leanDist * 0.35,
          height * 0.35,
          Math.sin(leanAngle) * leanDist * 0.35
        ),
        new THREE.Vector3(
          Math.cos(leanAngle) * leanDist * 0.75,
          height * 0.7,
          Math.sin(leanAngle) * leanDist * 0.75
        ),
        new THREE.Vector3(
          Math.cos(leanAngle) * leanDist,
          height,
          Math.sin(leanAngle) * leanDist
        ),
      ]);

      const trunkGeo = new THREE.TubeGeometry(curve, 18, 0.58 * scale, 12, false);
      const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
      trunkMesh.castShadow = true;
      tree.add(trunkMesh);

      const topX = Math.cos(leanAngle) * leanDist;
      const topZ = Math.sin(leanAngle) * leanDist;

      // Smooth Coconut Cluster
      for (let c = 0; c < 3; c++) {
        const cocoA = (c / 3) * Math.PI * 2;
        const coco = new THREE.Mesh(new THREE.SphereGeometry(0.45 * scale, 16, 16), coconutMat);
        coco.position.set(
          topX + Math.cos(cocoA) * 0.55 * scale,
          height - 0.25 * scale,
          topZ + Math.sin(cocoA) * 0.55 * scale
        );
        tree.add(coco);
      }

      // Smooth Arching Multi-Segment Organic Fronds
      const crown = new THREE.Group();
      crown.position.set(topX, height + 0.15 * scale, topZ);
      const frondCount = 7;
      for (let f = 0; f < frondCount; f++) {
        const fAngle = (f / frondCount) * Math.PI * 2;
        const frondPivot = new THREE.Group();
        frondPivot.rotation.y = fAngle;

        // Curved leaf blade formed from 3 smooth tapered capsules/spheres
        for (let seg = 0; seg < 3; seg++) {
          const blade = new THREE.Mesh(
            new THREE.SphereGeometry(0.55 * scale * (1 - seg * 0.22), 14, 10),
            leafMat
          );
          blade.scale.set(1.1, 0.14, 3.2);
          blade.position.set(0, -seg * 0.38 * scale, (1.2 + seg * 1.45) * scale);
          blade.rotation.x = 0.18 + seg * 0.22;
          blade.castShadow = true;
          frondPivot.add(blade);
        }
        crown.add(frondPivot);
      }
      tree.add(crown);
      palmLeaves.push(crown);

      tree.position.set(x, Math.max(-0.3, islandH(x, z) - 0.2), z);
      palmGroup.add(tree);
    };

    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const dist = 96 + Math.random() * 68;
      const scale = 0.88 + Math.random() * 0.85;
      createSmoothPalmTree(Math.cos(angle) * dist, Math.sin(angle) * dist, scale);
    }
    scene.add(palmGroup);

    // No interior boulder clutter — keep the entire combat beach 100% open for free running & long-range duels!
    const coverBoulders: CoverBoulder3D[] = [];

    // 10. Create Smooth Sculpted Wonder-Dinos (Player & AI Raptor — spawned at long range!)
    const dino1 = createDinoRig(1, speciesRef.current);
    const dino2 = createDinoRig(2, 'raptor');
    dino1.root.position.set(0, 0, 42);
    dino1.root.rotation.y = Math.PI;
    dino2.root.position.set(0, 0, -42);
    scene.add(dino1.root);
    scene.add(dino2.root);

    // 3D Manual Ground Aiming Reticle (Follows your mouse cursor on the sand — Zero Auto-Aim!)
    const aimReticleGroup = new THREE.Group();
    const aimOuterRing = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.9, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
      })
    );
    aimOuterRing.rotation.x = -Math.PI / 2;
    aimReticleGroup.add(aimOuterRing);

    const aimInnerDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 24),
      new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      })
    );
    aimInnerDot.rotation.x = -Math.PI / 2;
    aimInnerDot.position.y = 0.02;
    aimReticleGroup.add(aimInnerDot);
    aimReticleGroup.position.set(0, 0.08, 0);
    scene.add(aimReticleGroup);

    const manualAimWorldPos = new THREE.Vector3(0, 0, -42);
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(0, 0);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // 11. Controls, Camera & Physics State
    const keys: Record<string, boolean> = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false,
      shift: false,
      e: false,
      crouch: false,
    };

    const cameraControl = {
      yaw: 0,
      pitch: 0.34,
      roll: 0,
      distance: 32,
      minDist: 16,
      maxDist: 68,
    };

    const getSpeciesBonusHp = (sp: DinoSpecies) =>
      sp === 'triceratops' ? 40 : sp === 'ankylosaurus' ? 25 : sp === 'mecha_rex' ? 20 : 0;

    let p1State = {
      hp: 100 + totalArmorBonus(saveRef.current) + getSpeciesBonusHp(speciesRef.current),
      maxHp: 100 + totalArmorBonus(saveRef.current) + getSpeciesBonusHp(speciesRef.current),
      velocity: new THREE.Vector3(),
      vy: 0,
      onGround: true,
      speed: 30,
      walkPhase: 0,
      flash: 0,
      stamina: 100,
      rage: 0,
      rageActive: 0,
      isDashing: false,
      dashTimer: 0,
      dashDir: new THREE.Vector3(),
      invulTimer: 0,
      blocking: false,
      ducking: false,
      attackAnim: 0,
      buffSpeed: 0,
      buffDouble: 0,
      buffInvul: 0,
    };

    const initEvo = calcEnemyEvo(saveRef.current);
    const initIsBoss = bossModeForcedRef.current || (saveRef.current.totalWins > 0 && saveRef.current.totalWins % 3 === 0);
    const initEvoM = evoMult(initEvo) * (initIsBoss ? 1.28 : 1.0);
    let p2State = {
      hp: Math.round(90 * initEvoM * (initIsBoss ? 1.35 : 1.0)),
      maxHp: Math.round(90 * initEvoM * (initIsBoss ? 1.35 : 1.0)),
      velocity: new THREE.Vector3(),
      vy: 0,
      onGround: true,
      speed: 23,
      walkPhase: 0,
      flash: 0,
      blocking: false,
      blockTimer: 0,
      dodgeCooldown: 0,
      strafeDir: 1,
      strafeSwitchTimer: 2.2,
      tacticalState: 'ГОТОВ' as 'ГОТОВ' | 'БЛОК' | 'УКЛОНЕНИЕ' | 'ОТСТУПЛЕНИЕ' | 'ОХОТА ЗА ДРОПОМ',
      isBoss: initIsBoss,
      species: (initIsBoss
        ? 'mecha_rex'
        : ENEMY_SPECIES_ROSTER[saveRef.current.totalWins % ENEMY_SPECIES_ROSTER.length]) as DinoSpecies,
      lastShot: 0,
      evoLevel: initEvo,
      poison: 0,
      poisonTick: 0,
      attackAnim: 0,
      buffSpeed: 0,
      buffInvul: 0,
    };
    dino2.root.scale.setScalar(initEvoM);
    setDinoSpecies(dino2, p2State.species);

    let isCharging = false;
    let chargeAmount = 0;
    let lastPlayerShotTime = 0;
    let p1FootstepTimer = 0;
    let p2FootstepTimer = 0;
    let hasDropCannon = false;
    let dropTimer = 18;
    let activeDrop: Drop3D | null = null;
    let chestSpawnTimer = 6;
    let comboCount = 0;
    let comboTimer = 0;
    let screenShake = 0;
    let currentWeather = WEATHERS[0];
    let weatherTimer = 0;
    let winner: null | 'player' | 'ai' | 'draw' = null;
    let stats = { shotsFired: 0, shotsHit: 0, damageDealt: 0, chestsOpened: 0 };

    const projectiles: Projectile3D[] = [];
    const chests: Chest3D[] = [];
    const medkits: Medkit3D[] = [];
    const pets: Pet3D[] = [];
    const particles: Particle3D[] = [];
    const footprints: Footprint3D[] = [];

    // Helper: Spawn 3-Toed Dinosaur Footprint on the Golden Sand (Snow-Game style!)
    const footprintGeo = new THREE.CircleGeometry(0.65, 12);
    footprintGeo.rotateX(-Math.PI / 2);
    const spawnFootprint = (pos: THREE.Vector3, rotY: number, isDash = false) => {
      if (pos.y > 0.6) return;
      const fpMat = new THREE.MeshBasicMaterial({
        color: isDash ? 0x38bdf8 : 0xd97706,
        transparent: true,
        opacity: isDash ? 0.55 : 0.35,
        depthWrite: false,
      });
      const fp = new THREE.Mesh(footprintGeo, fpMat);
      fp.position.set(pos.x + (Math.random() - 0.5) * 0.6, 0.05, pos.z + (Math.random() - 0.5) * 0.6);
      fp.rotation.y = rotY;
      fp.scale.set(0.85, 1, 1.25);
      scene.add(fp);
      footprints.push({ mesh: fp, life: 3.2, maxLife: 3.2 });
    };

    // Helper: Ground Shadow Disc for Projectiles
    const projShadowGeo = new THREE.CircleGeometry(0.65, 16);
    projShadowGeo.rotateX(-Math.PI / 2);
    const createProjShadow = (colorHex: number) => {
      const sMesh = new THREE.Mesh(
        projShadowGeo,
        new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        })
      );
      sMesh.position.y = 0.08;
      scene.add(sMesh);
      return sMesh;
    };

    // Smooth Spherical Burst Particles
    const spawnBurst = (pos: THREE.Vector3, colorHex: number, count = 18) => {
      const pGeo = new THREE.SphereGeometry(0.24, 10, 10);
      const pMat = new THREE.MeshBasicMaterial({ color: colorHex });
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(pGeo, pMat);
        m.position.copy(pos);
        scene.add(m);
        const l = 0.45 + Math.random() * 0.45;
        particles.push({
          mesh: m,
          gravity: 26,
          life: l,
          maxLife: l,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            Math.random() * 14 + 4,
            (Math.random() - 0.5) * 20
          ),
        });
      }
    };

    // Trigger Primal Rage Ultimate + Dominator Super Weapon Orbital Volley (Q Key)
    const triggerPrimalRage = () => {
      if (p1State.rage < 100 || p1State.rageActive > 0) return;
      p1State.rage = 0;
      p1State.rageActive = 8.0;
      p1State.stamina = 100;
      AudioEngine.evoUp();
      spawnBurst(
        dino1.root.position.clone().add(new THREE.Vector3(0, 5, 0)),
        0xfbbf24,
        36
      );
      addPopup('☄️ СУПЕРОРУЖИЕ ДОМИНАТОРА + ЯРОСТЬ!', '#fbbf24');

      // Dominator Super Weapon: Rain 3 Colossal Orbital Meteors onto manual aim & enemy zone!
      const targets = [
        manualAimWorldPos.clone(),
        dino2.root.position.clone(),
        dino2.root.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10)),
      ];
      targets.forEach((tPos, idx) => {
        const startSky = new THREE.Vector3(tPos.x + (idx - 1) * 4, 42 + idx * 6, tPos.z);
        const mOrb = new THREE.Mesh(
          new THREE.SphereGeometry(1.35, 20, 20),
          new THREE.MeshPhysicalMaterial({
            color: 0xf97316,
            emissive: 0xfbbf24,
            emissiveIntensity: 1.8,
            clearcoat: 1.0,
          })
        );
        mOrb.position.copy(startSky);
        scene.add(mOrb);
        const sMesh = createProjShadow(0xf97316);
        sMesh.position.set(tPos.x, 0.08, tPos.z);
        const toGround = new THREE.Vector3().subVectors(tPos.clone().setY(2), startSky).normalize();
        projectiles.push({
          mesh: mOrb,
          shadowMesh: sMesh,
          velocity: toGround.multiplyScalar(58),
          owner: 'player',
          damage: 34 * evoMult(getPlayerEvo(saveRef.current)),
          radius: 1.35,
          life: 2.5,
        });
      });
    };
    engineRef.current.triggerRageFn = triggerPrimalRage;

    // Live Species Switcher
    const applySpecies = (sp: DinoSpecies) => {
      speciesRef.current = sp;
      setDinoSpecies(dino1, sp);
      const maxHp = 100 + totalArmorBonus(saveRef.current) + getSpeciesBonusHp(sp);
      p1State.maxHp = maxHp;
      p1State.hp = maxHp;
      spawnBurst(
        dino1.root.position.clone().add(new THREE.Vector3(0, 4.5, 0)),
        0x34d399,
        22
      );
    };
    engineRef.current.setSpeciesFn = applySpecies;

    // Spawn 3D Companion Pet
    const spawnPet3D = (type: 'dragon' | 'snake' | 'scorpion') => {
      const s = saveRef.current;
      const lvl =
        type === 'dragon' ? s.dragonLevel : type === 'snake' ? s.snakeLevel : s.scorpionLevel;
      if (lvl <= 0) return;

      for (let i = pets.length - 1; i >= 0; i--) {
        if (pets[i].type === type) {
          scene.remove(pets[i].mesh);
          pets.splice(i, 1);
        }
      }

      const mesh = createPetMesh(type, lvl);
      const offsetX = type === 'dragon' ? -4.8 : type === 'snake' ? -4.2 : -6.2;
      const baseY = type === 'dragon' ? 6.8 : 0.8;
      const offsetZ = type === 'dragon' ? 2.5 : type === 'snake' ? -3.2 : 3.8;
      const pos = new THREE.Vector3(
        dino1.root.position.x + offsetX,
        baseY,
        dino1.root.position.z + offsetZ
      );
      mesh.position.copy(pos);
      scene.add(mesh);

      pets.push({
        type,
        level: lvl,
        position: pos,
        baseY,
        attackCd: 0.8,
        bobPhase: Math.random() * Math.PI * 2,
        mesh,
      });
    };

    const syncAllPets = () => {
      const s = saveRef.current;
      if ((s.dragonLevel || 1) > 0) spawnPet3D('dragon');
      if (s.snakeLevel > 0) spawnPet3D('snake');
      if (s.scorpionLevel > 0) spawnPet3D('scorpion');
    };

    engineRef.current.spawnPetFn = spawnPet3D;
    syncAllPets();

    // Use Medkit
    const useMedkit = (lvl: number) => {
      const s = structuredClone(saveRef.current);
      if ((s.inventory.medkit[lvl] || 0) <= 0) {
        addPopup(`НЕТ АПТЕЧЕК УР.${lvl}`, '#f87171');
        return;
      }
      if (p1State.hp >= p1State.maxHp) {
        addPopup('HP УЖЕ ПОЛНОЕ!', '#4ade80');
        return;
      }
      s.inventory.medkit[lvl]--;
      const heal = medkitHeal(lvl);
      p1State.hp = Math.min(p1State.maxHp, p1State.hp + heal);
      AudioEngine.pickup();
      spawnBurst(
        dino1.root.position.clone().add(new THREE.Vector3(0, 5, 0)),
        0x4ade80,
        24
      );
      addPopup(`+${heal} HP (АПТЕЧКА УР.${lvl})`, '#4ade80');
      persistSaveData(s);
      setSave(s);
    };
    engineRef.current.useMedkitFn = useMedkit;

    // Fire Player Cannon
    const firePlayerCannon = (chargeRatio: number) => {
      const now = performance.now() / 1000;
      const rageCooldownMult = p1State.rageActive > 0 ? 0.55 : 1.0;
      if (now - lastPlayerShotTime < 0.2 * rageCooldownMult) return;
      lastPlayerShotTime = now;

      const s = saveRef.current;
      const sp = speciesRef.current;
      const baseCount = hasDropCannon ? 2 : cannonBulletCount(s.cannonLevel);
      const count = baseCount + (sp === 'mecha_rex' ? 1 : 0);
      const chargeMultiplier = 1 + chargeRatio * 0.85;
      const speciesDmgMult =
        sp === 'rex' ? 1.15 : sp === 'stegosaurus' ? 1.12 : 1.0;
      const rageDmgMult = p1State.rageActive > 0 ? 1.35 : 1.0;

      // Dominator Talent 4: Geyser Sky-Strike + Pteranodon Aerial Bonus!
      const skyLvl = s.talents?.skyStrike || 0;
      const isAirborne = !p1State.onGround && dino1.root.position.y > 2.2;
      const pteraAirBonus = sp === 'pteranodon' && isAirborne ? 0.4 : 0;
      const skyStrikeMult = isAirborne
        ? 1.15 + [0, 0.2, 0.5, 0.85][skyLvl] + pteraAirBonus
        : 1.0;

      // Dominator Talent 1: Critical Caliber (Crit Roll!)
      const critLvl = s.talents?.crit || 0;
      const critChance = [0, 0.15, 0.28, 0.42][critLvl] || 0;
      const isCrit = Math.random() < critChance;
      const critMult = isCrit ? 2.0 : 1.0;

      let baseDmg = hasDropCannon ? 48 : cannonDamage(s, s.cannonLevel);
      baseDmg = Math.round(
        baseDmg *
          evoMult(getPlayerEvo(s)) *
          chargeMultiplier *
          speciesDmgMult *
          rageDmgMult *
          skyStrikeMult *
          critMult *
          (p1State.buffDouble > 0 ? 2 : 1) *
          (1 + Math.min(comboCount * 0.1, 0.5))
      );

      if (isCrit) {
        addPopup('💥 КРИТ ×2!', '#fde047');
      } else if (isAirborne && skyLvl > 0) {
        addPopup('☄️ АВИАУДАР СВЕРХУ!', '#38bdf8');
      }

      s.cannonStars[s.cannonLevel] = (s.cannonStars[s.cannonLevel] || 0) + 1;
      persistSaveData(s);

      const bulletColorMap: Record<string, number> = {
        default: 0xfacc15,
        fire: 0xf97316,
        ice: 0x38bdf8,
        poison: 0x4ade80,
        plasma: 0xc084fc,
      };
      const bColor = isCrit
        ? 0xfef08a
        : hasDropCannon
        ? 0xe879f9
        : bulletColorMap[s.bulletColor] || 0xfacc15;
      const bRadius =
        (0.58 + (s.cannonLevel - 1) * 0.1) *
        (1 + chargeRatio * 0.45) *
        (isCrit ? 1.38 : 1.0);

      // 100% Manual Aiming toward the player's 3D ground cursor (`manualAimWorldPos`) — Zero Auto-Aim!
      const dx = manualAimWorldPos.x - dino1.root.position.x;
      const dz = manualAimWorldPos.z - dino1.root.position.z;
      const horizDist = Math.hypot(dx, dz);

      const aimDir = new THREE.Vector3(dx, 0, dz);
      if (aimDir.lengthSq() < 0.001) {
        aimDir.set(-Math.sin(cameraControl.yaw), 0, -Math.cos(cameraControl.yaw));
      }
      aimDir.normalize();
      dino1.root.rotation.y = Math.atan2(aimDir.x, aimDir.z);

      dino1.root.updateMatrixWorld(true);
      const muzzlePos = new THREE.Vector3();
      dino1.inHandBall.getWorldPosition(muzzlePos);

      const bMod = (currentWeather.bulletMod || 1.0) * (sp === 'stegosaurus' ? 1.25 : 1.0);
      const speed = (68 + chargeRatio * 30) * bMod;
      const gMod = currentWeather.gravityMod || 1.0;
      const clampedDist = Math.max(10, Math.min(115, horizDist));
      const flightTime = clampedDist / Math.max(24, speed);
      const upwardVy = Math.min(
        22,
        Math.max(3.6, 0.5 * 18 * gMod * flightTime - 0.8 + chargeRatio * 3.2)
      );

      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.065;
        const shotDir = aimDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
        const vel = shotDir.multiplyScalar(speed);
        vel.y = upwardVy;

        const orbMesh = new THREE.Mesh(
          new THREE.SphereGeometry(bRadius, 20, 20),
          new THREE.MeshPhysicalMaterial({
            color: bColor,
            emissive: bColor,
            emissiveIntensity: 1.4,
            roughness: 0.08,
            clearcoat: 1.0,
          })
        );
        orbMesh.position.copy(muzzlePos);
        orbMesh.castShadow = true;
        scene.add(orbMesh);

        const shadowMesh = createProjShadow(0x0f172a);
        shadowMesh.position.set(muzzlePos.x, 0.08, muzzlePos.z);

        projectiles.push({
          mesh: orbMesh,
          shadowMesh,
          velocity: vel,
          owner: 'player',
          damage: baseDmg,
          radius: bRadius,
          life: 3.5,
        });
      }

      p1State.attackAnim = 0.25;
      stats.shotsFired += count;
      if (hasDropCannon) AudioEngine.shootDual();
      else AudioEngine.shoot();
      spawnBurst(muzzlePos, bColor, 12);
    };

    // Restart Match
    const restartGame = () => {
      const s = saveRef.current;
      const maxHp = 100 + totalArmorBonus(s) + getSpeciesBonusHp(speciesRef.current);
      p1State.hp = maxHp;
      p1State.maxHp = maxHp;
      p1State.velocity.set(0, 0, 0);
      p1State.vy = 0;
      p1State.onGround = true;
      p1State.stamina = 100;
      p1State.rage = 0;
      p1State.rageActive = 0;
      p1State.buffSpeed = 0;
      p1State.buffDouble = 0;
      p1State.buffInvul = 0;
      dino1.root.position.set(0, 0, 42);
      dino1.root.rotation.y = Math.PI;
      cameraControl.yaw = 0;

      const eEvo = calcEnemyEvo(s);
      const isBossNow =
        bossModeForcedRef.current || (s.totalWins > 0 && (s.totalWins + 1) % 3 === 0);
      const nextEnemySpecies: DinoSpecies = isBossNow
        ? 'mecha_rex'
        : ENEMY_SPECIES_ROSTER[(s.totalWins + Math.floor(Math.random() * 3)) % ENEMY_SPECIES_ROSTER.length];
      p2State.species = nextEnemySpecies;
      setDinoSpecies(dino2, nextEnemySpecies);
      const eMult = evoMult(eEvo) * (isBossNow ? 1.28 : 1.0);
      p2State.evoLevel = isBossNow ? Math.max(4, eEvo) : eEvo;
      p2State.isBoss = isBossNow;
      p2State.maxHp = Math.round(90 * eMult * (isBossNow ? 1.35 : 1.0));
      p2State.hp = p2State.maxHp;
      p2State.velocity.set(0, 0, 0);
      p2State.vy = 0;
      p2State.onGround = true;
      p2State.poison = 0;
      p2State.blocking = false;
      p2State.blockTimer = 0;
      p2State.tacticalState = 'ГОТОВ';
      dino2.root.position.set(0, 0, -42);
      dino2.root.rotation.y = 0;
      dino2.root.scale.setScalar(eMult);

      // Restore Destructible Cover Boulders
      coverBoulders.forEach((b) => {
        b.hp = b.maxHp;
        b.respawnTimer = 0;
        b.group.visible = true;
        b.group.scale.set(1, 1, 1);
      });

      hasDropCannon = false;
      dropTimer = 18;
      if (activeDrop) {
        scene.remove(activeDrop.mesh);
        activeDrop = null;
      }
      projectiles.forEach((p) => {
        scene.remove(p.mesh);
        scene.remove(p.shadowMesh);
      });
      projectiles.length = 0;
      chests.forEach((c) => scene.remove(c.mesh));
      chests.length = 0;
      medkits.forEach((m) => scene.remove(m.mesh));
      medkits.length = 0;

      // Re-sync and snap companion pets right next to dino1 on match start!
      syncAllPets();

      comboCount = 0;
      winner = null;
      stats = { shotsFired: 0, shotsHit: 0, damageDealt: 0, chestsOpened: 0 };
      engineRef.current.running = true;

      setHudState((prev) => ({
        ...prev,
        winner: null,
        p1Hp: maxHp,
        p1MaxHp: maxHp,
        p2Hp: p2State.maxHp,
        p2MaxHp: p2State.maxHp,
        isBoss: isBossNow,
        enemyEvo: p2State.evoLevel,
        playerEvo: getPlayerEvo(s),
        rage: 0,
        rageActive: 0,
      }));
    };
    engineRef.current.restartFn = restartGame;

    // Input Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (engineRef.current.paused) return;
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keys.w = true;
      if (code === 'KeyS' || code === 'ArrowDown') keys.s = true;
      if (code === 'KeyA' || code === 'ArrowLeft') keys.a = true;
      if (code === 'KeyD' || code === 'ArrowRight') keys.d = true;
      if (code === 'Space') {
        e.preventDefault();
        keys.space = true;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight') keys.shift = true;
      if (code === 'KeyE' || code === 'KeyR' || code === 'KeyC' || code === 'KeyX' || code === 'ControlLeft') {
        keys.e = true;
      }
      if (code === 'KeyF') firePlayerCannon(0.35);
      if (code === 'KeyQ') triggerPrimalRage();
      if (code === 'Digit1') useMedkit(1);
      if (code === 'Digit2') useMedkit(2);
      if (code === 'Digit3') useMedkit(3);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keys.w = false;
      if (code === 'KeyS' || code === 'ArrowDown') keys.s = false;
      if (code === 'KeyA' || code === 'ArrowLeft') keys.a = false;
      if (code === 'KeyD' || code === 'ArrowRight') keys.d = false;
      if (code === 'Space') keys.space = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') keys.shift = false;
      if (code === 'KeyE' || code === 'KeyR' || code === 'KeyC' || code === 'KeyX' || code === 'ControlLeft') {
        keys.e = false;
      }
    };

    let isRightMouseDown = false;
    let wasTouchCharging = false;

    const updateMouseWorldAim = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseNDC, camera);
      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const maxR = 95;
        const r = Math.hypot(hitPoint.x, hitPoint.z);
        if (r > maxR) {
          hitPoint.x = (hitPoint.x / r) * maxR;
          hitPoint.z = (hitPoint.z / r) * maxR;
        }
        manualAimWorldPos.set(hitPoint.x, 0.08, hitPoint.z);
        aimReticleGroup.position.copy(manualAimWorldPos);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (engineRef.current.paused || !engineRef.current.running) return;
      // Ignore clicks on UI buttons
      if ((e.target as HTMLElement)?.closest('button')) return;
      AudioEngine.init();
      updateMouseWorldAim(e.clientX, e.clientY);
      if (e.button === 0) {
        isCharging = true;
        chargeAmount = 0;
      } else if (e.button === 2) {
        isRightMouseDown = true;
        p1State.blocking = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (engineRef.current.paused) return;
      updateMouseWorldAim(e.clientX, e.clientY);
      if (isRightMouseDown || document.pointerLockElement === renderer.domElement) {
        cameraControl.yaw -= e.movementX * 0.0055;
        cameraControl.pitch = Math.max(
          0.08,
          Math.min(Math.PI / 2 - 0.15, cameraControl.pitch + e.movementY * 0.0055)
        );
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && isCharging) {
        isCharging = false;
        if (!engineRef.current.paused && engineRef.current.running) {
          updateMouseWorldAim(e.clientX, e.clientY);
          firePlayerCannon(chargeAmount);
        }
        chargeAmount = 0;
      } else if (e.button === 2) {
        isRightMouseDown = false;
        p1State.blocking = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      cameraControl.distance = Math.max(
        cameraControl.minDist,
        Math.min(cameraControl.maxDist, cameraControl.distance + e.deltaY * 0.025)
      );
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('contextmenu', handleContextMenu);

    // Pre-allocated vectors for 60 FPS loop
    const _vForward = new THREE.Vector3();
    const _vRight = new THREE.Vector3();
    const _vMoveDir = new THREE.Vector3();
    const _vTargetVel = new THREE.Vector3();
    const _vCamTarget = new THREE.Vector3();

    let lastTime = performance.now();
    let animFrameId = 0;
    let hudTick = 0;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const timeSec = now * 0.001;
      hudTick++;

      const s = saveRef.current;

      // Sync Dino Appearances & Armor
      rebuildCannonMesh(dino1, s.cannonLevel, hasDropCannon);
      updateDinoAppearance(dino1, getPlayerEvo(s), s.shieldLevel, s.armor);
      updateDinoAppearance(dino2, p2State.evoLevel, Math.min(5, p2State.evoLevel), {
        helmet: p2State.evoLevel >= 3 ? 2 : 0,
        vest: p2State.evoLevel >= 4 ? 3 : 0,
        chain: p2State.evoLevel >= 2 ? 1 : 0,
        boots: p2State.evoLevel >= 2 ? 2 : 0,
      });

      // Gentle Tropical Breeze on Palm Fronds & Ocean Shimmer
      palmLeaves.forEach((crown, idx) => {
        crown.rotation.z = Math.sin(timeSec * 1.8 + idx) * 0.055;
        crown.rotation.x = Math.cos(timeSec * 1.5 + idx) * 0.045;
      });
      ocean.position.y = -0.65 + Math.sin(timeSec * 1.6) * 0.12;
      innerRuneRing.rotation.z = timeSec * 0.35;
      geyserRings.forEach((gRing, idx) => {
        gRing.scale.setScalar(0.9 + Math.sin(timeSec * 4.5 + idx) * 0.15);
      });

      // Hide altar during combat so the center of the island is 100% open; show manual reticle in combat
      altarGroup.visible = engineRef.current.inMainMenu;
      aimReticleGroup.visible = !engineRef.current.inMainMenu && engineRef.current.running;
      aimOuterRing.rotation.z = timeSec * 2.2;
      aimReticleGroup.scale.setScalar(
        isCharging ? 1 + chargeAmount * 0.45 : 1 + Math.sin(timeSec * 5) * 0.08
      );

      // --- CINEMATIC LIVE 3D SHOWCASE WHEN IN MAIN MENU ---
      if (engineRef.current.inMainMenu) {
        // Position Hero Dino on the Golden Sun Altar for the Main Menu Showcase!
        dino1.root.position.set(0, 0.45, 0);
        dino1.root.rotation.y = timeSec * 0.45;
        dino1.bodyGroup.position.y = Math.sin(timeSec * 2.6) * 2.5;
        dino1.tailGroup.rotation.y = Math.sin(timeSec * 2.2) * 0.18;
        dino1.headGroup.rotation.z = Math.sin(timeSec * 1.8) * 0.05;

        // Animate Companion Pets orbiting around Hero Dino in Main Menu!
        pets.forEach((pet, idx) => {
          const orbitA = timeSec * 1.2 + idx * 2.1;
          pet.position.set(
            Math.cos(orbitA) * 4.5,
            pet.type === 'dragon' ? 6.2 + Math.sin(timeSec * 4) * 0.6 : 0.8,
            Math.sin(orbitA) * 4.5
          );
          pet.mesh.position.copy(pet.position);
          pet.mesh.rotation.y = -orbitA;
          if (pet.mesh.userData.wingL && pet.mesh.userData.wingR) {
            const flap = Math.sin(timeSec * 14) * 0.55;
            pet.mesh.userData.wingL.rotation.x = flap;
            pet.mesh.userData.wingR.rotation.x = -flap;
          }
        });

        const menuCamAngle = -timeSec * 0.22;
        const menuCamDist = 18.5;
        camera.position.set(
          Math.sin(menuCamAngle) * menuCamDist,
          7.2 + Math.sin(timeSec * 0.8) * 0.6,
          Math.cos(menuCamAngle) * menuCamDist
        );
        _vCamTarget.set(-2.2, 5.2, 0);
        camera.lookAt(_vCamTarget);
        renderer.render(scene, camera);
        return;
      }

      // If dino1 was sitting on the central altar (0,0.45,0) from Main Menu, place it at combat spawn
      if (
        Math.hypot(dino1.root.position.x, dino1.root.position.z) < 0.8 &&
        dino1.root.position.y > 0.3 &&
        p1State.onGround
      ) {
        dino1.root.position.set(0, 0, 42);
      }

      if (!engineRef.current.paused && engineRef.current.running) {
        // Weather Cycle
        weatherTimer += delta;
        if (weatherTimer > 32) {
          weatherTimer = 0;
          currentWeather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
          addPopup(`ПОГОДА: ${currentWeather.name}`, '#38bdf8');
        }

        // Buff & Primal Rage Timers
        if (p1State.buffSpeed > 0) p1State.buffSpeed = Math.max(0, p1State.buffSpeed - delta);
        if (p1State.buffDouble > 0) p1State.buffDouble = Math.max(0, p1State.buffDouble - delta);
        if (p1State.buffInvul > 0) p1State.buffInvul = Math.max(0, p1State.buffInvul - delta);
        if (p1State.invulTimer > 0) p1State.invulTimer = Math.max(0, p1State.invulTimer - delta);
        if (p1State.rageActive > 0) {
          p1State.rageActive = Math.max(0, p1State.rageActive - delta);
          p1State.stamina = Math.min(100, p1State.stamina + delta * 30);
        }
        if (comboTimer > 0) {
          comboTimer -= delta;
          if (comboTimer <= 0) comboCount = 0;
        }

        // Primal Berserk Visual Scale & Aura
        const targetPlayerScale =
          evoMult(getPlayerEvo(s)) * (p1State.rageActive > 0 ? 1.32 : 1.0);
        dino1.root.scale.lerp(
          new THREE.Vector3(targetPlayerScale, targetPlayerScale, targetPlayerScale),
          delta * 8
        );
        const auraMat = dino1.auraMesh.material as THREE.MeshBasicMaterial;
        auraMat.opacity =
          p1State.rageActive > 0 || p1State.buffInvul > 0
            ? 0.55 + Math.sin(timeSec * 8) * 0.2
            : 0.0;

        // Touch Controls Sync
        const tc = touchActionRef.current;
        if (Math.abs(tc.lookX) > 0.01 || Math.abs(tc.lookY) > 0.01) {
          cameraControl.yaw -= tc.lookX * 0.04;
          cameraControl.pitch = Math.max(
            0.08,
            Math.min(Math.PI / 2 - 0.15, cameraControl.pitch + tc.lookY * 0.03)
          );
          manualAimWorldPos.set(
            dino1.root.position.x - Math.sin(cameraControl.yaw) * 38,
            0.08,
            dino1.root.position.z - Math.cos(cameraControl.yaw) * 38
          );
          aimReticleGroup.position.copy(manualAimWorldPos);
        }
        if (tc.isCharging && !wasTouchCharging) {
          wasTouchCharging = true;
          isCharging = true;
          chargeAmount = 0;
        } else if (!tc.isCharging && wasTouchCharging) {
          wasTouchCharging = false;
          isCharging = false;
          firePlayerCannon(chargeAmount);
          chargeAmount = 0;
        }

        // Charge Meter Update + Dynamic Cinematic Camera FOV Zoom + Dominator Haste Talent!
        const hasteLvl = s.talents?.haste || 0;
        const hasteMult = 1 + [0, 0.22, 0.44, 0.65][hasteLvl];
        const chargeSpeedMult =
          (speciesRef.current === 'spinosaurus' ? 1.25 : 1.0) *
          (p1State.rageActive > 0 ? 1.5 : 1.0) *
          hasteMult;
        if (isCharging) {
          chargeAmount = Math.min(1, chargeAmount + delta * 1.15 * chargeSpeedMult);
          dino1.inHandBall.visible = true;
          const ballScale = 0.5 + chargeAmount * 1.1;
          dino1.inHandBall.scale.setScalar(ballScale);
          camera.fov = THREE.MathUtils.lerp(camera.fov, 62 - chargeAmount * 8.5, delta * 7);
          camera.updateProjectionMatrix();
        } else {
          dino1.inHandBall.visible = false;
          if (Math.abs(camera.fov - 62) > 0.1) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, 62, delta * 9);
            camera.updateProjectionMatrix();
          }
        }

        // --- PLAYER 1 MOVEMENT & JUMP PHYSICS ---
        _vForward.set(-Math.sin(cameraControl.yaw), 0, -Math.cos(cameraControl.yaw)).normalize();
        _vRight.set(Math.cos(cameraControl.yaw), 0, -Math.sin(cameraControl.yaw)).normalize();

        _vMoveDir.set(0, 0, 0);
        if (keys.w) _vMoveDir.add(_vForward);
        if (keys.s) _vMoveDir.sub(_vForward);
        if (keys.d) _vMoveDir.add(_vRight);
        if (keys.a) _vMoveDir.sub(_vRight);
        if (Math.abs(tc.moveX) > 0.05 || Math.abs(tc.moveY) > 0.05) {
          _vMoveDir.addScaledVector(_vRight, tc.moveX);
          _vMoveDir.addScaledVector(_vForward, -tc.moveY);
        }
        if (_vMoveDir.lengthSq() > 0) _vMoveDir.normalize();

        let targetRoll = 0;
        if (keys.a) targetRoll = 0.03;
        if (keys.d) targetRoll = -0.03;
        cameraControl.roll = THREE.MathUtils.lerp(cameraControl.roll, targetRoll, delta * 8);

        // Dash Mechanic (Shift)
        if ((keys.shift || tc.doDash) && !p1State.isDashing && p1State.stamina >= 30) {
          tc.doDash = false;
          p1State.isDashing = true;
          p1State.dashTimer = 0.22;
          p1State.invulTimer = 0.32;
          p1State.stamina -= 30;
          p1State.dashDir.copy(_vMoveDir.lengthSq() > 0 ? _vMoveDir : _vForward);
          AudioEngine.jump();
          spawnBurst(dino1.root.position.clone().add(new THREE.Vector3(0, 2, 0)), 0x38bdf8, 12);
        }

        const speciesSpeedMult = speciesRef.current === 'raptor' ? 1.18 : 1.0;
        const effectiveSpeed =
          p1State.speed *
          speciesSpeedMult *
          (p1State.buffSpeed > 0 ? 1.4 : 1.0) *
          (p1State.rageActive > 0 ? 1.25 : 1.0) *
          (p1State.blocking ? 0.6 : 1.0);

        const accel = 130;
        const friction = 8.5;

        if (p1State.isDashing) {
          p1State.dashTimer -= delta;
          p1State.velocity.copy(p1State.dashDir).multiplyScalar(p1State.speed * 3.0);
          if (p1State.dashTimer <= 0) p1State.isDashing = false;
        } else {
          if (_vMoveDir.lengthSq() > 0) {
            _vTargetVel.copy(_vMoveDir).multiplyScalar(effectiveSpeed);
            p1State.velocity.lerp(_vTargetVel, Math.min(1, accel * delta * 0.1));
          } else {
            p1State.velocity.lerp(
              new THREE.Vector3(0, 0, 0),
              Math.min(1, friction * delta)
            );
          }
          p1State.stamina = Math.min(100, p1State.stamina + delta * 18);
        }

        dino1.root.position.addScaledVector(p1State.velocity, delta);

        // High Jump (SPACE)
        const jumpPower =
          speciesRef.current === 'raptor' || speciesRef.current === 'pteranodon' ? 33 : 28;
        if ((keys.space || tc.doJump) && p1State.onGround) {
          tc.doJump = false;
          p1State.vy = jumpPower;
          p1State.onGround = false;
          AudioEngine.jump();
          spawnBurst(dino1.root.position.clone(), 0xfde68a, 10);
        }

        // 6 Steam Geyser Super-Jump Pads
        for (const gPos of geyserPositions) {
          if (
            Math.hypot(dino1.root.position.x - gPos.x, dino1.root.position.z - gPos.z) < 2.8 &&
            dino1.root.position.y < 1.5 &&
            p1State.vy <= 10
          ) {
            p1State.vy = 40;
            p1State.onGround = false;
            AudioEngine.jump();
            spawnBurst(gPos.clone().setY(0.6), 0x38bdf8, 16);
            addPopup('ГЕЙЗЕР-ПРЫЖОК!', '#38bdf8');
          }
        }

        // Gravity (Pteranodon glides with 35% lighter aerial gravity!)
        dino1.root.position.y += p1State.vy * delta;
        if (!p1State.onGround) {
          const grav = speciesRef.current === 'pteranodon' && p1State.vy < 0 ? 32 : 52;
          p1State.vy -= grav * delta;
          if (dino1.root.position.y <= 0) {
            dino1.root.position.y = 0;
            p1State.vy = 0;
            p1State.onGround = true;
          }
        }

        // Expanded Island Arena Bounds (90m -> 180x180 open space!)
        const BOUND = 90;
        dino1.root.position.x = Math.max(-BOUND, Math.min(BOUND, dino1.root.position.x));
        dino1.root.position.z = Math.max(-BOUND, Math.min(BOUND, dino1.root.position.z));

        // 100% Manual Player Facing Direction (Faces your manual mouse aim reticle on the sand!)
        const aimDx = manualAimWorldPos.x - dino1.root.position.x;
        const aimDz = manualAimWorldPos.z - dino1.root.position.z;
        if (aimDx * aimDx + aimDz * aimDz > 0.5) {
          const targetAimYaw = Math.atan2(aimDx, aimDz);
          let p1RotDiff = targetAimYaw - dino1.root.rotation.y;
          while (p1RotDiff > Math.PI) p1RotDiff -= Math.PI * 2;
          while (p1RotDiff < -Math.PI) p1RotDiff += Math.PI * 2;
          dino1.root.rotation.y += p1RotDiff * Math.min(1, delta * 12);
        } else {
          dino1.root.rotation.y = cameraControl.yaw + Math.PI;
        }

        // Player Walk Animation & Sand Footprints
        const p1SpeedLen = p1State.velocity.length();
        if (p1SpeedLen > 1.0 && p1State.onGround) {
          p1State.walkPhase += delta * p1SpeedLen * 0.65;
          dino1.leftLeg.rotation.z = Math.sin(p1State.walkPhase) * 0.55;
          dino1.rightLeg.rotation.z = -Math.sin(p1State.walkPhase) * 0.55;
          dino1.bodyGroup.position.y = Math.abs(Math.sin(p1State.walkPhase * 2)) * 4.5;
          dino1.tailGroup.rotation.y = Math.sin(p1State.walkPhase) * 0.25;

          p1FootstepTimer += delta;
          if (p1FootstepTimer > (p1State.isDashing ? 0.09 : 0.28)) {
            p1FootstepTimer = 0;
            spawnFootprint(dino1.root.position, dino1.root.rotation.y, p1State.isDashing);
          }
        } else {
          dino1.leftLeg.rotation.z *= 0.85;
          dino1.rightLeg.rotation.z *= 0.85;
          dino1.bodyGroup.position.y = Math.sin(timeSec * 3) * 1.5;
        }

        // Player 3D Energy Shield Activation (Hold E, R, C, Control, or Right Mouse Button!)
        const wantShield = keys.e || isRightMouseDown || tc.isBlocking;
        if (wantShield && p1State.stamina > 2) {
          if (!p1State.blocking) {
            AudioEngine.block();
          }
          p1State.blocking = true;
          p1State.stamina = Math.max(0, p1State.stamina - delta * 9);
        } else {
          p1State.blocking = false;
        }
        dino1.shieldMesh.visible = p1State.blocking;
        if (p1State.blocking) {
          dino1.shieldMesh.rotation.y += delta * 2.8;
        }
        if (p1State.attackAnim > 0) {
          p1State.attackAnim = Math.max(0, p1State.attackAnim - delta);
          dino1.jawGroup.rotation.z = -0.35;
        } else {
          dino1.jawGroup.rotation.z = 0;
        }

        // --- SMART TACTICAL AI RAPTOR (SNOW-GAME + ЧУДО ДИНОЗАВРИКИ COMBINED) ---
        if (p2State.buffSpeed > 0) p2State.buffSpeed = Math.max(0, p2State.buffSpeed - delta);
        if (p2State.blockTimer > 0) {
          p2State.blockTimer -= delta;
          if (p2State.blockTimer <= 0) p2State.blocking = false;
        }

        const toP1 = new THREE.Vector3().subVectors(dino1.root.position, dino2.root.position);
        toP1.y = 0;
        const distToPlayer = toP1.length();
        const toP1Dir = toP1.clone().normalize();
        const angleToP1 = Math.atan2(toP1Dir.x, toP1Dir.z);

        // Smooth AI rotation toward player
        let rotDiff = angleToP1 - dino2.root.rotation.y;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        dino2.root.rotation.y += rotDiff * Math.min(1, delta * 7);

        // Pure 90-degree perpendicular tangent vector (Never spirals into the player!)
        const perpStrafer = new THREE.Vector3(-toP1Dir.z, 0, toP1Dir.x);

        p2State.strafeSwitchTimer -= delta;
        if (p2State.strafeSwitchTimer <= 0) {
          p2State.strafeSwitchTimer = 1.8 + Math.random() * 1.6;
          p2State.strafeDir = Math.random() < 0.5 ? 1 : -1;
        }

        const diffMode = difficultyRef.current;
        const aiSpeedMult =
          (diffMode === 'easy' ? 0.78 : diffMode === 'hard' ? 1.22 : 1.0) *
          (p2State.buffSpeed > 0 ? 1.35 : 1.0);
        const currentAiSpeed = p2State.speed * aiSpeedMult;

        // 1. Check if AI should contest a landed Medkit or Chest (from ЧУДО ДИНОЗАВРИКИ!)
        let lootTarget: THREE.Vector3 | null = null;
        if (p2State.hp < p2State.maxHp * 0.75 && medkits.length > 0) {
          const m = medkits[0];
          if (!m.falling && m.position.distanceTo(dino2.root.position) < 32) {
            lootTarget = m.position;
          }
        }
        if (!lootTarget && chests.length > 0 && distToPlayer > 16) {
          const c = chests[0];
          if (!c.falling && c.position.distanceTo(dino2.root.position) < 28) {
            lootTarget = c.position;
          }
        }

        // 2. Compute AI Desired Velocity across 3 Long-Range Tactical Distance Zones (34m - 60m!)
        const aiDesiredMove = new THREE.Vector3();
        const lowHpRetreat = p2State.hp < p2State.maxHp * 0.32;

        if (lootTarget && distToPlayer > 22) {
          // Sprint toward chest or medkit!
          aiDesiredMove.subVectors(lootTarget, dino2.root.position).setY(0).normalize();
          p2State.tacticalState = 'ОХОТА ЗА ДРОПОМ';
        } else if (distToPlayer < 34 || (lowHpRetreat && distToPlayer < 45)) {
          // ZONE A: Too Close (< 34m)! Actively back away + diagonal kite!
          aiDesiredMove
            .copy(toP1Dir)
            .multiplyScalar(-0.9)
            .addScaledVector(perpStrafer, p2State.strafeDir * 0.52)
            .normalize();
          p2State.tacticalState = 'ОТСТУПЛЕНИЕ';

          // If player rushes within 22m, perform an athletic backward jump-hop away!
          if (distToPlayer < 22 && p2State.onGround && p2State.dodgeCooldown <= 0) {
            p2State.vy = 25;
            p2State.onGround = false;
            p2State.velocity.copy(toP1Dir).multiplyScalar(-currentAiSpeed * 1.55);
            p2State.dodgeCooldown = 1.8;
            spawnBurst(dino2.root.position.clone(), 0xfde68a, 10);
          }
        } else if (distToPlayer > 60) {
          // ZONE C: Too Far (> 60m)! Close in along a curved flank
          aiDesiredMove
            .copy(toP1Dir)
            .multiplyScalar(0.78)
            .addScaledVector(perpStrafer, p2State.strafeDir * 0.62)
            .normalize();
          p2State.tacticalState = 'ГОТОВ';
        } else {
          // ZONE B (34m - 60m): Spacious Long-Range Combat! Pure 90-degree perpendicular strafe!
          aiDesiredMove.copy(perpStrafer).multiplyScalar(p2State.strafeDir);
          // Slight radial correction to stay near 46m sweet spot
          const radialError = (distToPlayer - 46) * 0.035;
          aiDesiredMove.addScaledVector(toP1Dir, radialError).normalize();
          p2State.tacticalState = 'ГОТОВ';
        }

        // 3. Reactive Projectile Evasion (Side-Dash / 3D Shield Block / High Jump)
        p2State.dodgeCooldown = Math.max(0, p2State.dodgeCooldown - delta);
        if (p2State.dodgeCooldown <= 0 && diffMode !== 'easy') {
          for (const pr of projectiles) {
            if (pr.owner === 'player') {
              const distToBall = dino2.root.position.distanceTo(pr.mesh.position);
              if (distToBall < 14.5) {
                const reactChance = diffMode === 'hard' ? 0.75 : 0.5;
                if (Math.random() < reactChance) {
                  const roll = Math.random();
                  if (roll < 0.45) {
                    // Reaction 1: Snow-Game Side-Step Dash!
                    const dashSign = Math.random() < 0.5 ? 1 : -1;
                    p2State.strafeDir = dashSign;
                    dino2.root.position.addScaledVector(perpStrafer, dashSign * 5.8);
                    p2State.velocity.copy(perpStrafer).multiplyScalar(dashSign * currentAiSpeed * 1.5);
                    spawnBurst(dino2.root.position.clone(), 0xfde68a, 14);
                    spawnFootprint(dino2.root.position, dino2.root.rotation.y, true);
                  } else if (roll < 0.8) {
                    // Reaction 2: Activate 3D Energy Shield!
                    p2State.blocking = true;
                    p2State.blockTimer = 1.25;
                    AudioEngine.block();
                  } else if (p2State.onGround) {
                    // Reaction 3: High Evade Jump over projectile!
                    p2State.vy = 26;
                    p2State.onGround = false;
                    AudioEngine.jump();
                  }
                  p2State.dodgeCooldown = diffMode === 'hard' ? 1.6 : 2.4;
                  break;
                }
              }
            }
          }
        }

        p2State.velocity.lerp(aiDesiredMove.multiplyScalar(currentAiSpeed), delta * 6.5);
        dino2.root.position.addScaledVector(p2State.velocity, delta);

        // Keep AI from getting stuck on Arena Edges (reverse strafe if near boundary)
        if (
          Math.abs(dino2.root.position.x) > BOUND - 3 ||
          Math.abs(dino2.root.position.z) > BOUND - 3
        ) {
          p2State.strafeDir *= -1;
        }
        dino2.root.position.x = Math.max(-BOUND, Math.min(BOUND, dino2.root.position.x));
        dino2.root.position.z = Math.max(-BOUND, Math.min(BOUND, dino2.root.position.z));

        dino2.root.position.y += p2State.vy * delta;
        if (!p2State.onGround) {
          p2State.vy -= 52 * delta;
          if (dino2.root.position.y <= 0) {
            dino2.root.position.y = 0;
            p2State.vy = 0;
            p2State.onGround = true;
          }
        }

        const aiVelLen = p2State.velocity.length();
        p2State.walkPhase += delta * aiVelLen * 0.6;
        dino2.leftLeg.rotation.z = Math.sin(p2State.walkPhase) * 0.55;
        dino2.rightLeg.rotation.z = -Math.sin(p2State.walkPhase) * 0.55;
        dino2.shieldMesh.visible = p2State.blocking;

        p2FootstepTimer += delta;
        if (p2FootstepTimer > 0.3 && p2State.onGround && aiVelLen > 2) {
          p2FootstepTimer = 0;
          spawnFootprint(dino2.root.position, dino2.root.rotation.y, false);
        }

        // AI Poison Tick
        if (p2State.poison > 0) {
          p2State.poisonTick += delta;
          if (p2State.poisonTick >= 0.8) {
            p2State.poisonTick = 0;
            const pDmg = Math.min(p2State.poison, Math.max(2, Math.round(p2State.poison * 0.25)));
            p2State.hp = Math.max(0, p2State.hp - pDmg);
            p2State.poison = Math.max(0, p2State.poison - pDmg);
            addPopup(`-${pDmg} ЯД`, '#a3e635');
          }
        }

        // AI Predictive Ballistic Cannon Fire (+ Alpha Boss Twin/Triple Volley!)
        const baseInterval = diffMode === 'easy' ? 2.6 : diffMode === 'hard' ? 1.45 : 1.95;
        const aiFireInterval = Math.max(
          0.85,
          baseInterval - p2State.evoLevel * 0.14 - (p2State.isBoss ? 0.25 : 0)
        );
        if (timeSec - p2State.lastShot > aiFireInterval) {
          p2State.lastShot = timeSec;
          const aiMuzzle = dino2.root.position.clone().add(new THREE.Vector3(0, 4.6, 0));

          // Predictive Lead Calculation (from Snow-Game!)
          const leadFactor = diffMode === 'hard' ? 0.55 : diffMode === 'normal' ? 0.3 : 0.0;
          const predictedP1 = dino1.root.position
            .clone()
            .addScaledVector(p1State.velocity, leadFactor)
            .add(new THREE.Vector3(0, 4.2, 0));

          const bMod = currentWeather.bulletMod || 1.0;
          const projSpeed = 62 * bMod;
          const flightTime = predictedP1.distanceTo(aiMuzzle) / projSpeed;
          const gravityComp = 0.5 * 18 * (currentWeather.gravityMod || 1.0) * flightTime;

          const baseDir = predictedP1.sub(aiMuzzle).normalize();
          const spreadAngles = p2State.isBoss ? [-0.14, 0, 0.14] : [0];

          spreadAngles.forEach((angOffset) => {
            const shotDir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angOffset);
            const vel = shotDir.multiplyScalar(projSpeed);
            vel.y += Math.min(14.5, gravityComp * 0.72);

            const orbRadius = p2State.isBoss ? 0.68 : 0.52;
            const orbColor = p2State.isBoss ? 0xf59e0b : 0xf43f5e;
            const aiOrb = new THREE.Mesh(
              new THREE.SphereGeometry(orbRadius, 16, 16),
              new THREE.MeshPhysicalMaterial({
                color: orbColor,
                emissive: orbColor,
                emissiveIntensity: 1.3,
                clearcoat: 1.0,
              })
            );
            aiOrb.position.copy(aiMuzzle);
            scene.add(aiOrb);

            const shadowMesh = createProjShadow(orbColor);
            shadowMesh.position.set(aiMuzzle.x, 0.08, aiMuzzle.z);

            projectiles.push({
              mesh: aiOrb,
              shadowMesh,
              velocity: vel,
              owner: 'enemy',
              damage: Math.round(14 * evoMult(p2State.evoLevel) * (p2State.isBoss ? 1.2 : 1.0)),
              radius: orbRadius,
              life: 3.5,
            });
          });
        }

        // --- PETS AI & HOMING FIREBALL ATTACKS (Dragon, Snake, Scorpion) ---
        pets.forEach((pet, idx) => {
          pet.bobPhase += delta * 4.5;
          const followAngle = dino1.root.rotation.y + Math.PI * 0.75 + idx * 0.85;
          const followDist = pet.type === 'dragon' ? 4.8 : 5.2;
          const targetX = dino1.root.position.x + Math.sin(followAngle) * followDist;
          const targetZ = dino1.root.position.z + Math.cos(followAngle) * followDist;
          pet.position.x = THREE.MathUtils.lerp(pet.position.x, targetX, Math.min(1, delta * 8));
          pet.position.z = THREE.MathUtils.lerp(pet.position.z, targetZ, Math.min(1, delta * 8));
          pet.position.y =
            (pet.type === 'dragon' ? dino1.root.position.y + 6.8 : 0.8) +
            Math.sin(pet.bobPhase) * 0.65;
          pet.mesh.position.copy(pet.position);
          pet.mesh.lookAt(dino2.root.position.x, dino2.root.position.y + 4.2, dino2.root.position.z);

          // Flap Dragon Wings actively in flight!
          if (pet.mesh.userData.wingL && pet.mesh.userData.wingR) {
            const flap = Math.sin(timeSec * 15 + idx) * 0.6;
            pet.mesh.userData.wingL.rotation.x = flap;
            pet.mesh.userData.wingR.rotation.x = -flap;
          }

          pet.attackCd -= delta;
          if (pet.attackCd <= 0 && p2State.hp > 0) {
            pet.attackCd = Math.max(1.15, 2.1 - pet.level * 0.28);
            const enemyTargetPos = dino2.root.position.clone().add(new THREE.Vector3(0, 4.4, 0));

            if (pet.type === 'dragon') {
              // Dragon breathes 1 (or 2 at Level 3) Homing Blazing Fireballs!
              const burstCount = pet.level >= 3 ? 2 : 1;
              spawnBurst(pet.position, 0xf97316, 10);
              AudioEngine.shoot();

              for (let b = 0; b < burstCount; b++) {
                const fbRadius = 0.64 + (pet.level - 1) * 0.1;
                const pOrb = new THREE.Mesh(
                  new THREE.SphereGeometry(fbRadius, 18, 18),
                  new THREE.MeshPhysicalMaterial({
                    color: 0xf97316,
                    emissive: 0xfef08a,
                    emissiveIntensity: 1.8,
                    roughness: 0.1,
                    clearcoat: 1.0,
                  })
                );
                const spawnOffset = new THREE.Vector3((b - (burstCount - 1) / 2) * 1.2, 0, 0);
                pOrb.position.copy(pet.position).add(spawnOffset);
                scene.add(pOrb);

                const dir = enemyTargetPos.clone().sub(pOrb.position).normalize();
                const shadowMesh = createProjShadow(0xf97316);
                shadowMesh.position.set(pOrb.position.x, 0.08, pOrb.position.z);

                projectiles.push({
                  mesh: pOrb,
                  shadowMesh,
                  velocity: dir.multiplyScalar(72),
                  owner: 'pet',
                  damage: (9 + pet.level * 5) * evoMult(getPlayerEvo(s)),
                  radius: fbRadius,
                  life: 3.8,
                });
              }
            } else {
              // Snake & Scorpion shoot Homing Venom / Plasma Stinger Orbs that poison on hit!
              const vColor = pet.type === 'snake' ? 0x4ade80 : 0xc084fc;
              const vOrb = new THREE.Mesh(
                new THREE.SphereGeometry(0.52, 14, 14),
                new THREE.MeshPhysicalMaterial({
                  color: vColor,
                  emissive: vColor,
                  emissiveIntensity: 1.5,
                })
              );
              vOrb.position.copy(pet.position);
              scene.add(vOrb);
              const dir = enemyTargetPos.clone().sub(pet.position).normalize();
              const shadowMesh = createProjShadow(vColor);
              shadowMesh.position.set(pet.position.x, 0.08, pet.position.z);

              const poisonAdd = (pet.type === 'snake' ? 6 : 9) * pet.level;
              p2State.poison += poisonAdd;

              projectiles.push({
                mesh: vOrb,
                shadowMesh,
                velocity: dir.multiplyScalar(68),
                owner: 'pet',
                damage: 6 * pet.level,
                radius: 0.52,
                life: 3.5,
              });
            }
          }
        });

        // --- DESTRUCTIBLE AMBER BOULDERS RESPAWN ---
        coverBoulders.forEach((b) => {
          if (b.hp <= 0) {
            b.respawnTimer -= delta;
            if (b.respawnTimer <= 0) {
              b.hp = b.maxHp;
              b.group.visible = true;
              b.group.scale.set(1, 1, 1);
              spawnBurst(b.position.clone().setY(2), 0xf59e0b, 14);
            }
          }
        });

        // --- PROJECTILES UPDATE, GROUND SHADOWS & COLLISIONS ---
        const gMod = currentWeather.gravityMod || 1.0;
        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i];
          p.life -= delta;

          if (p.owner === 'pet') {
            // Homing Dragon Fireballs fly straight and steer toward the enemy without falling into the sand!
            const targetCenter = dino2.root.position.clone().add(new THREE.Vector3(0, 4.4, 0));
            const desiredVel = targetCenter.sub(p.mesh.position).normalize().multiplyScalar(72);
            p.velocity.lerp(desiredVel, Math.min(1, delta * 5.5));
          } else {
            p.velocity.y -= 18 * gMod * delta;
          }
          p.mesh.position.addScaledVector(p.velocity, delta);

          // Update Ground Shadow Indicator on Sand!
          p.shadowMesh.position.set(p.mesh.position.x, 0.08, p.mesh.position.z);
          const heightFactor = Math.max(0.35, 1.3 - p.mesh.position.y * 0.045);
          p.shadowMesh.scale.setScalar(heightFactor);

          // Glowing Projectile Trail (Player Cannon + Pet Dragon Fireballs!)
          if (hudTick % 2 === 0 && (p.owner === 'player' || p.owner === 'pet')) {
            const trailColor = p.owner === 'pet' ? 0xf97316 : 0xfef08a;
            const trail = new THREE.Mesh(
              new THREE.SphereGeometry(p.radius * 0.55, 8, 8),
              new THREE.MeshBasicMaterial({ color: trailColor })
            );
            trail.position.copy(p.mesh.position);
            scene.add(trail);
            particles.push({
              mesh: trail,
              gravity: 0,
              life: 0.22,
              maxLife: 0.22,
              velocity: new THREE.Vector3(0, 0, 0),
            });
          }

          if (p.mesh.position.y <= 0 || p.life <= 0) {
            spawnBurst(p.mesh.position, 0xfde68a, 6);
            scene.remove(p.mesh);
            scene.remove(p.shadowMesh);
            projectiles.splice(i, 1);
            continue;
          }

          // Check Collision with Destructible Amber Boulders (Snow-Game Cover Physics!)
          let hitCover = false;
          for (const b of coverBoulders) {
            if (b.hp <= 0) continue;
            const distXZ = Math.hypot(
              p.mesh.position.x - b.position.x,
              p.mesh.position.z - b.position.z
            );
            if (distXZ < 3.4 + p.radius && p.mesh.position.y < 3.9 * b.group.scale.y) {
              b.hp -= p.damage;
              AudioEngine.block();
              spawnBurst(p.mesh.position, 0xf59e0b, 14);
              if (b.hp <= 0) {
                b.group.visible = false;
                b.respawnTimer = 20;
                spawnBurst(b.position.clone().setY(2), 0xfbbf24, 32);
                if (p.owner === 'player') {
                  const curS = structuredClone(saveRef.current);
                  curS.coins += 10;
                  persistSaveData(curS);
                  setSave(curS);
                  p1State.rage = Math.min(100, p1State.rage + 15);
                  addPopup('💎 ЯНТАРНАЯ СКАЛА РАЗРУШЕНА! (+10🪙)', '#fbbf24');
                }
              } else {
                const ratio = Math.max(0.35, b.hp / b.maxHp);
                b.group.scale.set(1, ratio, 1);
              }
              hitCover = true;
              break;
            }
          }
          if (hitCover) {
            scene.remove(p.mesh);
            scene.remove(p.shadowMesh);
            projectiles.splice(i, 1);
            continue;
          }

          if (p.owner === 'player' || p.owner === 'pet') {
            const eCenter = dino2.root.position.clone().add(new THREE.Vector3(0, 4.5, 0));
            if (p.mesh.position.distanceTo(eCenter) < 3.8 + p.radius) {
              const finalDmg = p2State.blocking ? Math.round(p.damage * 0.35) : p.damage;
              p2State.hp = Math.max(0, p2State.hp - finalDmg);
              stats.shotsHit++;
              stats.damageDealt += finalDmg;
              comboCount++;
              comboTimer = 4.0;
              const rageGain = speciesRef.current === 'spinosaurus' ? 15 : 12;
              p1State.rage = Math.min(100, p1State.rage + rageGain);

              // Dominator Talent 2: Predator Lifesteal (Vampirism on hit!)
              const vampLvl = saveRef.current.talents?.vamp || 0;
              if (p.owner === 'player' && vampLvl > 0 && p1State.hp < p1State.maxHp) {
                const healAmt = [0, 5, 10, 16][vampLvl] || 5;
                p1State.hp = Math.min(p1State.maxHp, p1State.hp + healAmt);
                addPopup(`+${healAmt} HP 🧛`, '#4ade80');
              }

              // Cannon Mastery Star XP on Hit!
              if (p.owner === 'player') {
                const curSave = structuredClone(saveRef.current);
                const oldStars = cannonStarsFor(curSave, curSave.cannonLevel);
                curSave.cannonStars[curSave.cannonLevel] =
                  (curSave.cannonStars[curSave.cannonLevel] || 0) + 4;
                const newStars = cannonStarsFor(curSave, curSave.cannonLevel);
                persistSaveData(curSave);
                setSave(curSave);
                if (newStars > oldStars) {
                  AudioEngine.star();
                  addPopup(`⭐ ПУШКА ПОЛУЧИЛА ${newStars} ЗВЕЗДУ! (+12% УРОНА)`, '#fde047');
                }
              }

              AudioEngine.hit();
              spawnBurst(p.mesh.position, p.owner === 'pet' ? 0xf97316 : 0xfbbf24, 16);
              addPopup(
                p.owner === 'pet' ? `🔥 -${finalDmg} HP (ДРАКОН)` : `-${finalDmg} HP`,
                p.owner === 'pet' ? '#fb923c' : '#fbbf24'
              );
              scene.remove(p.mesh);
              scene.remove(p.shadowMesh);
              projectiles.splice(i, 1);
              continue;
            }
          } else if (p.owner === 'enemy') {
            const pCenter = dino1.root.position.clone().add(new THREE.Vector3(0, 4.5, 0));
            if (p.mesh.position.distanceTo(pCenter) < 3.4 + p.radius) {
              if (p1State.invulTimer <= 0 && p1State.buffInvul <= 0) {
                const armorRed = damageReduction(s);
                const isShieldUp = p1State.blocking || tc.isBlocking;
                const shieldMult = isShieldUp
                  ? speciesRef.current === 'triceratops' || speciesRef.current === 'ankylosaurus'
                    ? 0.12
                    : 0.22
                  : 1.0;
                const dmg = Math.max(
                  1,
                  Math.round(p.damage * (1 - armorRed) * shieldMult)
                );
                p1State.hp = Math.max(0, p1State.hp - dmg);
                p1State.rage = Math.min(100, p1State.rage + 10);

                if (isShieldUp) {
                  AudioEngine.block();
                  spawnBurst(p.mesh.position, 0x38bdf8, 22);
                  addPopup(`🛡️ БЛОК ЩИТОМ (-${dmg} HP)`, '#38bdf8');

                  // Ankylosaurus-Titan Passive: Reflect projectile back at the enemy!
                  if (speciesRef.current === 'ankylosaurus') {
                    const refDir = new THREE.Vector3()
                      .subVectors(dino2.root.position.clone().add(new THREE.Vector3(0, 4.5, 0)), pCenter)
                      .normalize();
                    const refOrb = new THREE.Mesh(
                      new THREE.SphereGeometry(0.65, 16, 16),
                      new THREE.MeshPhysicalMaterial({
                        color: 0xa3e635,
                        emissive: 0x84cc16,
                        emissiveIntensity: 1.5,
                      })
                    );
                    refOrb.position.copy(pCenter);
                    scene.add(refOrb);
                    const refShadow = createProjShadow(0xa3e635);
                    projectiles.push({
                      mesh: refOrb,
                      shadowMesh: refShadow,
                      velocity: refDir.multiplyScalar(68),
                      owner: 'player',
                      damage: Math.round(p.damage * 0.85),
                      radius: 0.65,
                      life: 3.0,
                    });
                    addPopup('🛡️ РИКОШЕТ АНКИЛОЗАВРА!', '#a3e635');
                  }
                } else {
                  screenShake = 0.35;
                  AudioEngine.hit();
                  spawnBurst(p.mesh.position, 0xf43f5e, 16);
                  addPopup(`-${dmg} HP`, '#f87171');
                }
              } else {
                addPopup('УКЛОНЕНИЕ!', '#38bdf8');
              }
              scene.remove(p.mesh);
              scene.remove(p.shadowMesh);
              projectiles.splice(i, 1);
              continue;
            }
          }
        }

        // --- CHESTS, FALLING MEDKITS & SPECIAL DROP CANNON ---
        chestSpawnTimer -= delta;
        if (chestSpawnTimer <= 0 && chests.length < 3) {
          chestSpawnTimer = 8.5;
          const cType = pickChestType();
          const cMesh = createChestMesh(cType.rarity, cType.color);
          const pos = new THREE.Vector3(
            (Math.random() - 0.5) * 52,
            28,
            (Math.random() - 0.5) * 52
          );
          cMesh.position.copy(pos);
          scene.add(cMesh);
          chests.push({
            position: pos,
            vy: 0,
            falling: true,
            life: 20,
            type: cType,
            forPlayer: true,
            mesh: cMesh,
          });

          // Also 35% chance to drop a 3D Medkit capsule on the island!
          if (Math.random() < 0.35 && medkits.length < 2) {
            const mLvl = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
            const mMesh = createMedkitMesh(mLvl);
            const mPos = new THREE.Vector3(
              (Math.random() - 0.5) * 48,
              26,
              (Math.random() - 0.5) * 48
            );
            mMesh.position.copy(mPos);
            scene.add(mMesh);
            medkits.push({
              position: mPos,
              vy: 0,
              falling: true,
              life: 18,
              level: mLvl,
              mesh: mMesh,
            });
          }
        }

        // Update 3D Falling Medkits on Beach
        for (let i = medkits.length - 1; i >= 0; i--) {
          const m = medkits[i];
          if (m.falling) {
            m.vy -= 24 * delta;
            m.position.y += m.vy * delta;
            if (m.position.y <= 0) {
              m.position.y = 0;
              m.falling = false;
            }
            m.mesh.position.copy(m.position);
          } else {
            m.life -= delta;
            m.mesh.rotation.y += delta * 1.8;
            if (dino1.root.position.distanceTo(m.position) < 4.2) {
              const heal = medkitHeal(m.level);
              p1State.hp = Math.min(p1State.maxHp, p1State.hp + heal);
              AudioEngine.pickup();
              spawnBurst(m.position, 0x4ade80, 18);
              addPopup(`+${heal} HP (АПТЕЧКА УР.${m.level})`, '#4ade80');
              scene.remove(m.mesh);
              medkits.splice(i, 1);
              continue;
            }
            if (dino2.root.position.distanceTo(m.position) < 4.2) {
              const heal = medkitHeal(m.level);
              p2State.hp = Math.min(p2State.maxHp, p2State.hp + heal);
              spawnBurst(m.position, 0xf43f5e, 14);
              addPopup(`РАПТОР ПЕРЕХВАТИЛ АПТЕЧКУ (+${heal} HP)!`, '#f43f5e');
              scene.remove(m.mesh);
              medkits.splice(i, 1);
              continue;
            }
            if (m.life <= 0) {
              scene.remove(m.mesh);
              medkits.splice(i, 1);
            }
          }
        }

        for (let i = chests.length - 1; i >= 0; i--) {
          const c = chests[i];
          if (c.falling) {
            c.vy -= 26 * delta;
            c.position.y += c.vy * delta;
            if (c.position.y <= 0) {
              c.position.y = 0;
              c.falling = false;
            }
            c.mesh.position.copy(c.position);
          } else {
            c.life -= delta;
            c.mesh.rotation.y += delta * 1.4;
            if (dino1.root.position.distanceTo(c.position) < 4.5) {
              stats.chestsOpened++;
              AudioEngine.chestOpen();
              spawnBurst(c.position, 0xfbbf24, 22);
              const cur = structuredClone(saveRef.current);
              const coinGain = c.type.coins || 12;
              cur.coins += coinGain;

              if (c.type.heal) {
                p1State.hp = Math.min(p1State.maxHp, p1State.hp + c.type.heal);
              }
              if (c.type.medkit) {
                cur.inventory.medkit[1] = (cur.inventory.medkit[1] || 0) + c.type.medkit;
              }
              if (c.type.cannon) {
                const cLvl = c.type.cannon;
                cur.unlocked.cannon[cLvl] = true;
                cur.inventory.cannon[cLvl] = (cur.inventory.cannon[cLvl] || 0) + 1;
                if (cLvl > cur.cannonLevel) {
                  cur.cannonLevel = cLvl;
                }
              }
              if (c.type.pet) {
                const pType = c.type.pet;
                if (pType === 'dragon') cur.dragonLevel = Math.min(3, (cur.dragonLevel || 0) + 1);
                if (pType === 'snake') cur.snakeLevel = Math.min(3, (cur.snakeLevel || 0) + 1);
                if (pType === 'scorpion')
                  cur.scorpionLevel = Math.min(3, (cur.scorpionLevel || 0) + 1);
                saveRef.current = cur;
                spawnPet3D(pType);
              }

              persistSaveData(cur);
              setSave(cur);
              if (c.type.buff === 'speed') p1State.buffSpeed = 8;
              if (c.type.buff === 'doubleDmg') p1State.buffDouble = 8;
              if (c.type.buff === 'invul') p1State.buffInvul = 6;
              p1State.rage = Math.min(100, p1State.rage + 25);
              addPopup(`${c.type.name} (+${coinGain}🪙)`, c.type.color);
              scene.remove(c.mesh);
              chests.splice(i, 1);
              continue;
            }
            if (dino2.root.position.distanceTo(c.position) < 4.2) {
              p2State.buffSpeed = 6;
              p2State.blocking = true;
              p2State.blockTimer = 2.0;
              spawnBurst(c.position, 0xf43f5e, 16);
              addPopup('РАПТОР ЗАХВАТИЛ СУНДУК!', '#f43f5e');
              scene.remove(c.mesh);
              chests.splice(i, 1);
              continue;
            }
            if (c.life <= 0) {
              scene.remove(c.mesh);
              chests.splice(i, 1);
            }
          }
        }

        // Special Purple Drop Cannon
        if (!hasDropCannon && !activeDrop) {
          dropTimer -= delta;
          if (dropTimer <= 0) {
            dropTimer = 25;
            const dGroup = new THREE.Group();
            const crate = new THREE.Mesh(
              new THREE.SphereGeometry(1.6, 24, 24),
              new THREE.MeshPhysicalMaterial({
                color: 0xa855f7,
                emissive: 0x9333ea,
                emissiveIntensity: 0.7,
                clearcoat: 1.0,
              })
            );
            crate.position.y = 1.6;
            const ring = new THREE.Mesh(
              new THREE.RingGeometry(2.6, 3.4, 36),
              new THREE.MeshBasicMaterial({ color: 0xe879f9, side: THREE.DoubleSide })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.15;
            dGroup.add(crate, ring);
            const dPos = new THREE.Vector3(
              (Math.random() - 0.5) * 32,
              30,
              (Math.random() - 0.5) * 32
            );
            dGroup.position.copy(dPos);
            scene.add(dGroup);
            activeDrop = {
              position: dPos,
              phase: 'falling',
              landedTimer: 18,
              pickupProgress: 0,
              mesh: dGroup,
            };
            addPopup('СПЕЦ-ПУШКА СБРОШЕНА НА ОСТРОВ!', '#e879f9');
          }
        } else if (activeDrop) {
          if (activeDrop.phase === 'falling') {
            activeDrop.position.y -= 18 * delta;
            if (activeDrop.position.y <= 0) {
              activeDrop.position.y = 0;
              activeDrop.phase = 'landed';
            }
            activeDrop.mesh.position.copy(activeDrop.position);
          } else {
            activeDrop.mesh.rotation.y += delta * 2;
            const dist = dino1.root.position.distanceTo(activeDrop.position);
            if (dist < 4.8) {
              activeDrop.pickupProgress += delta * (keys.e ? 1.8 : 0.85);
              if (activeDrop.pickupProgress >= 1) {
                hasDropCannon = true;
                AudioEngine.dropGet();
                addPopup('ДВУХСТВОЛЬНАЯ ПУШКА АКТИВИРОВАНА!', '#e879f9');
                scene.remove(activeDrop.mesh);
                activeDrop = null;
              }
            } else {
              activeDrop.pickupProgress = Math.max(0, activeDrop.pickupProgress - delta * 0.5);
            }
          }
        }

        // Check Win / Loss
        if (p2State.hp <= 0 || p1State.hp <= 0) {
          engineRef.current.running = false;
          const cur = structuredClone(saveRef.current);
          const prevPlayerEvo = getPlayerEvo(cur);
          const prevEnemyEvo = calcEnemyEvo(cur);

          if (p2State.hp <= 0) {
            winner = 'player';
            const bossBonus = p2State.isBoss ? 2.2 : 1.0;
            const reward = Math.round((35 + p2State.evoLevel * 15) * bossBonus);
            cur.coins += reward;
            cur.totalWins++;
            cur.winStreak++;
            cur.lossStreak = 0;
            AudioEngine.win();
            persistSaveData(cur);
            setSave(cur);

            const newPEvo = getPlayerEvo(cur);
            const newEEvo = calcEnemyEvo(cur);
            setHudState((prev) => ({
              ...prev,
              winner: 'player',
              rewardCoins: reward,
              playerEvoMsg:
                newPEvo > prevPlayerEvo
                  ? `ЧУДО-ЭВОЛЮЦИЯ УР.${newPEvo}: ${EVO_NAMES[newPEvo]}!`
                  : '',
              enemyEvoMsg:
                newEEvo !== prevEnemyEvo
                  ? `Раптор эволюционировал до Ур.${newEEvo}`
                  : '',
              shotsFired: stats.shotsFired,
              shotsHit: stats.shotsHit,
              damageDealt: stats.damageDealt,
              chestsOpened: stats.chestsOpened,
            }));
          } else {
            winner = 'ai';
            const consolation = 12;
            cur.coins += consolation;
            cur.lossStreak++;
            cur.winStreak = 0;
            AudioEngine.lose();
            persistSaveData(cur);
            setSave(cur);
            setHudState((prev) => ({
              ...prev,
              winner: 'ai',
              rewardCoins: consolation,
              playerEvoMsg: '',
              enemyEvoMsg: '',
              shotsFired: stats.shotsFired,
              shotsHit: stats.shotsHit,
              damageDealt: stats.damageDealt,
              chestsOpened: stats.chestsOpened,
            }));
          }
        }
      }

      // Update Particles & Sand Footprints
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life -= delta;
        pt.velocity.y -= pt.gravity * delta;
        pt.mesh.position.addScaledVector(pt.velocity, delta);
        pt.mesh.scale.setScalar(Math.max(0.01, pt.life / pt.maxLife));
        if (pt.life <= 0) {
          scene.remove(pt.mesh);
          particles.splice(i, 1);
        }
      }

      for (let i = footprints.length - 1; i >= 0; i--) {
        const fp = footprints[i];
        fp.life -= delta;
        (fp.mesh.material as THREE.MeshBasicMaterial).opacity = (fp.life / fp.maxLife) * 0.38;
        if (fp.life <= 0) {
          scene.remove(fp.mesh);
          (fp.mesh.material as THREE.Material).dispose();
          footprints.splice(i, 1);
        }
      }

      // Third-Person Orbital Camera (Gameplay Mode)
      const pPos = dino1.root.position;
      const camX =
        pPos.x +
        cameraControl.distance * Math.sin(cameraControl.yaw) * Math.cos(cameraControl.pitch);
      const camY = pPos.y + cameraControl.distance * Math.sin(cameraControl.pitch) + 4.5;
      const camZ =
        pPos.z +
        cameraControl.distance * Math.cos(cameraControl.yaw) * Math.cos(cameraControl.pitch);

      camera.position.lerp(new THREE.Vector3(camX, Math.max(2.2, camY), camZ), 0.2);

      if (screenShake > 0.01) {
        camera.position.x += (Math.random() - 0.5) * screenShake * 1.8;
        camera.position.y += (Math.random() - 0.5) * screenShake * 1.8;
        screenShake *= 0.88;
      }

      _vCamTarget.set(pPos.x, pPos.y + 5.8, pPos.z);
      camera.lookAt(_vCamTarget);
      camera.rotation.z += cameraControl.roll;

      renderer.render(scene, camera);

      if (hudTick % 3 === 0) {
        setHudState((prev) => ({
          ...prev,
          p1Hp: Math.round(p1State.hp),
          p1MaxHp: Math.round(p1State.maxHp),
          p2Hp: Math.round(p2State.hp),
          p2MaxHp: Math.round(p2State.maxHp),
          p2Poison: p2State.poison,
          stamina: Math.round(p1State.stamina),
          rage: p1State.rage,
          rageActive: p1State.rageActive,
          charge: chargeAmount,
          isPlayerBlocking: p1State.blocking,
          enemySpecies: p2State.species,
          aiStatus: p2State.blocking
            ? 'БЛОК'
            : !p2State.onGround
            ? 'УКЛОНЕНИЕ'
            : p2State.tacticalState,
          isBoss: p2State.isBoss,
          enemyEvo: p2State.evoLevel,
          playerEvo: getPlayerEvo(s),
          weather: currentWeather,
          combo: comboCount,
          buffSpeed: p1State.buffSpeed,
          buffDouble: p1State.buffDouble,
          buffInvul: p1State.buffInvul,
          hasDropCannon,
          dropPickupProgress: activeDrop ? activeDrop.pickupProgress : 0,
        }));
      }
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [addPopup]);

  // Shop Handlers
  const handleBuyItem = (type: 'cannon' | 'shield' | 'medkit', lvl: number) => {
    const cur = structuredClone(save);
    const price = PRICES[type][lvl];
    if (cur.coins < price) return;
    cur.coins -= price;
    if (!cur.unlocked[type][lvl]) cur.unlocked[type][lvl] = true;
    cur.inventory[type][lvl] = (cur.inventory[type][lvl] || 0) + 1;

    if (type === 'cannon' && lvl > cur.cannonLevel) {
      if (cur.inventory.cannon[lvl] > 0) cur.inventory.cannon[lvl]--;
      cur.cannonLevel = lvl;
    }
    if (type === 'shield' && lvl > cur.shieldLevel) {
      if (cur.inventory.shield[lvl] > 0) cur.inventory.shield[lvl]--;
      cur.shieldLevel = lvl;
    }
    AudioEngine.coin();
    persistSaveData(cur);
    setSave(cur);
  };

  const handleBuyArmor = (slot: 'boots' | 'chain' | 'vest' | 'helmet', lvl: number) => {
    const cur = structuredClone(save);
    const price = PRICES.armor[slot][lvl];
    if (!cur.unlocked.armor[slot][lvl]) {
      if (cur.coins < price) return;
      cur.coins -= price;
      cur.unlocked.armor[slot][lvl] = true;
    }
    cur.armor[slot] = lvl;
    AudioEngine.armor();
    persistSaveData(cur);
    setSave(cur);
  };

  const handleBuyPet = (type: 'dragon' | 'snake' | 'scorpion', lvl: number) => {
    const cur = structuredClone(save);
    const price = PRICES.pet[type][lvl];
    if (cur.coins < price) return;
    cur.coins -= price;
    if (type === 'dragon') cur.dragonLevel = lvl;
    else if (type === 'snake') cur.snakeLevel = lvl;
    else cur.scorpionLevel = lvl;
    AudioEngine.coin();
    persistSaveData(cur);
    setSave(cur);
    setTimeout(() => {
      engineRef.current.spawnPetFn?.(type);
    }, 80);
  };

  const handleBuyBullet = (color: 'default' | 'fire' | 'ice' | 'poison' | 'plasma') => {
    const cur = structuredClone(save);
    if (color === 'default') {
      cur.bulletColor = 'default';
    } else {
      const price = PRICES.bullet[color];
      if (!cur.unlocked.bullet[color]) {
        if (cur.coins < price) return;
        cur.coins -= price;
        cur.unlocked.bullet[color] = true;
      }
      cur.bulletColor = color;
      AudioEngine.coin();
    }
    persistSaveData(cur);
    setSave(cur);
  };

  const handleMergeCannon = (lvl: number) => {
    const cur = structuredClone(save);
    if (lvl >= 5 || (cur.inventory.cannon[lvl] || 0) < 3) return;
    cur.inventory.cannon[lvl] -= 3;
    const nextLvl = lvl + 1;
    cur.inventory.cannon[nextLvl] = (cur.inventory.cannon[nextLvl] || 0) + 1;
    cur.unlocked.cannon[nextLvl] = true;
    if (cur.cannonLevel === lvl && cur.inventory.cannon[lvl] === 0 && lvl > 1) {
      cur.cannonLevel = nextLvl;
    }
    AudioEngine.merge();
    persistSaveData(cur);
    setSave(cur);
    addPopup(`СЛИЯНИЕ: 1× ПУШКА УР.${nextLvl}!`, '#c084fc');
  };

  const handleUpgradeTalent = (key: 'crit' | 'vamp' | 'haste' | 'skyStrike') => {
    const cur = structuredClone(save);
    if (!cur.talents) cur.talents = { crit: 0, vamp: 0, haste: 0, skyStrike: 0 };
    const curLvl = cur.talents[key] || 0;
    if (curLvl >= 3) return;
    const nextLvl = curLvl + 1;
    const price = PRICES.talent[key][nextLvl];
    if (cur.coins < price) return;
    cur.coins -= price;
    cur.talents[key] = nextLvl;
    cur.lastSavedAt = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    AudioEngine.evoUp();
    persistSaveData(cur);
    setSave(cur);
    addPopup(`⚡ ТАЛАНТ ПРОКАЧАН ДО УР.${nextLvl}!`, '#fde047');
  };

  const handleManualSave = () => {
    const cur = structuredClone(saveRef.current);
    cur.selectedSpecies = selectedSpecies;
    cur.lastSavedAt = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    persistSaveData(cur);
    setSave(cur);
    saveRef.current = cur;
    AudioEngine.init();
    AudioEngine.coin();
    setJustSavedUI(true);
    setTimeout(() => setJustSavedUI(false), 2000);
    addPopup('💾 ПРОГРЕСС И ПОКУПКИ СОХРАНЕНЫ!', '#34d399');
  };

  const handleResetProgress = () => {
    localStorage.removeItem('dinoFightLegendaryV4');
    const fresh = structuredClone(DEFAULT_SAVE);
    setSave(fresh);
    saveRef.current = fresh;
    setShowPauseMenu(false);
    engineRef.current.restartFn?.();
  };

  const playerEvo = getPlayerEvo(save);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sky-950 select-none">
      {/* Full-Viewport Three.js Tropical Dino Island Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Floating Popups */}
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {popups.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.xPercent}%`,
              top: `${p.yPercent}%`,
              color: p.color,
            }}
            className="animate-damage absolute font-display text-2xl md:text-3xl font-black tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] whitespace-nowrap"
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* HUD (Hidden during Main Menu so the 3D Hero Showcase shines) */}
      {!showMainMenu && (
        <>
          <HUD
            save={save}
            species={selectedSpecies}
            enemySpecies={hudState.enemySpecies}
            isPlayerBlocking={hudState.isPlayerBlocking}
            p1Hp={hudState.p1Hp}
            p1MaxHp={hudState.p1MaxHp}
            p2Hp={hudState.p2Hp}
            p2MaxHp={hudState.p2MaxHp}
            p2Poison={hudState.p2Poison}
            stamina={hudState.stamina}
            rage={hudState.rage}
            rageActive={hudState.rageActive}
            charge={hudState.charge}
            aiStatus={hudState.aiStatus}
            isBoss={hudState.isBoss}
            difficulty={difficulty}
            enemyEvo={hudState.enemyEvo}
            playerEvo={hudState.playerEvo}
            weather={hudState.weather}
            combo={hudState.combo}
            buffSpeed={hudState.buffSpeed}
            buffDouble={hudState.buffDouble}
            buffInvul={hudState.buffInvul}
            hasDropCannon={hudState.hasDropCannon}
            dropPickupProgress={hudState.dropPickupProgress}
            isMuted={isMuted}
            isMusicPlaying={isMusicPlaying}
            onToggleMute={() => setIsMuted(AudioEngine.toggleMute())}
            onToggleMusic={() => setIsMusicPlaying(AudioEngine.toggleMusic())}
            onToggleDifficulty={() =>
              setDifficulty((d) => (d === 'easy' ? 'normal' : d === 'normal' ? 'hard' : 'easy'))
            }
            onTriggerRage={() => engineRef.current.triggerRageFn?.()}
            onOpenShop={() => {
              setShopReturnTo('game');
              setShowShop(true);
            }}
            onSaveProgress={handleManualSave}
            onOpenAnalysis={() => setShowBlueprint(true)}
            onRestart={() => engineRef.current.restartFn?.()}
            onTogglePause={() => setShowPauseMenu((prev) => !prev)}
          />
          <TouchControls touchActionRef={touchActionRef} />
        </>
      )}

      {/* AAA ART-DIRECTOR LIVE 3D DIORAMA MAIN MENU */}
      {showMainMenu && (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-between p-4 md:p-8 pointer-events-none bg-gradient-to-r from-slate-950/85 via-slate-950/35 to-transparent"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Top Bar: Brand Badge & Player Economy / Audio */}
          <div className="flex flex-wrap items-center justify-between gap-4 w-full pointer-events-auto">
            <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-amber-400/35 px-4 py-2.5 rounded-2xl shadow-2xl">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#4ade80] animate-pulse" />
              <span className="font-display text-xs md:text-sm font-bold tracking-[0.2em] text-amber-300 uppercase">
                ЧУДО ДИНОЗАВРИКИ 3D · JURASSIC ISLAND EDITION
              </span>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 px-4 py-2 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono font-bold text-sm">
                <span>🪙</span>
                <span>{save.coins}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-mono font-bold text-sm">
                <Trophy className="w-3.5 h-3.5" />
                <span>{save.totalWins} Побед</span>
              </div>
              <button
                onClick={handleManualSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  justSavedUI
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_#10b981]'
                    : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/40'
                }`}
                title="Сохранить игровой прогресс и покупки"
              >
                {justSavedUI ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{justSavedUI ? 'Сохранено!' : 'Сохранить'}</span>
              </button>
              <button
                onClick={() => {
                  AudioEngine.init();
                  setIsMusicPlaying(AudioEngine.toggleMusic());
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isMusicPlaying
                    ? 'bg-amber-500/25 text-amber-300'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Фоновая музыка"
              >
                <Music className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMuted(AudioEngine.toggleMute())}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Звуковые эффекты"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Center-Left Command Deck + Right Live 3D Hero Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto w-full max-w-7xl mx-auto">
            {/* Left Glassmorphic Hero Card */}
            <div className="lg:col-span-6 pointer-events-auto rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-amber-400/35 p-6 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.75)] space-y-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold tracking-widest uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> 3D Арена · Эволюция · Кузница
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-black tracking-wide bg-gradient-to-r from-emerald-300 via-amber-200 to-cyan-300 bg-clip-text text-transparent leading-tight">
                  ЧУДО ДИНОЗАВРИКИ
                </h1>
                <p className="text-xs md:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Тропический остров с древним солнечным алтарём, действующим вулканом, паровыми
                  гейзерами для супер-прыжков и 4 классами динозавриков.
                </p>
              </div>

              {/* Equipment & Evolution Status Strip */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/75 border border-slate-800/90">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Эволюция
                  </div>
                  <div
                    style={{ color: EVO_COLORS[playerEvo] }}
                    className="font-display text-base md:text-lg font-black mt-0.5"
                  >
                    {EVO_NAMES[playerEvo]}
                  </div>
                  <div className="text-[10px] text-slate-500">Уровень {playerEvo}/5</div>
                </div>
                <div className="text-center border-x border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Оружие</div>
                  <div className="font-display text-base md:text-lg font-black text-emerald-400 mt-0.5">
                    Ур.{save.cannonLevel}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate px-1">
                    {CANNON_NAMES[save.cannonLevel]}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Защита и Броня
                  </div>
                  <div className="font-display text-base md:text-lg font-black text-sky-400 mt-0.5">
                    +{totalArmorBonus(save)} HP
                  </div>
                  <div className="text-[10px] text-slate-400 truncate px-1">
                    {SHIELD_NAMES[save.shieldLevel]}
                  </div>
                </div>
              </div>

              {/* Dino Species Selector (8 Playable Dominator Dinos with Live 3D Morphing!) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-300">
                  <span>Зоопарк Доминаторов (8 Классов · 3D-превью на алтаре):</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[230px] overflow-y-auto pr-1">
                  {SPECIES_CONFIG.map((sp) => {
                    const active = selectedSpecies === sp.id;
                    return (
                      <button
                        key={sp.id}
                        onClick={() => {
                          AudioEngine.init();
                          AudioEngine.coin();
                          setSelectedSpecies(sp.id);
                          engineRef.current.setSpeciesFn?.(sp.id);
                          const cur = structuredClone(saveRef.current);
                          cur.selectedSpecies = sp.id;
                          persistSaveData(cur);
                          setSave(cur);
                        }}
                        className={`text-left p-2.5 rounded-2xl border transition-all cursor-pointer ${
                          active
                            ? `bg-gradient-to-br ${sp.accent} shadow-lg scale-[1.01]`
                            : 'bg-slate-950/65 border-slate-800/90 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-display font-black text-xs md:text-sm tracking-wide text-white truncate">
                            {sp.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold uppercase tracking-wider shrink-0">
                            {sp.rarity}
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-300/90 font-medium mt-0.5 leading-snug">
                          {sp.bonus}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty & Alpha Boss Selector in Main Menu */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/75 border border-slate-800/90">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                    Сложность ИИ:
                  </span>
                  {(['easy', 'normal', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                        difficulty === d
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {d === 'easy' ? 'Лёгкая' : d === 'normal' ? 'Норма' : 'Хардкор'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setBossModeForced((b) => !b)}
                  className={`px-3 py-1 rounded-lg text-xs font-display font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    bossModeForced
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_#fbbf24]'
                      : 'bg-slate-900 text-amber-300 border-amber-500/40 hover:bg-slate-800'
                  }`}
                >
                  👑 {bossModeForced ? 'АЛЬФА-БОСС: ВКЛ' : 'ВЫЗВАТЬ АЛЬФА-БОССА'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={() => {
                    AudioEngine.init();
                    setIsMusicPlaying(true);
                    engineRef.current.restartFn?.();
                    setShowMainMenu(false);
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-display font-black text-lg md:text-xl tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  Вступить в Бой на Острове
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      AudioEngine.init();
                      setShopReturnTo('main');
                      setShowMainMenu(false);
                      setShowShop(true);
                    }}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Магазин и Кузница
                  </button>

                  <button
                    onClick={() => setShowBlueprint(true)}
                    className="py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-display font-bold text-sm tracking-wider uppercase transition-colors border border-slate-600/80 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-sky-400" />
                    Об Игре и Управлении
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live 3D Showcase Callouts */}
            <div className="hidden lg:flex lg:col-span-6 flex-col items-end justify-end h-full pointer-events-none">
              <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-4 max-w-sm text-right space-y-2 shadow-2xl">
                <div className="text-xs font-display font-bold uppercase tracking-widest text-amber-300">
                  Новые 3D-Механики Острова
                </div>
                <div className="text-xs text-slate-200 space-y-1">
                  <p>
                    🔥 <strong className="text-amber-300">Первобытная Ярость [Q]:</strong> Заполни
                    шкалу в бою для 8 секунд гигантского Берсерка!
                  </p>
                  <p>
                    🌊 <strong className="text-cyan-300">4 Паровых Гейзера:</strong> Встань на
                    светящийся кратер для супер-прыжка над пальмами!
                  </p>
                  <p>
                    💎 <strong className="text-emerald-300">Янтарные Скалы и Вулкан:</strong>{' '}
                    Тактические укрытия и падающие сундуки с баффами.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Controls Quick Legend */}
          <div className="hidden md:flex items-center justify-between text-xs text-slate-300 bg-slate-900/75 backdrop-blur-xl border border-slate-800 px-5 py-2.5 rounded-2xl pointer-events-auto">
            <div className="flex items-center gap-5">
              <span>
                <strong className="text-amber-300">W A S D</strong> — Свободный бег
              </span>
              <span>
                <strong className="text-amber-300">ПРОБЕЛ</strong> — Высокий прыжок
              </span>
              <span>
                <strong className="text-cyan-300">SHIFT</strong> — Реактивный рывок
              </span>
              <span>
                <strong className="text-emerald-300">ЛКМ / ПКМ</strong> — Заряд пушки / 3D-Щит и
                камера
              </span>
              <span>
                <strong className="text-orange-300">Q</strong> — Ульта «Первобытная Ярость»
              </span>
            </div>
            <span className="text-slate-400 font-mono">ESC — Пауза и Меню</span>
          </div>
        </div>
      )}

      {/* Pause Menu */}
      {showPauseMenu && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-md rounded-3xl bg-slate-900/95 border border-amber-400/35 p-7 text-center shadow-2xl space-y-4">
            <h2 className="font-display text-3xl font-black tracking-wider text-amber-400">
              ПАУЗА (ESC)
            </h2>
            <p className="text-sm font-mono tabular-nums text-slate-300">
              Монет: <strong className="text-amber-400">{save.coins}</strong> · Побед:{' '}
              <strong className="text-emerald-400">{save.totalWins}</strong>
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => setShowPauseMenu(false)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Продолжить бой
              </button>
              <button
                onClick={() => {
                  setShopReturnTo('pause');
                  setShowPauseMenu(false);
                  setShowShop(true);
                }}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Магазин и Кузница
              </button>
              <button
                onClick={handleManualSave}
                className={`w-full py-3 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  justSavedUI
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_16px_#10b981]'
                    : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/40'
                }`}
              >
                {justSavedUI ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {justSavedUI ? 'Прогресс сохранён!' : 'Сохранить прогресс и покупки'}
              </button>
              <button
                onClick={() => {
                  setShowPauseMenu(false);
                  engineRef.current.restartFn?.();
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Начать раунд заново
              </button>
              <button
                onClick={() => {
                  setShowPauseMenu(false);
                  setShowMainMenu(true);
                }}
                className="w-full py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-amber-400/30 text-amber-300 font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Выйти в Главное Меню (Сменить Динозавра)
              </button>
              <button
                onClick={handleResetProgress}
                className="w-full py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/30 text-rose-200 font-semibold text-xs uppercase tracking-wider mt-2 cursor-pointer"
              >
                Сброс прогресса
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {hudState.winner && (
        <div onMouseDown={(e) => e.stopPropagation()}>
          <GameOverModal
            winner={hudState.winner}
            rewardCoins={hudState.rewardCoins}
            playerEvoMsg={hudState.playerEvoMsg}
            enemyEvoMsg={hudState.enemyEvoMsg}
            shotsFired={hudState.shotsFired}
            shotsHit={hudState.shotsHit}
            damageDealt={hudState.damageDealt}
            chestsOpened={hudState.chestsOpened}
            onRestart={() => engineRef.current.restartFn?.()}
            onOpenShop={() => {
              setShopReturnTo('game');
              setShowShop(true);
            }}
          />
        </div>
      )}

      {/* Shop & Forge Modal */}
      {showShop && (
        <div onMouseDown={(e) => e.stopPropagation()}>
          <ShopModal
            save={save}
            hasDropCannon={hudState.hasDropCannon}
            onClose={() => {
              setShowShop(false);
              if (shopReturnTo === 'main') setShowMainMenu(true);
              else if (shopReturnTo === 'pause') setShowPauseMenu(true);
            }}
            onSaveProgress={handleManualSave}
            onBuyItem={handleBuyItem}
            onBuyArmor={handleBuyArmor}
            onBuyPet={handleBuyPet}
            onBuyBullet={handleBuyBullet}
            onMergeCannon={handleMergeCannon}
            onUpgradeTalent={handleUpgradeTalent}
          />
        </div>
      )}

      {/* Blueprint Modal */}
      {showBlueprint && (
        <div onMouseDown={(e) => e.stopPropagation()}>
          <BlueprintModal onClose={() => setShowBlueprint(false)} />
        </div>
      )}
    </div>
  );
}
