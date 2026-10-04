import * as THREE from 'three';

const ARMOR_TIER_HEX: Record<number, number> = {
  1: 0xcbd5e1, // Silver
  2: 0x38bdf8, // Steel
  3: 0xfbbf24, // Gold
  4: 0xa855f7, // Mithril
};

const CANNON_TIER_HEX: Record<number, number> = {
  1: 0x94a3b8,
  2: 0x8b5cf6,
  3: 0xf59e0b,
  4: 0xec4899,
  5: 0x06b6d4,
};

const SHIELD_TIER_HEX: Record<number, number> = {
  1: 0x3b82f6,
  2: 0x8b5cf6,
  3: 0xf59e0b,
  4: 0xec4899,
  5: 0x22d3ee,
};

export type DinoSpecies =
  | 'rex'
  | 'raptor'
  | 'triceratops'
  | 'spinosaurus'
  | 'ankylosaurus'
  | 'stegosaurus'
  | 'pteranodon'
  | 'mecha_rex';

export interface DinoRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  jawGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  tailGroup: THREE.Group;
  cannonGroup: THREE.Group;
  shieldMesh: THREE.Mesh;
  auraMesh: THREE.Mesh;
  evo2Scars: THREE.Group;
  evo3Spikes: THREE.Group;
  evo4Rings: THREE.Group;
  evo5Crown: THREE.Group;
  armorHelmet: THREE.Group;
  armorVest: THREE.Group;
  armorChain: THREE.Group;
  armorBootsLeft: THREE.Mesh;
  armorBootsRight: THREE.Mesh;
  torsoMesh: THREE.Mesh;
  inHandBall: THREE.Mesh;
  speciesGroup: THREE.Group;
  currentCannonKey: string;
  currentArmorKey: string;
  currentShieldLevel: number;
  currentEvo: number;
  currentSpecies: DinoSpecies;
}

/**
 * High-Subdivision Smooth Organic Toy-Grade 3D Dinosaur Rig
 * Uses MeshPhysicalMaterial with clearcoat & sheen so it looks like a Pixar / Nintendo vinyl toy, not Lego!
 */
export function createDinoRig(playerNum: 1 | 2, initialSpecies: DinoSpecies = 'rex'): DinoRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();

  const scaleRoot = new THREE.Group();
  scaleRoot.scale.setScalar(0.05);
  scaleRoot.rotation.y = -Math.PI / 2;
  root.add(scaleRoot);
  scaleRoot.add(bodyGroup);

  const skinColor = playerNum === 1 ? 0x10b981 : 0xf43f5e;
  const darkSkinColor = playerNum === 1 ? 0x047857 : 0xbe123c;
  const bellyColor = playerNum === 1 ? 0xa7f3d0 : 0xfecdd3;

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: skinColor,
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.45,
    clearcoatRoughness: 0.25,
  });
  const darkMat = new THREE.MeshPhysicalMaterial({
    color: darkSkinColor,
    roughness: 0.38,
    metalness: 0.06,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
  });
  const bellyMat = new THREE.MeshPhysicalMaterial({
    color: bellyColor,
    roughness: 0.5,
    metalness: 0.02,
    clearcoat: 0.2,
  });

  // Smooth Organic Torso + Seamless Neck Blend
  const torsoGeo = new THREE.SphereGeometry(52, 48, 36);
  torsoGeo.scale(1.14, 1.06, 0.94);
  const torso = new THREE.Mesh(torsoGeo, skinMat);
  torso.position.set(0, 88, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  // Seamless Sculpted Neck Bridge
  const neckGeo = new THREE.CapsuleGeometry(31, 34, 24, 32);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.set(24, 124, 0);
  neck.rotation.z = -0.42;
  neck.castShadow = true;
  bodyGroup.add(neck);

  // Soft Rounded Belly Plate
  const bellyGeo = new THREE.SphereGeometry(38, 36, 28);
  bellyGeo.scale(1.06, 0.96, 0.8);
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.position.set(17, 77, 0);
  bodyGroup.add(belly);

  // Smooth Rounded Dorsal Plates (Using Lathed / Rounded Capsules instead of sharp cones)
  for (let i = 0; i < 5; i++) {
    const plateGeo = new THREE.CapsuleGeometry(6.5, 14, 12, 20);
    const plate = new THREE.Mesh(plateGeo, darkMat);
    const angle = 0.35 + i * 0.22;
    plate.position.set(-Math.cos(angle) * 46, 94 + Math.sin(angle) * 44, 0);
    plate.rotation.z = 0.45 - i * 0.15;
    plate.castShadow = true;
    bodyGroup.add(plate);
  }

  // Species-Specific Features Group (Triceratops Frill/Horns or Spinosaurus Sail)
  const speciesGroup = new THREE.Group();
  bodyGroup.add(speciesGroup);

  // Smooth Curved Organic Tail (Multi-sphere seamless taper)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(-40, 74, 0);
  for (let t = 0; t < 6; t++) {
    const r = 24 - t * 3.4;
    const tSeg = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 20), darkMat);
    tSeg.scale.set(1.35, 0.95, 0.95);
    tSeg.position.set(-t * 13, t * 2.2, 0);
    tSeg.castShadow = true;
    tailGroup.add(tSeg);
  }
  bodyGroup.add(tailGroup);

  // Smooth Rounded Legs with Cute White Claws
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-10, 42, 24);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(12, 42, -24);

  const thighGeo = new THREE.SphereGeometry(22, 28, 24);
  thighGeo.scale(0.95, 1.35, 0.85);
  const footGeo = new THREE.SphereGeometry(18, 28, 20);
  footGeo.scale(1.35, 0.58, 0.98);
  const clawGeo = new THREE.CapsuleGeometry(3.2, 6, 8, 12);
  const clawMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.25 });

  [leftLeg, rightLeg].forEach((leg) => {
    const lMesh = new THREE.Mesh(thighGeo, darkMat);
    lMesh.castShadow = true;
    const lFoot = new THREE.Mesh(footGeo, darkMat);
    lFoot.position.set(8, -20, 0);
    leg.add(lMesh, lFoot);

    [-8, 0, 8].forEach((cz) => {
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.rotation.z = Math.PI / 2;
      claw.position.set(24, -22, cz);
      leg.add(claw);
    });
  });

  scaleRoot.add(leftLeg, rightLeg);

  //Cute Little Sculpted Dino Forearms
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(8, 18, 12, 18), skinMat);
    arm.position.set(38, 96, side * 34);
    arm.rotation.z = -0.65;
    arm.castShadow = true;
    bodyGroup.add(arm);
  });

  // Smooth Boots Armor on Legs
  const bootGeo = new THREE.CapsuleGeometry(19, 18, 16, 24);
  const bootMat = new THREE.MeshPhysicalMaterial({
    color: 0xcbd5e1,
    metalness: 0.78,
    roughness: 0.18,
    clearcoat: 0.6,
  });
  const armorBootsLeft = new THREE.Mesh(bootGeo, bootMat);
  armorBootsLeft.position.set(2, -8, 0);
  armorBootsLeft.visible = false;
  leftLeg.add(armorBootsLeft);

  const armorBootsRight = new THREE.Mesh(bootGeo, bootMat.clone());
  armorBootsRight.position.set(2, -8, 0);
  armorBootsRight.visible = false;
  rightLeg.add(armorBootsRight);

  // Smooth Sculpted Wonder-Dino Head
  const headGroup = new THREE.Group();
  headGroup.position.set(42, 150, 0);
  bodyGroup.add(headGroup);

  const skullGeo = new THREE.SphereGeometry(39, 40, 32);
  skullGeo.scale(1.18, 1.0, 0.94);
  const skull = new THREE.Mesh(skullGeo, skinMat);
  skull.position.set(12, 8, 0);
  skull.castShadow = true;
  headGroup.add(skull);

  const snoutGeo = new THREE.SphereGeometry(26, 36, 28);
  snoutGeo.scale(1.32, 0.88, 0.96);
  const snout = new THREE.Mesh(snoutGeo, skinMat);
  snout.position.set(45, 3, 0);
  snout.castShadow = true;
  headGroup.add(snout);

  // Sculpted Brow Ridges for Character Expression
  [-1, 1].forEach((side) => {
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(5.5, 16, 12, 16), darkMat);
    brow.position.set(26, 28, side * 22);
    brow.rotation.z = -0.15;
    brow.rotation.y = side * 0.25;
    headGroup.add(brow);
  });

  // Rosy Cheeks
  const blushMat = new THREE.MeshBasicMaterial({
    color: 0xf472b6,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  [-1, 1].forEach((side) => {
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(8.5, 24), blushMat);
    cheek.position.set(30, 4, side * 32);
    cheek.rotation.y = side * (Math.PI / 2);
    headGroup.add(cheek);
  });

  // Glossy Eyes with Dual Catchlights
  const eyeWhiteGeo = new THREE.SphereGeometry(11, 24, 24);
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilGeo = new THREE.SphereGeometry(6, 20, 20);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const glimmerGeo = new THREE.SphereGeometry(2.6, 12, 12);
  const glimmerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eye.position.set(24, 18, side * 24);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(30, 18, side * 28.5);
    const glimmer = new THREE.Mesh(glimmerGeo, glimmerMat);
    glimmer.position.set(33.5, 21.5, side * 30);
    headGroup.add(eye, pupil, glimmer);
  });

  // Smooth Rounded Jaw & Teeth
  const jawGroup = new THREE.Group();
  jawGroup.position.set(14, -10, 0);
  const jawGeo = new THREE.SphereGeometry(25, 32, 24);
  jawGeo.scale(1.36, 0.48, 0.9);
  const jawMesh = new THREE.Mesh(jawGeo, darkMat);
  jawMesh.position.set(22, -4, 0);
  jawGroup.add(jawMesh);

  const toothGeo = new THREE.ConeGeometry(2.8, 7.5, 12);
  for (let i = 0; i < 4; i++) {
    const tL = new THREE.Mesh(toothGeo, clawMat);
    tL.position.set(14 + i * 8, 3, 15);
    const tR = new THREE.Mesh(toothGeo, clawMat);
    tR.position.set(14 + i * 8, 3, -15);
    jawGroup.add(tL, tR);
  }
  headGroup.add(jawGroup);

  // Cannon Mount
  const cannonGroup = new THREE.Group();
  cannonGroup.position.set(44, 84, 32);
  bodyGroup.add(cannonGroup);

  // Growing Charge Energy Orb at Cannon Muzzle
  const inHandBall = new THREE.Mesh(
    new THREE.SphereGeometry(16, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
    })
  );
  inHandBall.position.set(125, 84, 32);
  inHandBall.visible = false;
  bodyGroup.add(inHandBall);

  // Shield 3D Forcefield (Full Glowing Energy Dome + Equatorial Pulse Ring!)
  const shieldGeo = new THREE.SphereGeometry(106, 36, 36);
  const shieldMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.48,
    roughness: 0.06,
    metalness: 0.15,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.set(10, 96, 0);

  const shieldRing = new THREE.Mesh(
    new THREE.TorusGeometry(108, 3.8, 16, 48),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.85,
    })
  );
  shieldRing.rotation.x = Math.PI / 2;
  shieldMesh.add(shieldRing);

  shieldMesh.visible = false;
  scaleRoot.add(shieldMesh);

  // Ground Aura Ring
  const auraGeo = new THREE.RingGeometry(52, 78, 48);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  auraMesh.position.set(0, 2, 0);
  scaleRoot.add(auraMesh);

  // Evolution Layers
  const evo2Scars = new THREE.Group();
  const scarMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x34d399,
    emissiveIntensity: 0.5,
    roughness: 0.2,
  });
  for (let i = 0; i < 3; i++) {
    const scar = new THREE.Mesh(new THREE.CapsuleGeometry(2.5, 22, 8, 16), scarMat);
    scar.position.set(-8 + i * 7, 98 - i * 11, 44);
    scar.rotation.z = -0.35;
    const scarR = scar.clone();
    scarR.position.z = -44;
    evo2Scars.add(scar, scarR);
  }
  evo2Scars.visible = false;
  bodyGroup.add(evo2Scars);

  const evo3Spikes = new THREE.Group();
  const goldSpikeMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.45,
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 0.8,
  });
  for (let i = 0; i < 5; i++) {
    const gSpike = new THREE.Mesh(new THREE.ConeGeometry(11.5, 38, 18), goldSpikeMat);
    const angle = 0.35 + i * 0.22;
    gSpike.position.set(-Math.cos(angle) * 46, 96 + Math.sin(angle) * 44, 0);
    gSpike.rotation.z = 0.45 - i * 0.15;
    evo3Spikes.add(gSpike);
  }
  evo3Spikes.visible = false;
  bodyGroup.add(evo3Spikes);

  const evo4Rings = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.9,
    roughness: 0.1,
  });
  const torus1 = new THREE.Mesh(new THREE.TorusGeometry(62, 2.8, 16, 48), ringMat);
  torus1.position.set(0, 88, 0);
  torus1.rotation.x = Math.PI / 3;
  const torus2 = new THREE.Mesh(new THREE.TorusGeometry(62, 2.8, 16, 48), ringMat);
  torus2.position.set(0, 88, 0);
  torus2.rotation.x = -Math.PI / 3;
  evo4Rings.add(torus1, torus2);
  evo4Rings.visible = false;
  bodyGroup.add(evo4Rings);

  const evo5Crown = new THREE.Group();
  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(25, 21, 15, 24), goldSpikeMat);
  crownBase.position.set(12, 42, 0);
  evo5Crown.add(crownBase);
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xef4444,
    emissiveIntensity: 1.0,
  });
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(5, 14, 14), goldSpikeMat);
    spike.position.set(12 + Math.cos(a) * 21, 54, Math.sin(a) * 21);
    const gem = new THREE.Mesh(new THREE.SphereGeometry(4.2, 16, 16), gemMat);
    gem.position.set(12 + Math.cos(a) * 22, 44, Math.sin(a) * 22);
    evo5Crown.add(spike, gem);
  }
  evo5Crown.visible = false;
  headGroup.add(evo5Crown);

  // Armor Groups
  const armorHelmet = new THREE.Group();
  const helmDome = new THREE.Mesh(
    new THREE.SphereGeometry(40, 32, 24, 0, Math.PI * 2, 0, Math.PI / 1.8),
    bootMat.clone()
  );
  helmDome.position.set(14, 18, 0);
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(6.5, 26, 16), goldSpikeMat);
  hornL.position.set(14, 38, 25);
  hornL.rotation.x = -0.45;
  const hornR = new THREE.Mesh(new THREE.ConeGeometry(6.5, 26, 16), goldSpikeMat);
  hornR.position.set(14, 38, -25);
  hornR.rotation.x = 0.45;
  armorHelmet.add(helmDome, hornL, hornR);
  armorHelmet.visible = false;
  headGroup.add(armorHelmet);

  const armorVest = new THREE.Group();
  const vestMesh = new THREE.Mesh(
    new THREE.SphereGeometry(51, 32, 24, 0, Math.PI * 2, Math.PI * 0.22, Math.PI * 0.55),
    bootMat.clone()
  );
  vestMesh.scale.set(1.14, 1.04, 0.95);
  vestMesh.position.set(0, 88, 0);
  armorVest.add(vestMesh);
  armorVest.visible = false;
  bodyGroup.add(armorVest);

  const armorChain = new THREE.Group();
  const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(23, 24, 24), bootMat.clone());
  pauldronL.position.set(12, 114, 38);
  const pauldronR = new THREE.Mesh(new THREE.SphereGeometry(23, 24, 24), bootMat.clone());
  pauldronR.position.set(12, 114, -38);
  armorChain.add(pauldronL, pauldronR);
  armorChain.visible = false;
  bodyGroup.add(armorChain);

  const rig: DinoRig = {
    root,
    bodyGroup,
    headGroup,
    jawGroup,
    leftLeg,
    rightLeg,
    tailGroup,
    cannonGroup,
    shieldMesh,
    auraMesh,
    evo2Scars,
    evo3Spikes,
    evo4Rings,
    evo5Crown,
    armorHelmet,
    armorVest,
    armorChain,
    armorBootsLeft,
    armorBootsRight,
    torsoMesh: torso,
    inHandBall,
    speciesGroup,
    currentCannonKey: '',
    currentArmorKey: '',
    currentShieldLevel: 0,
    currentEvo: 0,
    currentSpecies: 'rex',
  };

  rebuildCannonMesh(rig, 1, false);
  setDinoSpecies(rig, initialSpecies);
  return rig;
}

export function setDinoSpecies(rig: DinoRig, species: DinoSpecies) {
  if (rig.currentSpecies === species && rig.speciesGroup.children.length > 0) return;
  rig.currentSpecies = species;

  while (rig.speciesGroup.children.length > 0) {
    rig.speciesGroup.remove(rig.speciesGroup.children[0]);
  }

  const torsoMat = rig.torsoMesh.material as THREE.MeshPhysicalMaterial;
  const hornMat = new THREE.MeshPhysicalMaterial({
    color: 0xfef3c7,
    roughness: 0.25,
    clearcoat: 0.5,
  });

  if (species === 'rex') {
    torsoMat.color.setHex(0x10b981); // Emerald T-Rex
    torsoMat.metalness = 0.05;
    // Heavy Alpha Ridge Brow & Dorsal Plates
    for (let i = 0; i < 4; i++) {
      const ridge = new THREE.Mesh(
        new THREE.ConeGeometry(8 - i * 1.2, 22 - i * 2, 16),
        new THREE.MeshPhysicalMaterial({ color: 0x059669, roughness: 0.3 })
      );
      ridge.position.set(16 - i * 18, 148 - i * 12, 0);
      ridge.rotation.z = 0.35;
      rig.speciesGroup.add(ridge);
    }
  } else if (species === 'raptor') {
    torsoMat.color.setHex(0xf43f5e); // Crimson Raptor
    torsoMat.metalness = 0.05;
    // Feather crest on head
    for (let i = 0; i < 3; i++) {
      const crest = new THREE.Mesh(
        new THREE.CapsuleGeometry(4, 22, 8, 16),
        new THREE.MeshPhysicalMaterial({ color: 0xfbbf24, roughness: 0.3 })
      );
      crest.position.set(22 - i * 10, 192 - i * 4, 0);
      crest.rotation.z = 0.55;
      rig.speciesGroup.add(crest);
    }
  } else if (species === 'triceratops') {
    torsoMat.color.setHex(0xd97706); // Armored Amber Triceratops
    torsoMat.metalness = 0.08;
    // Armored Shield Frill behind head
    const frill = new THREE.Mesh(
      new THREE.CylinderGeometry(48, 42, 10, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xb45309, roughness: 0.35, clearcoat: 0.4 })
    );
    frill.rotation.z = Math.PI / 2 - 0.35;
    frill.position.set(22, 175, 0);
    // Two long brow horns + nose horn
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(7, 46, 16), hornMat);
    hornL.rotation.z = -Math.PI / 2 + 0.2;
    hornL.position.set(82, 174, 22);
    const hornR = hornL.clone();
    hornR.position.z = -22;
    const noseHorn = new THREE.Mesh(new THREE.ConeGeometry(6, 24, 16), hornMat);
    noseHorn.rotation.z = -Math.PI / 2 + 0.5;
    noseHorn.position.set(96, 164, 0);
    rig.speciesGroup.add(frill, hornL, hornR, noseHorn);
  } else if (species === 'spinosaurus') {
    torsoMat.color.setHex(0x7c3aed); // Royal Violet Boss Spinosaurus
    torsoMat.metalness = 0.08;
    // Giant Glowing Dorsal Sail on Back
    const sailGeo = new THREE.SphereGeometry(52, 32, 24);
    sailGeo.scale(1.1, 1.25, 0.16);
    const sail = new THREE.Mesh(
      sailGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0xec4899,
        emissive: 0xdb2777,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        clearcoat: 0.7,
      })
    );
    sail.position.set(-8, 145, 0);
    rig.speciesGroup.add(sail);
  } else if (species === 'ankylosaurus') {
    torsoMat.color.setHex(0x65a30d); // Olive-Gold Titan Ankylosaurus
    torsoMat.metalness = 0.22;
    // Heavy Armored Carapace Shell with Lateral Spikes + Tail Club
    const shellGeo = new THREE.SphereGeometry(56, 32, 24);
    shellGeo.scale(1.22, 0.78, 1.18);
    const shell = new THREE.Mesh(
      shellGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0x3f6212,
        roughness: 0.42,
        metalness: 0.35,
        clearcoat: 0.6,
      })
    );
    shell.position.set(-10, 108, 0);
    rig.speciesGroup.add(shell);

    for (let i = 0; i < 4; i++) {
      [-1, 1].forEach((side) => {
        const latSpike = new THREE.Mesh(new THREE.ConeGeometry(8, 28, 14), hornMat);
        latSpike.position.set(12 - i * 20, 106 - i * 5, side * 56);
        latSpike.rotation.x = side * (Math.PI / 2 - 0.25);
        rig.speciesGroup.add(latSpike);
      });
    }
    // Heavy Tail Mace Club
    const mace = new THREE.Mesh(
      new THREE.SphereGeometry(24, 24, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xfbbf24, metalness: 0.6, roughness: 0.25 })
    );
    mace.scale.set(1.3, 0.85, 1.4);
    mace.position.set(-142, 42, 0);
    rig.speciesGroup.add(mace);
  } else if (species === 'stegosaurus') {
    torsoMat.color.setHex(0x0284c7); // Cyber-Sapphire Electro Stegosaurus
    torsoMat.metalness = 0.15;
    // Double Row of Glowing Solar Diamond Dorsal Plates
    const plateMat = new THREE.MeshPhysicalMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.75,
      roughness: 0.18,
      clearcoat: 0.9,
    });
    for (let i = 0; i < 5; i++) {
      [-1, 1].forEach((side) => {
        const plate = new THREE.Mesh(new THREE.OctahedronGeometry(20 - i * 1.8, 1), plateMat);
        plate.scale.set(0.85, 1.45, 0.22);
        plate.position.set(18 - i * 22, 146 - i * 12, side * 14);
        plate.rotation.x = side * 0.22;
        rig.speciesGroup.add(plate);
      });
    }
  } else if (species === 'pteranodon') {
    torsoMat.color.setHex(0x06b6d4); // Sky-Wing Cyan Pteranodon
    torsoMat.metalness = 0.12;
    // Long Aerodynamic Head Crest
    const aeroCrest = new THREE.Mesh(
      new THREE.ConeGeometry(12, 68, 20),
      new THREE.MeshPhysicalMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 0.35,
        roughness: 0.25,
      })
    );
    aeroCrest.rotation.z = Math.PI / 2 + 0.28;
    aeroCrest.position.set(-18, 186, 0);
    rig.speciesGroup.add(aeroCrest);

    // Swept Glider Wings on Left & Right
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 0.3,
      roughness: 0.25,
      clearcoat: 0.7,
      side: THREE.DoubleSide,
    });
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.SphereGeometry(46, 24, 18), wingMat);
      wing.scale.set(0.75, 0.12, 1.95);
      wing.position.set(4, 112, side * 78);
      wing.rotation.x = side * 0.22;
      rig.speciesGroup.add(wing);
    });
  } else if (species === 'mecha_rex') {
    torsoMat.color.setHex(0x334155); // Titanium Cyber-Dominator Omega
    torsoMat.metalness = 0.85;
    torsoMat.roughness = 0.18;
    // Glowing Neon Arc Reactor on Chest + Cyber Laser Visor + Shoulder Rocket Pods
    const reactor = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 20, 12, 28),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.8,
      })
    );
    reactor.rotation.z = Math.PI / 2;
    reactor.position.set(52, 92, 0);

    const visor = new THREE.Mesh(
      new THREE.CapsuleGeometry(7, 46, 12, 20),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xff0055,
        emissiveIntensity: 2.0,
      })
    );
    visor.rotation.x = Math.PI / 2;
    visor.position.set(66, 174, 0);

    rig.speciesGroup.add(reactor, visor);
  }
}

export function rebuildCannonMesh(rig: DinoRig, level: number, isDropped: boolean) {
  const key = `${level}-${isDropped}`;
  if (rig.currentCannonKey === key) return;
  rig.currentCannonKey = key;

  while (rig.cannonGroup.children.length > 0) {
    rig.cannonGroup.remove(rig.cannonGroup.children[0]);
  }

  const color = isDropped ? 0xa855f7 : CANNON_TIER_HEX[level] || 0x94a3b8;
  const length = isDropped ? 92 : 62 + (level - 1) * 16;
  const radius = isDropped ? 14 : 10 + (level - 1) * 2.5;

  const barrelMat = new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: level >= 2 || isDropped ? 0.42 : 0.08,
    metalness: 0.82,
    roughness: 0.16,
    clearcoat: 0.8,
  });

  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.25,
  });

  if (isDropped) {
    const b1 = new THREE.Mesh(new THREE.CapsuleGeometry(9.5, length, 16, 24), barrelMat);
    b1.rotation.z = Math.PI / 2;
    b1.position.set(length / 2, 7, 0);
    const b2 = new THREE.Mesh(new THREE.CapsuleGeometry(9.5, length, 16, 24), barrelMat);
    b2.rotation.z = Math.PI / 2;
    b2.position.set(length / 2, -7, 0);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(13, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xf3e8ff,
        emissive: 0xc084fc,
        emissiveIntensity: 1.4,
      })
    );
    core.position.set(length * 0.4, 0, 12);
    rig.cannonGroup.add(b1, b2, core);
  } else {
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.12, length, 28),
      barrelMat
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(length / 2, 0, 0);
    barrel.castShadow = true;

    const muzzle = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.08, 3.8, 16, 28),
      darkMetal
    );
    muzzle.rotation.y = Math.PI / 2;
    muzzle.position.set(length, 0, 0);

    const backCap = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.12, 24, 24), barrelMat);
    backCap.position.set(0, 0, 0);

    rig.cannonGroup.add(barrel, muzzle, backCap);

    if (level >= 3) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.35, 3.2, 16, 32),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: color,
          emissiveIntensity: 0.9,
        })
      );
      ring.rotation.y = Math.PI / 2;
      ring.position.set(length * 0.55, 0, 0);
      rig.cannonGroup.add(ring);
    }
  }
}

export function updateDinoAppearance(
  rig: DinoRig,
  evoLevel: number,
  shieldLevel: number,
  armor: { helmet: number; vest: number; chain: number; boots: number }
) {
  if (rig.currentEvo !== evoLevel) {
    rig.currentEvo = evoLevel;
    rig.evo2Scars.visible = evoLevel >= 2;
    rig.evo3Spikes.visible = evoLevel >= 3;
    rig.evo4Rings.visible = evoLevel >= 4;
    rig.evo5Crown.visible = evoLevel >= 5;
  }

  if (rig.currentShieldLevel !== shieldLevel) {
    rig.currentShieldLevel = shieldLevel;
    const sColor = SHIELD_TIER_HEX[shieldLevel] || 0x3b82f6;
    const mat = rig.shieldMesh.material as THREE.MeshPhysicalMaterial;
    mat.color.setHex(sColor);
    mat.emissive.setHex(sColor);
    const scale = 0.85 + (shieldLevel - 1) * 0.16;
    rig.shieldMesh.scale.set(scale, scale, scale);
  }

  const armorKey = `${armor.helmet}-${armor.vest}-${armor.chain}-${armor.boots}`;
  if (rig.currentArmorKey !== armorKey) {
    rig.currentArmorKey = armorKey;

    rig.armorHelmet.visible = armor.helmet > 0;
    if (armor.helmet > 0) {
      const dome = rig.armorHelmet.children[0] as THREE.Mesh;
      (dome.material as THREE.MeshPhysicalMaterial).color.setHex(
        ARMOR_TIER_HEX[armor.helmet] || 0xcbd5e1
      );
    }

    rig.armorVest.visible = armor.vest > 0;
    if (armor.vest > 0) {
      const vMesh = rig.armorVest.children[0] as THREE.Mesh;
      (vMesh.material as THREE.MeshPhysicalMaterial).color.setHex(
        ARMOR_TIER_HEX[armor.vest] || 0xcbd5e1
      );
    }

    rig.armorChain.visible = armor.chain > 0;
    if (armor.chain > 0) {
      rig.armorChain.children.forEach((c) => {
        ((c as THREE.Mesh).material as THREE.MeshPhysicalMaterial).color.setHex(
          ARMOR_TIER_HEX[armor.chain] || 0xcbd5e1
        );
      });
    }

    rig.armorBootsLeft.visible = armor.boots > 0;
    rig.armorBootsRight.visible = armor.boots > 0;
    if (armor.boots > 0) {
      const bColor = ARMOR_TIER_HEX[armor.boots] || 0xcbd5e1;
      (rig.armorBootsLeft.material as THREE.MeshPhysicalMaterial).color.setHex(bColor);
      (rig.armorBootsRight.material as THREE.MeshPhysicalMaterial).color.setHex(bColor);
    }
  }
}

export function createPetMesh(type: 'dragon' | 'snake' | 'scorpion', level: number): THREE.Group {
  const root = new THREE.Group();
  const group = new THREE.Group();
  const scale = (0.95 + (level - 1) * 0.28) * 0.055;
  group.scale.set(scale, scale, scale);
  group.rotation.y = -Math.PI / 2;
  root.add(group);

  if (type === 'dragon') {
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: level === 3 ? 0xfbbf24 : level === 2 ? 0xf97316 : 0xef4444,
      emissive: level === 3 ? 0xd97706 : 0xdc2626,
      emissiveIntensity: 0.55,
      roughness: 0.22,
      clearcoat: 0.75,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 20), bodyMat);
    body.scale.set(1.4, 0.95, 0.95);

    const head = new THREE.Mesh(new THREE.SphereGeometry(13, 20, 20), bodyMat);
    head.scale.set(1.35, 0.95, 0.95);
    head.position.set(24, 8, 0);

    // Glowing Fire Breath Core in Dragon Mouth
    const fireCore = new THREE.Mesh(
      new THREE.SphereGeometry(6.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    fireCore.position.set(36, 7, 0);

    // Dragon Horns & Eyes
    const hornMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(3.2, 14, 12), hornMat);
      horn.position.set(18, 18, side * 7);
      horn.rotation.z = 0.45;
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(2.8, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      eye.position.set(29, 12, side * 8.5);
      group.add(horn, eye);
    });

    // Articulated Left & Right Flapping Wings
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: level === 3 ? 0xfef08a : 0xf59e0b,
      emissive: 0xea580c,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    const wingGeo = new THREE.SphereGeometry(22, 16, 12);
    wingGeo.scale(0.55, 0.08, 1.35);

    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(2, 11, 22);
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(2, 11, -22);

    root.userData.wingL = wingL;
    root.userData.wingR = wingR;

    // Dragon Tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(8, 30, 14), bodyMat);
    tail.rotation.z = Math.PI / 2 + 0.15;
    tail.position.set(-28, 2, 0);

    group.add(body, head, fireCore, wingL, wingR, tail);
  } else if (type === 'snake') {
    const snakeMat = new THREE.MeshPhysicalMaterial({
      color: level === 3 ? 0xfbbf24 : level === 2 ? 0x10b981 : 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      clearcoat: 0.7,
    });
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(10.5 - i * 1.1, 20, 20), snakeMat);
      seg.position.set(-i * 10, 10 + (i === 0 ? 7 : 0), Math.sin(i * 1.2) * 5);
      group.add(seg);
    }
  } else {
    const scorpMat = new THREE.MeshPhysicalMaterial({
      color: level === 3 ? 0x84cc16 : level === 2 ? 0xdc2626 : 0xa855f7,
      emissive: 0x6b21a8,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      clearcoat: 0.65,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 18), scorpMat);
    body.scale.set(1.4, 0.65, 0.95);
    body.position.set(0, 10, 0);
    const stinger = new THREE.Mesh(new THREE.ConeGeometry(6, 24, 16), scorpMat);
    stinger.position.set(-12, 26, 0);
    stinger.rotation.z = -0.6;
    group.add(body, stinger);
  }

  return root;
}

export function createChestMesh(rarity: string, colorHex: string): THREE.Group {
  const root = new THREE.Group();
  const group = new THREE.Group();
  group.scale.setScalar(0.055);
  root.add(group);

  const accentColor = new THREE.Color(colorHex);

  const woodMat = new THREE.MeshPhysicalMaterial({
    color: 0x78350f,
    roughness: 0.45,
    metalness: 0.2,
    clearcoat: 0.4,
  });
  const trimMat = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: rarity === 'mythic' || rarity === 'legendary' ? 0.75 : 0.4,
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 0.8,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(24, 22, 28, 24), woodMat);
  base.position.y = 14;
  base.castShadow = true;

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(24, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    trimMat
  );
  dome.position.y = 28;

  const beacon = new THREE.Mesh(
    new THREE.RingGeometry(32, 46, 36),
    new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    })
  );
  beacon.rotation.x = -Math.PI / 2;
  beacon.position.y = 1.5;

  group.add(base, dome, beacon);
  return root;
}

export function createMedkitMesh(level: number): THREE.Group {
  const root = new THREE.Group();
  const group = new THREE.Group();
  group.scale.setScalar(0.055);
  root.add(group);

  const colors = [0xef4444, 0xf97316, 0xfbbf24];
  const c = colors[level - 1] || 0xef4444;
  const size = 22 + (level - 1) * 4;

  const capsule = new THREE.Mesh(
    new THREE.SphereGeometry(size, 28, 24),
    new THREE.MeshPhysicalMaterial({
      color: c,
      emissive: c,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      clearcoat: 0.8,
    })
  );
  capsule.position.y = size;
  capsule.castShadow = true;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(size * 1.02, 3.5, 12, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  ring.position.y = size;

  const beacon = new THREE.Mesh(
    new THREE.RingGeometry(24, 36, 32),
    new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    })
  );
  beacon.rotation.x = -Math.PI / 2;
  beacon.position.y = 1.5;

  group.add(capsule, ring, beacon);
  return root;
}
