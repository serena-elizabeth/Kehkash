import { useEffect, useRef, useState } from "react";

import * as THREE from "three";

import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import WallFrame from "./objects/WallFrame";

import { roomContent } from "./data/roomContent";

import InteractionManager from "./interaction/InteractionManager";

function makeWoodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const image = ctx.createImageData(canvas.width, canvas.height);
  const data = image.data;

  for (let y = 0; y < canvas.height; y++) {
    const grainWave = Math.sin(y * 0.075) * 7 + Math.sin(y * 0.19) * 3;

    for (let x = 0; x < canvas.width; x++) {
      const n =
        Math.sin(x * 0.018 + y * 0.002) * 8 +
        Math.sin(x * 0.055 + y * 0.009) * 4 +
        (Math.random() - 0.5) * 7;

      const v = Math.max(12, Math.min(95, 48 + grainWave + n));
      const i = (y * canvas.width + x) * 4;

      data[i] = v * 1.15;
      data[i + 1] = v * 0.54;
      data[i + 2] = v * 0.2;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#130a04";
  ctx.lineWidth = 2;

  for (let i = 0; i < 130; i++) {
    const y = Math.random() * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      canvas.width * 0.25,
      y + Math.random() * 12 - 6,
      canvas.width * 0.7,
      y + Math.random() * 12 - 6,
      canvas.width,
      y + Math.random() * 12 - 6,
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;

  return texture;
}

function makeRugTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#3b1711";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#c08a35";
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  ctx.strokeStyle = "#6b351b";
  ctx.lineWidth = 5;
  ctx.strokeRect(38, 38, canvas.width - 76, canvas.height - 76);

  for (let x = 55; x < canvas.width - 55; x += 44) {
    for (let y = 55; y < canvas.height - 55; y += 42) {
      const flip = (x / 44 + y / 42) % 2;
      ctx.fillStyle = flip ? "#a36c28" : "#5e2618";
      ctx.beginPath();
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x + 10, y);
      ctx.lineTo(x, y + 14);
      ctx.lineTo(x - 10, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addBox(scene, geometry, material, position, options = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);

  if (options.rotation) mesh.rotation.set(...options.rotation);
  if (options.name) mesh.name = options.name;
  if (options.castShadow !== false) mesh.castShadow = true;
  if (options.receiveShadow !== false) mesh.receiveShadow = true;

  scene.add(mesh);
  return mesh;
}

function addRoundedBox(
  parent,
  material,
  size,
  position,
  radius = 0.04,
  segments = 3,
) {
  const geometry = new RoundedBoxGeometry(
    size[0],
    size[1],
    size[2],
    segments,
    radius,
  );

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createDesk(scene, woodMaterial, darkWoodMaterial) {
  const desk = new THREE.Group();
  desk.position.set(0, 0, -3.65);
  scene.add(desk);

  // ==========================================================
  // MAIN DESK TOP
  // ==========================================================

  const top = new RoundedBoxGeometry(8.7, 0.24, 2.45, 5, 0.07);

  const deskTop = new THREE.Mesh(top, woodMaterial);

  deskTop.position.set(0, 1.3, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;

  desk.add(deskTop);

  // ==========================================================
  // FRONT APRON
  // ==========================================================

  addRoundedBox(
    desk,
    darkWoodMaterial,
    [8.45, 0.34, 0.16],
    [0, 1.09, 1.05],
    0.035,
  );

  // ==========================================================
  // LEFT + RIGHT DESK SUPPORTS
  // ==========================================================

  for (const x of [-4.15, 4.15]) {
    addRoundedBox(
      desk,
      darkWoodMaterial,
      [0.22, 1.08, 2.1],
      [x, 0.62, 0],
      0.025,
    );
  }

  // ==========================================================
  // UNDER-DESK GAMING SHELVING
  // ==========================================================

  // Lower shelf
  addRoundedBox(desk, darkWoodMaterial, [8.0, 0.12, 2.0], [0, 0.14, 0], 0.025);

  // Upper shelf
  addRoundedBox(desk, darkWoodMaterial, [8.0, 0.12, 2.0], [0, 0.76, 0], 0.025);

  // ==========================================================
  // VERTICAL SHELF DIVIDERS
  // ==========================================================

  for (const x of [-2.95, -1.15, 1.15, 2.95]) {
    addRoundedBox(
      desk,
      darkWoodMaterial,
      [0.12, 0.95, 2.0],
      [x, 0.48, 0],
      0.018,
    );
  }

  // ==========================================================
  // DARK BACK PANELS
  // ==========================================================

  const backMaterial = new THREE.MeshStandardMaterial({
    color: 0x120b07,
    roughness: 0.9,
  });

  for (const x of [-2.05, 2.05]) {
    addBox(desk, new THREE.BoxGeometry(1.65, 0.78, 0.08), backMaterial, [
      x,
      0.48,
      -0.96,
    ]);
  }

  // ==========================================================
  // CENTRAL DRAWER
  // ==========================================================

  const drawerMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1309,
    roughness: 0.38,
    metalness: 0.08,
  });

  addRoundedBox(
    desk,
    drawerMaterial,
    [1.95, 0.48, 0.08],
    [0, 0.78, 1.05],
    0.025,
  );

  // ==========================================================
  // DRAWER FRONT HIGHLIGHT
  // ==========================================================

  const drawerEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a1a0d,
    roughness: 0.32,
    metalness: 0.06,
  });

  addRoundedBox(
    desk,
    drawerEdgeMaterial,
    [1.72, 0.035, 0.025],
    [0, 0.99, 1.095],
    0.012,
  );

  // ==========================================================
  // DRAWER KNOB
  // ==========================================================

  const knobMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c5a19,
    roughness: 0.28,
    metalness: 0.7,
  });

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 12, 8),
    knobMaterial,
  );

  knob.position.set(0, 0.78, 1.13);

  knob.castShadow = true;
  desk.add(knob);

  // ==========================================================
  // LOWER STORAGE CHESTS
  // ==========================================================

  const chestMaterial = new THREE.MeshStandardMaterial({
    color: 0x21150e,
    roughness: 0.58,
    metalness: 0.12,
  });

  for (const x of [-2.05, 2.05]) {
    addRoundedBox(
      desk,
      chestMaterial,
      [1.35, 0.38, 0.72],
      [x, 0.29, 0.08],
      0.035,
    );

    // Chest latch
    const latch = new THREE.Mesh(
      new RoundedBoxGeometry(0.12, 0.16, 0.04, 2, 0.015),
      knobMaterial,
    );

    latch.position.set(x, 0.29, 0.46);

    latch.castShadow = true;
    desk.add(latch);
  }

  // ==========================================================
  // BOOKS / SMALL ITEMS IN OPEN SHELVES
  // ==========================================================

  const bookColors = [0x241817, 0x302116, 0x17201e, 0x4a2d1b, 0x211c17];

  const bookPositions = [
    [-3.78, 0.42, 0.05, 0.25],
    [-3.45, 0.42, 0.05, 0.19],
    [-3.12, 0.42, 0.05, 0.28],

    [-0.78, 0.43, 0.05, 0.21],
    [0.36, 0.43, 0.05, 0.24],

    [1.6, 0.43, 0.05, 0.21],
    [1.92, 0.43, 0.05, 0.27],
    [2.25, 0.43, 0.05, 0.19],
  ];

  bookPositions.forEach(([x, y, z, w], i) => {
    const height = 0.48 + (i % 3) * 0.045;

    const coverMaterial = new THREE.MeshStandardMaterial({
      color: bookColors[i % bookColors.length],
      roughness: 0.72,
    });

    const pageMaterial = new THREE.MeshStandardMaterial({
      color: 0xb49a72,
      roughness: 0.88,
    });

    // Main cover
    addRoundedBox(desk, coverMaterial, [w, height, 0.43], [x, y, z], 0.018, 3);

    // Visible page block
    addRoundedBox(
      desk,
      pageMaterial,
      [w * 0.82, height * 0.84, 0.435],
      [x, y, z + 0.008],
      0.012,
      2,
    );

    // Spine
    addRoundedBox(
      desk,
      coverMaterial,
      [0.025, height * 0.9, 0.45],
      [x - w / 2 + 0.015, y, z],
      0.008,
      2,
    );
  });

  // ==========================================================
  // SMALL DESK-SHELF GLOBE
  // ==========================================================

  const globeGroup = new THREE.Group();

  globeGroup.position.set(-1.72, 0.57, 0.05);

  desk.add(globeGroup);

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 24, 16),
    new THREE.MeshStandardMaterial({
      color: 0x6c5934,
      roughness: 0.78,
    }),
  );

  globe.castShadow = true;
  globeGroup.add(globe);

  const globeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.012, 8, 32),
    knobMaterial,
  );

  globeRing.rotation.x = Math.PI / 2.6;

  globeGroup.add(globeRing);

  // ==========================================================
  // RETURN DESK
  // ==========================================================

  return desk;
}

function createChair(scene) {
  const chair = new THREE.Group();

  chair.position.set(-1.6, 0, -2.1);
  chair.rotation.y = Math.PI; // keep as is — already faces the desk

  scene.add(chair);

  // ----------------------------------------------------------
  // MATERIALS
  // ----------------------------------------------------------

  const leather = new THREE.MeshStandardMaterial({
    color: 0x32120f,
    roughness: 0.62,
    metalness: 0.02,
  });

  const leatherEdge = new THREE.MeshStandardMaterial({
    color: 0x24100d,
    roughness: 0.7,
    metalness: 0.02,
  });

  const wood = new THREE.MeshStandardMaterial({
    color: 0x542914,
    roughness: 0.48,
    metalness: 0.04,
  });

  const brass = new THREE.MeshStandardMaterial({
    color: 0x8b5b24,
    roughness: 0.3,
    metalness: 0.72,
  });

  // ----------------------------------------------------------
  // SEAT BASE
  // ----------------------------------------------------------

  addRoundedBox(chair, leatherEdge, [1.48, 0.18, 1.38], [0, 0.82, 0], 0.1, 5);

  // Main padded seat
  addRoundedBox(chair, leather, [1.32, 0.26, 1.22], [0, 0.94, 0], 0.12, 6);

  // Seat front cushion bulge
  addRoundedBox(chair, leather, [1.22, 0.12, 0.24], [0, 1.05, 0.48], 0.08, 5);

  // ----------------------------------------------------------
  // BACKREST
  // ----------------------------------------------------------

  const backOuter = addRoundedBox(
    chair,
    leatherEdge,
    [1.5, 1.72, 0.25],
    [0, 1.73, -0.53],
    0.13,
    6,
  );

  backOuter.rotation.x = -0.075;

  const backPad = addRoundedBox(
    chair,
    leather,
    [1.32, 1.5, 0.18],
    [0, 1.74, -0.39],
    0.11,
    6,
  );

  backPad.rotation.x = -0.075;

  // Vertical upholstery panels
  for (const x of [-0.43, 0.43]) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 1.15, 0.012),
      leatherEdge,
    );

    seam.position.set(x, 1.75, -0.285);
    seam.rotation.x = -0.075;

    chair.add(seam);
  }

  // Headrest padding
  addRoundedBox(chair, leather, [1.12, 0.28, 0.2], [0, 2.38, -0.42], 0.09, 5);

  // ----------------------------------------------------------
  // ARMREST SUPPORTS
  // ----------------------------------------------------------

  for (const x of [-0.68, 0.68]) {
    // Vertical support
    addRoundedBox(chair, wood, [0.13, 0.58, 0.13], [x, 0.79, -0.02], 0.04, 4);

    // Armrest wooden body
    const arm = addRoundedBox(
      chair,
      wood,
      [0.18, 0.16, 1.05],
      [x, 1.27, -0.02],
      0.07,
      5,
    );

    arm.rotation.z = x < 0 ? -0.08 : 0.08;

    // Padded armrest surface
    addRoundedBox(
      chair,
      leather,
      [0.19, 0.09, 0.78],
      [x, 1.38, -0.02],
      0.045,
      4,
    );
  }

  // ----------------------------------------------------------
  // WOODEN LEGS
  // ----------------------------------------------------------

  for (const x of [-0.54, 0.54]) {
    for (const z of [-0.42, 0.42]) {
      const leg = addRoundedBox(
        chair,
        wood,
        [0.14, 0.78, 0.14],
        [x, 0.4, z],
        0.045,
        4,
      );

      leg.rotation.z = x < 0 ? -0.035 : 0.035;

      // Brass foot cap
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.035, 16),
        brass,
      );

      foot.position.set(x, 0.015, z);
      foot.castShadow = true;

      chair.add(foot);
    }
  }

  // ----------------------------------------------------------
  // LOWER SIDE SUPPORTS
  // ----------------------------------------------------------

  for (const x of [-0.54, 0.54]) {
    addRoundedBox(chair, wood, [0.12, 0.12, 0.95], [x, 0.48, 0], 0.035, 3);
  }

  return chair;
}
function createDeskLamp(scene) {
  const lamp = new THREE.Group();

  // Desk surface is around y = 1.3
  lamp.position.set(-1.65, 1.3, -3.45);

  scene.add(lamp);

  const brass = new THREE.MeshStandardMaterial({
    color: 0x76501f,
    roughness: 0.3,
    metalness: 0.78,
  });

  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x241b14,
    roughness: 0.38,
    metalness: 0.72,
  });

  const shadeMetal = new THREE.MeshStandardMaterial({
    color: 0x8a5a24,
    roughness: 0.34,
    metalness: 0.72,
    side: THREE.DoubleSide,
  });

  // --------------------------------------------------
  // HEAVY ROUND BASE
  // --------------------------------------------------

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.34, 0.1, 32),
    darkMetal,
  );

  base.position.y = 0.055;
  base.castShadow = true;
  base.receiveShadow = true;
  lamp.add(base);

  // Brass ring around base
  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.27, 0.018, 8, 32),
    brass,
  );

  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.108;
  lamp.add(baseRing);

  // --------------------------------------------------
  // LOWER ARM
  // --------------------------------------------------

  const lowerArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.72, 16),
    brass,
  );

  lowerArm.position.set(0, 0.43, 0);
  lowerArm.rotation.z = -0.12;
  lowerArm.castShadow = true;
  lamp.add(lowerArm);

  // Lower joint
  const joint1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), brass);

  joint1.position.set(0.04, 0.78, 0);
  joint1.castShadow = true;
  lamp.add(joint1);

  // --------------------------------------------------
  // UPPER ARM
  // --------------------------------------------------

  const upperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.038, 0.82, 16),
    brass,
  );

  upperArm.position.set(0.26, 1.05, 0);
  upperArm.rotation.z = -0.95;
  upperArm.castShadow = true;
  lamp.add(upperArm);

  // Upper joint
  const joint2 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), brass);

  joint2.position.set(0.59, 1.34, 0);
  joint2.castShadow = true;
  lamp.add(joint2);

  // --------------------------------------------------
  // CLASSIC DOME SHADE
  // --------------------------------------------------

  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.38, 0.32, 32, 1, true),
    shadeMetal,
  );

  // Keep shade horizontal, opening downward
  shade.position.set(0.7, 1.27, 0);
  shade.rotation.x = Math.PI;
  shade.castShadow = true;
  lamp.add(shade);

  // Dark outer rim
  const shadeRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.022, 8, 32),
    darkMetal,
  );

  shadeRim.rotation.x = Math.PI / 2;
  shadeRim.position.set(0.7, 1.115, 0);
  lamp.add(shadeRim);

  // --------------------------------------------------
  // BULB
  // --------------------------------------------------

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 12),
    new THREE.MeshStandardMaterial({
      color: 0xffe4b5,
      emissive: 0xffa84d,
      emissiveIntensity: 0.65,
      roughness: 0.22,
    }),
  );

  bulb.position.set(0.7, 1.12, 0);
  lamp.add(bulb);

  // --------------------------------------------------
  // EXISTING LIGHT — DO NOT CHANGE ITS SETTINGS
  // --------------------------------------------------

  const light = new THREE.PointLight(0xffbd70, 2.5, 4.0, 2);

  light.position.set(0.7, 1.08, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);

  lamp.add(light);

  return {
    lamp,
    light,
    bulb,
  };
}
function createRecordPlayer(scene) {
  const group = new THREE.Group();

  group.position.set(2.55, 1.42, -3.65);

  scene.add(group);

  const cabinet = new THREE.MeshStandardMaterial({
    color: 0x24130b,
    roughness: 0.48,
    metalness: 0.08,
  });

  const woodEdge = new THREE.MeshStandardMaterial({
    color: 0x4a2410,
    roughness: 0.4,
    metalness: 0.04,
  });

  const black = new THREE.MeshStandardMaterial({
    color: 0x090a0b,
    roughness: 0.32,
    metalness: 0.18,
  });

  const metal = new THREE.MeshStandardMaterial({
    color: 0x8b7558,
    roughness: 0.25,
    metalness: 0.8,
  });

  // ----------------------------------------------------------
  // MAIN CABINET
  // ----------------------------------------------------------

  addRoundedBox(group, cabinet, [1.85, 0.45, 1.5], [0, 0.08, 0], 0.06, 5);

  // Front fascia
  addRoundedBox(group, woodEdge, [1.62, 0.09, 0.08], [0, 0.12, 0.76], 0.025, 3);

  // Small front control
  const control = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.035, 20),
    metal,
  );

  control.rotation.x = Math.PI / 2;
  control.position.set(0.65, 0.16, 0.77);
  group.add(control);

  // ----------------------------------------------------------
  // PLATTER
  // ----------------------------------------------------------

  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.57, 0.57, 0.055, 64),
    black,
  );

  platter.rotation.x = Math.PI / 2;
  platter.position.set(-0.12, 0.35, -0.03);
  platter.castShadow = true;

  group.add(platter);

  // Rubber mat
  const mat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.018, 64),
    new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.9,
    }),
  );

  mat.rotation.x = Math.PI / 2;
  mat.position.set(-0.12, 0.39, -0.03);
  group.add(mat);

  // ----------------------------------------------------------
  // VINYL RECORD
  // ----------------------------------------------------------

  const record = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.47, 0.025, 64),
    new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.28,
      metalness: 0.18,
    }),
  );

  record.rotation.x = Math.PI / 2;
  record.position.set(-0.12, 0.405, -0.03);
  record.castShadow = true;

  group.add(record);

  // Record label
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.03, 32),
    new THREE.MeshStandardMaterial({
      color: 0x8b2417,
      roughness: 0.58,
    }),
  );

  label.rotation.x = Math.PI / 2;
  label.position.set(-0.12, 0.425, -0.03);

  group.add(label);

  // Center spindle
  const spindle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.05, 16),
    metal,
  );

  spindle.rotation.x = Math.PI / 2;
  spindle.position.set(-0.12, 0.445, -0.03);

  group.add(spindle);

  // ----------------------------------------------------------
  // TONE ARM
  // ----------------------------------------------------------

  const toneArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.78, 12),
    metal,
  );

  toneArm.position.set(0.53, 0.48, 0.08);
  toneArm.rotation.z = 1.02;

  toneArm.castShadow = true;

  group.add(toneArm);

  // Tonearm pivot
  const pivot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.1, 20),
    black,
  );

  pivot.rotation.z = Math.PI / 2;
  pivot.position.set(0.82, 0.43, 0.12);

  group.add(pivot);

  // Cartridge
  addRoundedBox(
    group,
    black,
    [0.12, 0.045, 0.06],
    [0.19, 0.61, 0.02],
    0.015,
    3,
  );

  // ----------------------------------------------------------
  // DUST COVER
  // ----------------------------------------------------------

  const lidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x15181b,
    roughness: 0.12,
    metalness: 0.02,
    transmission: 0.12,
    transparent: true,
    opacity: 0.38,
  });

  const lid = addRoundedBox(
    group,
    lidMaterial,
    [1.82, 1.15, 0.055],
    [0, 0.78, -0.73],
    0.035,
    4,
  );

  lid.rotation.x = -0.04;

  // ----------------------------------------------------------
  // HINGES
  // ----------------------------------------------------------

  for (const x of [-0.68, 0.68]) {
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.12, 16),
      metal,
    );

    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(x, 0.54, -0.68);

    group.add(hinge);
  }

  // ----------------------------------------------------------
  // FEET
  // ----------------------------------------------------------

  for (const x of [-0.72, 0.72]) {
    for (const z of [-0.55, 0.55]) {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.08, 0.1, 16),
        woodEdge,
      );

      foot.position.set(x, -0.18, z);
      foot.castShadow = true;

      group.add(foot);
    }
  }

  return group;
}

function createWindow(scene, outdoorImage = "/images/outdoor-view.jpg") {
  const windowGroup = new THREE.Group();
  windowGroup.position.set(0, 2.08, -4.87);
  scene.add(windowGroup);

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x16120f,
    roughness: 0.35,
    metalness: 0.5,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x101c2c,
    roughness: 0.12,
    metalness: 0.05,
    transmission: 0.05,
    transparent: true,
    opacity: 0.82,
  });
  const outdoorTexture = new THREE.TextureLoader().load(outdoorImage);

  outdoorTexture.colorSpace = THREE.SRGBColorSpace;

  const outdoorMaterial = new THREE.MeshBasicMaterial({
    map: outdoorTexture,
    side: THREE.DoubleSide,
  });

  addBox(
    windowGroup,
    new THREE.BoxGeometry(7.78, 2.32, 0.015),
    outdoorMaterial,
    [0, 0, -0.055],
    { castShadow: false, receiveShadow: false },
  );
  const nightTexture = new THREE.TextureLoader().load(
    "/dist/room/outdoor-night.jpg",
  );
  nightTexture.colorSpace = THREE.SRGBColorSpace;

  const nightMaterial = new THREE.MeshBasicMaterial({
    map: nightTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });

  const nightPlane = addBox(
    windowGroup,
    new THREE.BoxGeometry(7.78, 2.32, 0.015),
    nightMaterial,
    [0, 0, -0.05], // just in front of the day layer
    { castShadow: false, receiveShadow: false },
  );

  for (const x of [-4.05, 4.05]) {
    addRoundedBox(
      windowGroup,
      frameMaterial,
      [0.18, 2.72, 0.16],
      [x, 0, 0],
      0.025,
    );
  }

  for (const y of [-1.27, 1.27]) {
    addRoundedBox(
      windowGroup,
      frameMaterial,
      [8.2, 0.18, 0.16],
      [0, y, 0],
      0.025,
    );
  }

  for (const x of [-1.35, 1.35]) {
    addRoundedBox(
      windowGroup,
      frameMaterial,
      [0.1, 2.48, 0.14],
      [x, 0, 0.04],
      0.018,
    );
  }

  const city = new THREE.Group();
  city.position.z = -0.24;
  windowGroup.add(city);

  const buildingMaterials = [
    new THREE.MeshStandardMaterial({
      color: 0x111722,
      roughness: 0.95,
      emissive: 0x070a10,
      emissiveIntensity: 0.25,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x151b28,
      roughness: 0.95,
      emissive: 0x090d16,
      emissiveIntensity: 0.25,
    }),
  ];

  for (let i = 0; i < 28; i++) {
    const x = -4.0 + i * 0.3;
    const width = 0.2 + Math.random() * 0.22;
    const height = 0.55 + Math.random() * 1.45;

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.18),
      buildingMaterials[i % 2],
    );

    building.position.set(x, -1.15 + height / 2 + Math.random() * 0.15, -0.12);

    building.castShadow = false;
    city.add(building);

    const floors = Math.max(2, Math.floor(height / 0.22));

    for (let f = 0; f < floors; f++) {
      if (Math.random() < 0.48) {
        const window = new THREE.Mesh(
          new THREE.PlaneGeometry(0.035, 0.06),
          new THREE.MeshBasicMaterial({
            color: Math.random() > 0.45 ? 0xffc978 : 0x8d9fbc,
          }),
        );

        window.position.set(
          x + (Math.random() - 0.5) * width * 0.6,
          -1.05 + f * 0.21,
          0.0,
        );

        city.add(window);
      }
    }
  }

  const rainCount = 650;
  const streakLength = 0.14;
  const positions = new Float32Array(rainCount * 2 * 3); // 2 points per streak

  for (let i = 0; i < rainCount; i++) {
    const x = (Math.random() - 0.5) * 8.0;
    const y = (Math.random() - 0.5) * 2.6;
    const z = Math.random() * 0.25 - 0.1;

    positions[i * 6] = x;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;

    positions[i * 6 + 3] = x;
    positions[i * 6 + 4] = y - streakLength;
    positions[i * 6 + 5] = z;
  }

  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );

  const rainMaterial = new THREE.LineBasicMaterial({
    color: 0xaac4e0,
    transparent: true,
    opacity: 0.45,
  });

  const rain = new THREE.LineSegments(rainGeometry, rainMaterial);
  rain.userData.streakLength = streakLength;
  windowGroup.add(rain);

  return { windowGroup, rain, nightPlane };
}

function createRug(scene) {
  const texture = makeRugTexture();

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.96,
  });

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(7.9, 4.2), material);

  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.012, 0.15);
  rug.receiveShadow = true;
  scene.add(rug);

  return rug;
}

export default function MusicRoomExperience() {
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicCurrentTime, setMusicCurrentTime] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [musicMinimized, setMusicMinimized] = useState(false);

  const mountRef = useRef(null);
  const interactionRef = useRef(null);
  const selectedArtworkRef = useRef(null);
  const audioRef = useRef(null);
  const musicAnimationFrameRef = useRef(null);
  const musicAnalyserRef = useRef(null);
  const musicAudioContextRef = useRef(null);
  const musicSourceRef = useRef(null);
  const musicLightingRef = useRef(null);
  const lookedAtObjectRef = useRef(null);

  const musicOpenRef = useRef(false);
  const musicMinimizedRef = useRef(false);
  const musicFrequencyDataRef = useRef(null);

  const [roomScene, setRoomScene] = useState(null);
  const [lookedAtObject, setLookedAtObject] = useState(null);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [roomLightOn, setRoomLightOn] = useState(true);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicVolume, setMusicVolume] = useState(1);
  const [musicRepeat, setMusicRepeat] = useState(false);

  useEffect(() => {
    musicOpenRef.current = musicOpen;
    musicMinimizedRef.current = musicMinimized;
  }, [musicOpen, musicMinimized]);
  const MUSIC_LIGHT_PROFILES = [
    {
      color: 0x8b6cff, // dreamy purple
      intensity: 1,
    },

    {
      color: 0xe01bfa, // romantic pink
      intensity: 0.95,
    },

    {
      color: 0x4d8dff, // deep blue
      intensity: 0.9,
    },

    {
      color: 0x0fe7ff, // light blue
      intensity: 0.8,
    },
  ];
  const applyMusicTheme = (profile) => {
    const lighting = musicLightingRef.current;
    if (!lighting) return;
    const base = new THREE.Color(profile.color);
    lighting.target.colorA.copy(base);
    lighting.target.colorB.copy(base).offsetHSL(0.02, 0.04, 0.08);
    lighting.target.colorC.copy(base).offsetHSL(-0.02, 0.03, -0.04);
    lighting.target.intensity = profile.intensity;
  };
  const currentSong = roomContent.music?.[currentSongIndex] ?? null;

  const selectSong = async (index) => {
    const songs = roomContent.music ?? [];
    const song = songs[index];
    const audio = audioRef.current;

    if (!song || !audio) return;

    setCurrentSongIndex(index);

    const profile = MUSIC_LIGHT_PROFILES[index % MUSIC_LIGHT_PROFILES.length];

    applyMusicTheme(profile);

    audio.pause();
    audio.src = song.src;
    audio.load();
    audio.currentTime = 0;

    setMusicCurrentTime(0);
    setMusicDuration(0);

    try {
      await audio.play();
      setMusicPlaying(true);
    } catch (error) {
      console.error("Song playback failed:", error);
      setMusicPlaying(false);
    }
  };

  const playNextSong = () => {
    const songs = roomContent.music ?? [];

    if (!songs.length) return;

    const nextIndex = (currentSongIndex + 1) % songs.length;
    selectSong(nextIndex);
  };

  const playPreviousSong = () => {
    const songs = roomContent.music ?? [];

    if (!songs.length) return;

    const previousIndex = (currentSongIndex - 1 + songs.length) % songs.length;

    selectSong(previousIndex);
  };

  useEffect(() => {
    const audio = new Audio();

    audio.preload = "metadata";
    audio.volume = musicVolume;
    audio.loop = musicRepeat;

    audioRef.current = audio;
    const setupAnalyser = () => {
      if (musicAnalyserRef.current) return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const context = new AudioContext();

      const source = context.createMediaElementSource(audio);

      const analyser = context.createAnalyser();

      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;

      source.connect(analyser);
      analyser.connect(context.destination);

      musicAudioContextRef.current = context;
      musicSourceRef.current = source;
      musicAnalyserRef.current = analyser;
      musicFrequencyDataRef.current = new Uint8Array(
        analyser.frequencyBinCount,
      );
    };
    audio.addEventListener("play", async () => {
      try {
        setupAnalyser();

        if (musicAudioContextRef.current?.state === "suspended") {
          await musicAudioContextRef.current.resume();
        }
      } catch (error) {
        console.error("Music analyser setup failed:", error);
      }
    });
    // ==========================================================
    // WEB AUDIO ANALYSER
    // ==========================================================

    const handleLoadedMetadata = () => {
      setMusicDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setMusicCurrentTime(audio.currentTime || 0);
    };

    const handlePlay = async () => {
      setMusicPlaying(true);

      try {
        if (!musicAnalyserRef.current) {
          setupAnalyser();
        }

        if (musicAudioContextRef.current?.state === "suspended") {
          await musicAudioContextRef.current.resume();
        }
      } catch (error) {
        console.error("Music analyser failed:", error);
      }
    };

    const handlePause = () => {
      setMusicPlaying(false);
    };

    const handleEnded = () => {
      setMusicPlaying(false);
      setMusicCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    audio.addEventListener("timeupdate", handleTimeUpdate);

    audio.addEventListener("play", handlePlay);

    audio.addEventListener("pause", handlePause);

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.src = "";

      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);

      audio.removeEventListener("timeupdate", handleTimeUpdate);

      audio.removeEventListener("play", handlePlay);

      audio.removeEventListener("pause", handlePause);

      audio.removeEventListener("ended", handleEnded);

      audioRef.current = null;
    };
  }, []);

  // UPDATE REPEAT WITHOUT RECREATING AUDIO
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = musicRepeat;
    }
  }, [musicRepeat]);

  // UPDATE VOLUME WITHOUT RECREATING AUDIO
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);
  useEffect(() => {
    const updateMusicProgress = () => {
      const audio = audioRef.current;

      if (audio && !audio.paused) {
        setMusicCurrentTime(audio.currentTime);
      }

      musicAnimationFrameRef.current =
        requestAnimationFrame(updateMusicProgress);
    };

    musicAnimationFrameRef.current = requestAnimationFrame(updateMusicProgress);

    return () => {
      if (musicAnimationFrameRef.current) {
        cancelAnimationFrame(musicAnimationFrameRef.current);
      }
    };
  }, []);
  const openMusicPlayer = () => {
    setMusicOpen(true);
    setMusicMinimized(false);
  };

  const minimizeMusicPlayer = () => {
    setMusicMinimized(true);
  };

  const restoreMusicPlayer = () => {
    setMusicMinimized(false);
  };

  const toggleMusicPlayback = async () => {
    const audio = audioRef.current;

    if (!audio || !currentSong) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        console.error("Audio playback failed:", error);
      }
    } else {
      audio.pause();
    }
  };

  const stopMusic = () => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;

    setMusicCurrentTime(0);
    setMusicPlaying(false);
  };

  const closeMusicPlayer = () => {
    stopMusic();

    setMusicOpen(false);
    setMusicMinimized(false);
  };

  const seekMusic = (event) => {
    const audio = audioRef.current;

    if (!audio || !audio.duration) return;

    audio.currentTime = Number(event.target.value);
  };

  const changeVolume = (event) => {
    const value = Number(event.target.value);

    setMusicVolume(value);

    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  const formatMusicTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return `${minutes}:${remaining.toString().padStart(2, "0")}`;
  };
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080a0e);
    scene.fog = new THREE.FogExp2(0x090b10, 0.025);
    setRoomScene(scene);

    const camera = new THREE.PerspectiveCamera(
      68,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );

    // -----------------------------------------
    // FIRST-PERSON CAMERA RIG
    // -----------------------------------------

    const yawObject = new THREE.Object3D();
    const pitchObject = new THREE.Object3D();

    yawObject.position.set(0, 2.3, 0.9);

    pitchObject.add(camera);
    yawObject.add(pitchObject);

    scene.add(yawObject);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    renderer.domElement.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      max-height: none !important;
      aspect-ratio: auto !important;
      display: block !important;
      z-index: 0 !important;
    `;

    mount.appendChild(renderer.domElement);

    const woodTexture = makeWoodTexture();
    woodTexture.repeat.set(2.8, 1.0);

    const darkWoodTexture = woodTexture.clone();
    darkWoodTexture.needsUpdate = true;
    darkWoodTexture.repeat.set(1.8, 1.0);

    const woodMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      color: 0x7b3d13,
      roughness: 0.34,
      metalness: 0.03,
    });

    const darkWoodMaterial = new THREE.MeshStandardMaterial({
      map: darkWoodTexture,
      color: 0x3b190b,
      roughness: 0.48,
      metalness: 0.04,
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4533,
      roughness: 0.88,
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b2618,
      roughness: 0.9,
    });

    addBox(
      scene,
      new THREE.BoxGeometry(10, 0.15, 10),
      floorMaterial,
      [0, -0.075, 0],
    );

    addBox(
      scene,
      new THREE.BoxGeometry(10, 3.4, 0.15),
      wallMaterial,
      [0, 1.7, -5],
    );

    addBox(
      scene,
      new THREE.BoxGeometry(0.15, 3.4, 10),
      wallMaterial,
      [-5, 1.7, 0],
    );

    addBox(
      scene,
      new THREE.BoxGeometry(0.15, 3.4, 10),
      wallMaterial,
      [5, 1.7, 0],
    );
    addBox(
      scene,
      new THREE.BoxGeometry(10, 3.4, 0.15),
      wallMaterial,
      [0, 1.7, 5],
    );
    addBox(
      scene,
      new THREE.BoxGeometry(10, 0.15, 10),
      wallMaterial,
      [0, 3.4, 0],
    );

    createRug(scene);
    createDesk(scene, woodMaterial, darkWoodMaterial);
    createChair(scene);
    const windowEnvironment = createWindow(scene, "/dist/room/outdoor.jpg");
    const deskLamp = createDeskLamp(scene);
    const recordPlayer = createRecordPlayer(scene);
    recordPlayer.userData.interactive = true;
    recordPlayer.userData.type = "musicPlayer";
    // ==========================================================
    // DISPLAY BOOK — standing upright, interactive
    // ==========================================================

    const bookGroup = new THREE.Group();
    bookGroup.position.set(0.5, 1.48, -3.3); // moved off to the side, clear of the lamp
    bookGroup.rotation.x = THREE.MathUtils.degToRad(10); // slight backward lean — flip sign if it leans the wrong way
    scene.add(bookGroup);

    const BOOK_WIDTH = 0.62;
    const BOOK_HEIGHT = 0.82;
    const COVER_THICKNESS = 0.03;
    const PAGES_THICKNESS = 0.05;

    const bookCoverMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1310,
      roughness: 0.35,
      metalness: 0.15,
    });

    const bookPagesMaterial = new THREE.MeshStandardMaterial({
      color: 0xc6b28e,
      roughness: 0.9,
    });

    const bookCoverTexture = new THREE.TextureLoader().load(
      "/dist/room/book-cover.png",
    );
    bookCoverTexture.colorSpace = THREE.SRGBColorSpace;

    const bookCoverArtMaterial = new THREE.MeshStandardMaterial({
      map: bookCoverTexture,
      roughness: 0.45,
      metalness: 0.05,
    });

    // Spine (resting on the desk)
    addRoundedBox(
      bookGroup,
      bookCoverMaterial,
      [BOOK_WIDTH, 0.04, PAGES_THICKNESS + COVER_THICKNESS * 2],
      [0, 0.02, 0],
      0.015,
      3,
    );

    // Back cover
    addRoundedBox(
      bookGroup,
      bookCoverMaterial,
      [BOOK_WIDTH, BOOK_HEIGHT, COVER_THICKNESS],
      [0, BOOK_HEIGHT / 2 + 0.04, -PAGES_THICKNESS / 2 - COVER_THICKNESS / 2],
      0.02,
      3,
    );

    // Pages
    addRoundedBox(
      bookGroup,
      bookPagesMaterial,
      [BOOK_WIDTH - 0.04, BOOK_HEIGHT - 0.04, PAGES_THICKNESS],
      [0, BOOK_HEIGHT / 2 + 0.04, 0],
      0.012,
      3,
    );

    // Front cover
    addRoundedBox(
      bookGroup,
      bookCoverMaterial,
      [BOOK_WIDTH, BOOK_HEIGHT, COVER_THICKNESS],
      [0, BOOK_HEIGHT / 2 + 0.04, PAGES_THICKNESS / 2 + COVER_THICKNESS / 2],
      0.02,
      3,
    );

    // Cover art — faces outward (+Z), no rotation needed since it's standing now
    const bookCoverArt = new THREE.Mesh(
      new THREE.PlaneGeometry(BOOK_WIDTH - 0.08, BOOK_HEIGHT - 0.08),
      bookCoverArtMaterial,
    );
    bookCoverArt.position.set(
      0,
      BOOK_HEIGHT / 2 + 0.04,
      PAGES_THICKNESS / 2 + COVER_THICKNESS + 0.002,
    );
    bookCoverArt.receiveShadow = true;
    bookGroup.add(bookCoverArt);

    // Small brass stand leg behind, propping it up
    const standMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5b24,
      roughness: 0.3,
      metalness: 0.75,
    });

    const standLeg = addRoundedBox(
      bookGroup,
      standMaterial,
      [BOOK_WIDTH - 0.1, 0.03, 0.03],
      [0, BOOK_HEIGHT * 0.55, -PAGES_THICKNESS / 2 - COVER_THICKNESS - 0.16],
      0.01,
      3,
    );
    standLeg.rotation.x = THREE.MathUtils.degToRad(-55);

    bookGroup.userData.interactive = true;
    bookGroup.userData.type = "book";
    // ==========================================================
    // PEN
    // ==========================================================

    const penMaterial = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.25,
      metalness: 0.6,
    });

    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.62, 12),
      penMaterial,
    );

    pen.rotation.z = Math.PI / 2 - 0.1;

    pen.position.set(-1.1, 1.59, -3.23);

    pen.castShadow = true;

    scene.add(pen);

    // ==========================================================
    // PHONE
    // ==========================================================

    const phoneBody = new THREE.MeshStandardMaterial({
      color: 0x08090b,
      roughness: 0.18,
      metalness: 0.62,
    });

    const phoneScreen = new THREE.MeshStandardMaterial({
      color: 0x10151b,
      roughness: 0.12,
      metalness: 0.25,
      emissive: 0x080b10,
      emissiveIntensity: 0.18,
    });

    // Phone body
    const phone = addRoundedBox(
      scene,
      phoneBody,
      [0.7, 0.055, 0.38],
      [0.05, 1.48, -3.05],
      0.04,
      5,
    );

    phone.rotation.y = -0.08;

    // Screen MUST follow the exact same position and rotation
    const screen = addRoundedBox(
      scene,
      phoneScreen,
      [0.57, 0.008, 0.3],
      [0.05, 1.512, -3.05],
      0.025,
      4,
    );

    screen.rotation.y = -0.08;
    const ambientLight = new THREE.HemisphereLight(0xffe8d2, 0x252a31, 3.5);
    scene.add(ambientLight);

    // -----------------------------------------
    // PROPER CEILING LIGHT FIXTURE
    // -----------------------------------------
    // The light is physically mounted to the ceiling.
    // The visible diffuser contains the actual light source,
    // instead of using a floating glowing sphere.

    const ceilingFixture = new THREE.Group();
    ceilingFixture.position.set(0, 3.38, -0.35);

    const ceilingMount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.1, 16),
      new THREE.MeshStandardMaterial({
        color: 0x282019,
        roughness: 0.45,
        metalness: 0.55,
      }),
    );
    ceilingMount.position.y = -0.05;
    ceilingFixture.add(ceilingMount);

    const ceilingRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.46, 0.1, 32),
      new THREE.MeshStandardMaterial({
        color: 0x3b2818,
        roughness: 0.38,
        metalness: 0.68,
      }),
    );
    ceilingRim.position.y = -0.11;
    ceilingRim.castShadow = true;
    ceilingFixture.add(ceilingRim);

    const ceilingDiffuser = new THREE.Mesh(
      new THREE.SphereGeometry(0.39, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.58),
      new THREE.MeshStandardMaterial({
        color: 0xffdfb2,
        emissive: 0xffb85e,
        emissiveIntensity: 0.75,
        roughness: 0.3,
        metalness: 0.02,
      }),
    );
    ceilingDiffuser.position.y = -0.18;
    ceilingFixture.add(ceilingDiffuser);

    // Main illumination is inside the fixture.
    const ceilingLight = new THREE.PointLight(0xffd0a0, 7.2, 18, 0.5);
    ceilingLight.position.set(0, -0.18, 0);
    ceilingLight.castShadow = true;
    ceilingLight.shadow.mapSize.set(512, 512);
    ceilingFixture.add(ceilingLight);

    // Broad downward fill so the desk/shelves remain readable.
    const ceilingDownLight = new THREE.SpotLight(
      0xffd6a4,
      3.2,
      8,
      Math.PI / 2.6,
      0.55,
      1.4,
    );
    ceilingDownLight.position.set(0, -0.18, 0);
    ceilingDownLight.target.position.set(0, -1.9, 0);
    ceilingFixture.add(ceilingDownLight);
    ceilingFixture.add(ceilingDownLight.target);

    scene.add(ceilingFixture);

    const windowLight = new THREE.DirectionalLight(0x9fb9df, 0.75);
    windowLight.position.set(0, 3.0, -2.5);
    scene.add(windowLight);

    const wallLampMaterial = new THREE.MeshStandardMaterial({
      color: 0x68431d,
      roughness: 0.36,
      metalness: 0.7,
    });

    const wallLamp = new THREE.Group();
    wallLamp.position.set(4.55, 2.72, -1.55);
    scene.add(wallLamp);

    addRoundedBox(
      wallLamp,
      wallLampMaterial,
      [0.12, 0.52, 0.08],
      [0, 0, 0],
      0.03,
    );

    const wallShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.26, 0.4, 20, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x8a602b,
        roughness: 0.45,
        metalness: 0.15,
        side: THREE.DoubleSide,
      }),
    );
    wallShade.position.set(0, 0.34, 0);
    wallShade.rotation.z = Math.PI;
    wallLamp.add(wallShade);

    const wallBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd08b }),
    );
    wallBulb.position.set(0, 0.16, 0);
    wallLamp.add(wallBulb);

    const wallLight = new THREE.PointLight(0xffc174, 2.2, 4.5, 2);
    wallLight.position.set(0, 0.12, 0.05);
    wallLight.castShadow = true;
    wallLight.shadow.mapSize.set(256, 256);
    wallLamp.add(wallLight);

    const switchGroup = new THREE.Group();
    // Put the switch on the same right-hand wall as the painting. The local
    // +Z face is rotated toward the room (negative world X).
    switchGroup.position.set(4.91, 1.55, -2.75);
    switchGroup.rotation.y = -Math.PI / 2;

    const switchPlate = new THREE.Mesh(
      new RoundedBoxGeometry(0.18, 0.28, 0.04, 3, 0.018),
      new THREE.MeshStandardMaterial({
        color: 0x302a24,
        roughness: 0.7,
      }),
    );

    switchGroup.add(switchPlate);

    const switchToggle = new THREE.Mesh(
      new RoundedBoxGeometry(0.08, 0.15, 0.06, 3, 0.012),
      new THREE.MeshStandardMaterial({
        color: 0xf5f2eb,
        roughness: 0.55,
      }),
    );

    switchToggle.position.set(0, 0, 0.04);
    switchGroup.add(switchToggle);

    // Give the small switch a forgiving raycast target without changing its
    // visible size. Transparent meshes are still raycastable in Three.js.
    const switchHitArea = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.52, 0.16),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    switchHitArea.userData.interactive = true;
    switchGroup.add(switchHitArea);

    switchGroup.userData.interactive = true;
    switchGroup.userData.type = "lightSwitch";
    scene.add(switchGroup);

    const MOVE_SPEED = 3.0;
    const PLAYER_RADIUS = 0.08;

    const ROOM_MIN_X = -5 + PLAYER_RADIUS;
    const ROOM_MAX_X = 5 - PLAYER_RADIUS;
    const ROOM_MIN_Z = -5 + PLAYER_RADIUS;
    const ROOM_MAX_Z = 5 - PLAYER_RADIUS;
    // ==========================================================
    // FURNITURE COLLISION
    // ==========================================================

    const furnitureColliders = [
      // Main desk
      {
        minX: -4.35,
        maxX: 4.35,
        minZ: -4.9,
        maxZ: -2.0,
      },

      // Chair
      {
        minX: -4.35,
        maxX: 4.35,
        minZ: -4.9,
        maxZ: -2.42,
      },

      // Record player
      {
        minX: -4.35,
        maxX: 4.35,
        minZ: -4.9,
        maxZ: -2.42,
      },

      // Desk lamp
      {
        minX: -4.35,
        maxX: 4.35,
        minZ: -4.9,
        maxZ: -2.42,
      },
    ];
    // ==========================================================
    // MUSIC-REACTIVE EXISTING LIGHTS
    // ==========================================================

    musicLightingRef.current = {
      ceiling: ceilingLight,
      ceilingDown: ceilingDownLight,
      wall: wallLight,
      desk: deskLamp.light,

      base: {
        ceiling: ceilingLight.color.clone(),
        ceilingDown: ceilingDownLight.color.clone(),
        wall: wallLight.color.clone(),
        desk: deskLamp.light.color.clone(),
      },

      target: {
        colorA: new THREE.Color(0xffd0a0),
        colorB: new THREE.Color(0xffd6a4),
        colorC: new THREE.Color(0xffc174),
        intensity: 1,
      },
    };
    applyMusicTheme(MUSIC_LIGHT_PROFILES[currentSongIndex % MUSIC_LIGHT_PROFILES.length]);
    const collidesWithFurniture = (x, z) => {
      for (const collider of furnitureColliders) {
        const closestX = THREE.MathUtils.clamp(x, collider.minX, collider.maxX);

        const closestZ = THREE.MathUtils.clamp(z, collider.minZ, collider.maxZ);

        const dx = x - closestX;
        const dz = z - closestZ;

        if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) {
          return true;
        }
      }

      return false;
    };
    const keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      lookLeft: false,
      lookRight: false,
      lookUp: false,
      lookDown: false,
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowleft",
          "arrowright",
          "arrowup",
          "arrowdown",
          "e",
          "escape",
        ].includes(key)
      ) {
        event.preventDefault();
      }

      if (key === "escape") {
        if (selectedArtworkRef.current) {
          selectedArtworkRef.current = null;
          setSelectedArtwork(null);
          return;
        }

        if (musicOpenRef.current && !musicMinimizedRef.current) {
          setMusicMinimized(true);
          return;
        }

        return;
      }

      if (key === "e") {
        console.log("E PRESSED");
        if (selectedArtworkRef.current) {
          selectedArtworkRef.current = null;
          setSelectedArtwork(null);
          return;
        }

        const target = lookedAtObjectRef.current;
        console.log("TARGET:", target, "TYPE:", target?.userData?.type);

        if (target?.userData?.type === "musicPlayer") {
          setMusicOpen(true);
          setMusicMinimized(false);
          return;
        }

        interactionRef.current?.interact();
        return;
      }

      if (key === "w") keys.forward = true;
      if (key === "s") keys.backward = true;
      if (key === "a") keys.left = true;
      if (key === "d") keys.right = true;
      if (key === "arrowleft") keys.lookLeft = true;
      if (key === "arrowright") keys.lookRight = true;
      if (key === "arrowup") keys.lookUp = true;
      if (key === "arrowdown") keys.lookDown = true;
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();

      if (key === "w") keys.forward = false;
      if (key === "s") keys.backward = false;
      if (key === "a") keys.left = false;
      if (key === "d") keys.right = false;
      if (key === "arrowleft") keys.lookLeft = false;
      if (key === "arrowright") keys.lookRight = false;
      if (key === "arrowup") keys.lookUp = false;
      if (key === "arrowdown") keys.lookDown = false;
    };

    // -----------------------------------------
    // MOVEMENT
    // -----------------------------------------

    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();

    let cameraYaw = 0;
    let cameraPitch = 0;

    const movePlayer = (delta) => {
      // -----------------------------------------
      // LOOK
      // -----------------------------------------

      const LOOK_SPEED = 1.8;

      // LEFT / RIGHT = YAW
      if (keys.lookLeft) {
        cameraYaw += LOOK_SPEED * delta;
      }

      if (keys.lookRight) {
        cameraYaw -= LOOK_SPEED * delta;
      }

      // UP / DOWN = PITCH
      if (keys.lookUp) {
        cameraPitch += LOOK_SPEED * delta;
      }

      if (keys.lookDown) {
        cameraPitch -= LOOK_SPEED * delta;
      }

      // Limit looking up/down
      cameraPitch = THREE.MathUtils.clamp(
        cameraPitch,
        -Math.PI / 2 + 0.05,
        Math.PI / 2 - 0.05,
      );

      // Apply rotations to SEPARATE objects.
      // This is what prevents roll.
      yawObject.rotation.y = cameraYaw;
      yawObject.rotation.x = 0;
      yawObject.rotation.z = 0;

      pitchObject.rotation.x = cameraPitch;
      pitchObject.rotation.y = 0;
      pitchObject.rotation.z = 0;

      // -----------------------------------------
      // MOVEMENT DIRECTION
      // -----------------------------------------
      // Movement uses YAW ONLY.
      // Pitch is completely ignored.

      direction.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));

      right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

      // -----------------------------------------
      // MOVEMENT INPUT
      // -----------------------------------------

      let forwardInput = 0;
      let rightInput = 0;

      if (keys.forward) {
        forwardInput += 1;
      }

      if (keys.backward) {
        forwardInput -= 1;
      }

      if (keys.right) {
        rightInput += 1;
      }

      if (keys.left) {
        rightInput -= 1;
      }

      if (forwardInput === 0 && rightInput === 0) {
        return;
      }

      const movement = new THREE.Vector3();

      movement.addScaledVector(direction, forwardInput);
      movement.addScaledVector(right, rightInput);

      // Prevent diagonal movement from being faster
      if (movement.lengthSq() > 0) {
        movement.normalize();
      }

      movement.multiplyScalar(MOVE_SPEED * delta);

      // ==========================================================
      // COLLISION-AWARE MOVEMENT
      // ==========================================================

      const currentX = yawObject.position.x;
      const currentZ = yawObject.position.z;

      const nextX = THREE.MathUtils.clamp(
        currentX + movement.x,
        ROOM_MIN_X,
        ROOM_MAX_X,
      );

      const nextZ = THREE.MathUtils.clamp(
        currentZ + movement.z,
        ROOM_MIN_Z,
        ROOM_MAX_Z,
      );

      // ----------------------------------------------------------
      // X AXIS
      // ----------------------------------------------------------
      // Try X movement independently.
      // This allows the player to slide along furniture.

      if (!collidesWithFurniture(nextX, currentZ)) {
        yawObject.position.x = nextX;
      }

      // ----------------------------------------------------------
      // Z AXIS
      // ----------------------------------------------------------
      // Try Z movement independently.
      //
      // If X was blocked, Z can still move.
      // This is what creates natural sliding around furniture.

      if (!collidesWithFurniture(yawObject.position.x, nextZ)) {
        yawObject.position.z = nextZ;
      }

      // Keep eye height fixed
      yawObject.position.y = 2.3;
    };

    const interaction = new InteractionManager(camera, renderer);
    interactionRef.current = interaction;

    interaction.add(switchGroup);
    interaction.add(recordPlayer);

    interaction.onInteract = (object) => {
      if (!object) return;
      if (object.userData.type === "musicPlayer") {
        openMusicPlayer();
        return;
      }
      if (object.userData.type === "wallFrame") {
        const artwork = {
          image: roomContent.frames[0].image,
          title: object.userData.title,
          description: object.userData.description,
        };

        selectedArtworkRef.current = artwork;
        setSelectedArtwork(artwork);
        return;
      }

      if (object.userData.type === "lightSwitch") {
        setRoomLightOn((previous) => {
          const nextState = !previous;

          ceilingLight.intensity = nextState ? 2.8 : 0;
          ceilingDownLight.intensity = nextState ? 1.2 : 0;
          ceilingDiffuser.material.emissiveIntensity = nextState ? 0.75 : 0;
          wallLight.intensity = nextState ? 2.2 : 0;
          deskLamp.light.intensity = nextState ? 2.5 : 0;

          switchToggle.rotation.x = nextState ? 0 : -0.35;

          wallBulb.material.color.set(nextState ? 0xffd08b : 0x222222);

          deskLamp.bulb.material.color.set(nextState ? 0xffe4b5 : 0x222222);

          return nextState;
        });
      }
      if (object.userData.type === "book") {
        setSelectedBook({
          cover: roomContent.book.cover,
          title: roomContent.book.title ?? "Untitled",
          description: roomContent.book.description ?? "",
        });
        return;
      }
    };

    const rain = windowEnvironment.rain;
    const timer = new THREE.Timer();
    let elapsed = 0;

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);

    let animationFrame;

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);

      timer.update();

      const delta = Math.min(timer.getDelta(), 0.05);
      elapsed += delta;

      movePlayer(delta);
      if (rain) {
        const positions = rain.geometry.attributes.position.array;
        const streakLength = rain.userData.streakLength ?? 0.14;

        for (let i = 0; i < positions.length; i += 6) {
          const fall = delta * 4.5;

          positions[i + 1] -= fall;
          positions[i + 4] -= fall;

          if (positions[i + 1] < -1.4) {
            positions[i + 1] = 1.4;
            positions[i + 4] = 1.4 - streakLength;
          }
        }

        rain.geometry.attributes.position.needsUpdate = true;
      }
      if (windowEnvironment.nightPlane) {
        const dayLengthSeconds = 300; // adjust to taste
        windowEnvironment.nightPlane.material.opacity = Math.min(
          elapsed / dayLengthSeconds,
          1,
        );
      }
      const platter = recordPlayer.children.find(
        (child) =>
          child.geometry?.type === "CylinderGeometry" &&
          child.position.x === -0.12,
      );

      if (platter && musicPlaying) {
        platter.rotation.y += delta * 2.2;
      }

      const lookedAt = interaction.update();

      if (lookedAt !== interaction.previousObject) {
        lookedAtObjectRef.current = lookedAt;
        setLookedAtObject(lookedAt);

        if (lookedAt) {
          console.log("LOOKED AT:", lookedAt, "TYPE:", lookedAt.userData?.type);
        }
      }
      // ==========================================================
      // MUSIC REACTION
      // ==========================================================

      const analyser = musicAnalyserRef.current;
      const lighting = musicLightingRef.current;

      if (analyser && lighting) {
        const data = musicFrequencyDataRef.current;

        if (data) {
          analyser.getByteFrequencyData(data);

          const bassEnd = Math.max(1, Math.floor(data.length * 0.08));

          const midEnd = Math.max(bassEnd + 1, Math.floor(data.length * 0.35));

          let bass = 0;
          let mids = 0;
          let treble = 0;

          for (let i = 0; i < bassEnd; i++) {
            bass += data[i];
          }

          for (let i = bassEnd; i < midEnd; i++) {
            mids += data[i];
          }

          for (let i = midEnd; i < data.length; i++) {
            treble += data[i];
          }

          bass = bass / bassEnd / 255;

          mids = mids / Math.max(1, midEnd - bassEnd) / 255;

          treble =
            data.length - midEnd > 0
              ? treble / (data.length - midEnd) / 255
              : 0;

          const energy = bass * 0.55 + mids * 0.3 + treble * 0.15;

          const playing = audioRef.current && !audioRef.current.paused;

          const target = lighting.target;

          if (target) {
            // ------------------------------------------------------
            // COLOUR REACTION
            // ------------------------------------------------------

            if (lighting.wall?.color && target.colorA) {
              lighting.wall.color.lerp(target.colorA, 0.035);
            }

            if (lighting.ceiling?.color && target.colorB) {
              lighting.ceiling.color.lerp(target.colorB, 0.045);
            }

            if (lighting.ceilingDown?.color && target.colorB) {
              lighting.ceilingDown.color.lerp(target.colorB, 0.045);
            }

            if (lighting.desk?.color && target.colorC) {
              lighting.desk.color.lerp(target.colorC, 0.04);
            }

            // ------------------------------------------------------
            // INTENSITY REACTION
            // ------------------------------------------------------

            const pulse = playing
              ? target.intensity * (0.35 + energy * 1.15)
              : 0;

            if (lighting.wall) {
              lighting.wall.intensity = THREE.MathUtils.lerp(
                lighting.wall.intensity,
                pulse,
                0.06,
              );
            }

            if (lighting.ceiling) {
              lighting.ceiling.intensity = THREE.MathUtils.lerp(
                lighting.ceiling.intensity,
                pulse * (0.65 + treble * 0.5),
                0.05,
              );
            }

            if (lighting.ceilingDown) {
              lighting.ceilingDown.intensity = THREE.MathUtils.lerp(
                lighting.ceilingDown.intensity,
                pulse * (0.35 + bass * 0.7),
                0.06,
              );
            }

            if (lighting.desk) {
              lighting.desk.intensity = THREE.MathUtils.lerp(
                lighting.desk.intensity,
                pulse * (0.3 + mids * 0.65),
                0.06,
              );
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);

      interaction.destroy();
      interactionRef.current = null;

      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();

        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => {
            Object.keys(material).forEach((key) => {
              const value = material[key];

              if (value && value.isTexture) value.dispose();
            });

            material.dispose();
          });
        }
      });

      renderer.dispose();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }

      setRoomScene(null);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#080a0e",
        cursor: "default",
      }}
    >
      <style>
        {`
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }

      to {
        transform: rotate(360deg);
      }
    }

    @keyframes coverPulse {
      0% {
        transform: scale(0.98);
        opacity: 0.55;
      }

      50% {
        transform: scale(1.06);
        opacity: 0.95;
      }

      100% {
        transform: scale(0.98);
        opacity: 0.55;
      }
    }

    @keyframes soundBar {
      0% {
        transform: scaleY(0.35);
      }

      100% {
        transform: scaleY(1);
      }
    }
      @keyframes musicBorderPulse {
  0% {
    box-shadow:
      0 0 0 1px rgba(255, 190, 100, 0.14),
      0 0 20px rgba(255, 145, 70, 0.18),
      0 0 38px rgba(255, 100, 50, 0.08);
  }

  50% {
    box-shadow:
      0 0 0 2px rgba(255, 205, 120, 0.28),
      0 0 34px rgba(255, 145, 70, 0.36),
      0 0 70px rgba(255, 100, 50, 0.16);
  }

  100% {
    box-shadow:
      0 0 0 1px rgba(255, 190, 100, 0.14),
      0 0 20px rgba(255, 145, 70, 0.18),
      0 0 38px rgba(255, 100, 50, 0.08);
  }
}
  `}
      </style>
      {roomScene && roomContent.frames[0] && (
        <WallFrame
          scene={roomScene}
          image={roomContent.frames[0].image}
          title={roomContent.frames[0].title}
          description={roomContent.frames[0].description}
          position={[4.82, 2.35, -0.8]}
          rotation={[0, Math.PI / 2, 0]}
          width={1.5}
          height={1.9}
          onReady={(frame) => {
            if (!frame) return;

            const register = () => {
              const manager = interactionRef.current;

              if (!manager) {
                requestAnimationFrame(register);
                return;
              }

              frame.userData.interactive = true;
              frame.userData.type = "wallFrame";
              manager.add(frame);
            };

            register();
          }}
        />
      )}

      {selectedArtwork && (
        <div
          onClick={() => {
            selectedArtworkRef.current = null;
            setSelectedArtwork(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            background: "rgba(0,0,0,0.92)",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "18px",
            }}
          >
            <img
              src={selectedArtwork.image}
              alt={selectedArtwork.title || "Artwork"}
              style={{
                display: "block",
                maxWidth: "85vw",
                maxHeight: "75vh",
                objectFit: "contain",
                boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
              }}
            />

            {selectedArtwork.title && (
              <div
                style={{
                  color: "#fff",
                  fontSize: "18px",
                  letterSpacing: "0.04em",
                }}
              >
                {selectedArtwork.title}
              </div>
            )}

            {selectedArtwork.description && (
              <div
                style={{
                  maxWidth: "600px",
                  color: "rgba(255,255,255,0.65)",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  textAlign: "center",
                }}
              >
                {selectedArtwork.description}
              </div>
            )}
          </div>
        </div>
      )}
      {lookedAtObject && !selectedArtwork && !musicOpen && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: "10%",
            transform: "translateX(-50%)",
            zIndex: 50,

            padding: "10px 18px",
            borderRadius: "14px",

            background: "rgba(15,15,18,0.58)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",

            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.35)",

            color: "rgba(255,255,255,0.9)",
            fontSize: "13px",
            letterSpacing: "0.03em",

            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {lookedAtObject.userData?.type === "musicPlayer"
            ? "Press E to interact"
            : lookedAtObject.userData?.type === "wallFrame"
              ? "Press E to view"
              : lookedAtObject.userData?.type === "lightSwitch"
                ? "Press E to toggle"
                : "Press E to interact"}
        </div>
      )}

      {/* ADD MUSIC PLAYER HERE */}
      {musicOpen && !musicMinimized && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 200,
            width: "min(760px, 90vw)",
            maxHeight: "86vh",
            overflow: "hidden",
            borderRadius: "30px",

            background:
              "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.055))",

            backdropFilter: "blur(35px) saturate(160%)",
            WebkitBackdropFilter: "blur(35px) saturate(160%)",

            border: "1px solid rgba(255,255,255,0.2)",

            boxShadow:
              "0 35px 120px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.16)",

            color: "#fff",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: "5px",
                }}
              >
                Kehkash Music Room
              </div>

              <div
                style={{
                  fontSize: "21px",
                  fontWeight: 600,
                }}
              >
                Music Player
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              {/* MINIMIZE */}
              <button
                onClick={() => setMusicMinimized(true)}
                title="Minimize"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.07)",
                  color: "#fff",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                −
              </button>

              {/* CLOSE */}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  const audio = audioRef.current;

                  if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                  }

                  setMusicPlaying(false);
                  setMusicCurrentTime(0);
                  setMusicOpen(false);
                  setMusicMinimized(false);
                }}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.07)",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  fontSize: "20px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* MAIN PLAYER */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "260px 1fr",
              gap: "28px",
              padding: "28px",
            }}
          >
            {/* ALBUM / VINYL */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "280px",
                  height: "280px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* LIVING GLOW */}
                <div
                  style={{
                    position: "absolute",
                    inset: "12px",
                    borderRadius: "30px",
                    background: "rgba(255, 150, 70, 0.22)",
                    filter: "blur(28px)",
                    opacity: musicPlaying ? 0.9 : 0.35,
                    transform: musicPlaying ? "scale(1.08)" : "scale(0.96)",
                    transition: "opacity 700ms ease, transform 700ms ease",
                    animation: musicPlaying
                      ? "coverPulse 2.2s ease-in-out infinite"
                      : "none",
                  }}
                />

                {/* OUTER GLASS FRAME */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "30px",
                    border: "1px solid rgba(255,255,255,0.22)",
                    background: "rgba(255,255,255,0.025)",
                    boxShadow: musicPlaying
                      ? "0 0 0 1px rgba(255,190,100,0.18), 0 0 28px rgba(255,145,70,0.28), 0 0 55px rgba(255,100,50,0.12)"
                      : "0 0 0 1px rgba(255,255,255,0.08), 0 0 20px rgba(255,150,80,0.08)",
                    animation: musicPlaying
                      ? "musicBorderPulse 1.4s ease-in-out infinite"
                      : "none",
                    transition: "box-shadow 500ms ease",
                    pointerEvents: "none",
                  }}
                />

                {/* ALBUM COVER */}
                <div
                  style={{
                    position: "relative",
                    width: "250px",
                    height: "250px",
                    borderRadius: "24px",
                    overflow: "hidden",
                    zIndex: 2,
                    boxShadow:
                      "0 18px 50px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.12)",
                  }}
                >
                  {currentSong?.cover ? (
                    <img
                      src={currentSong.cover}
                      alt={currentSong.title || "Song cover"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transform: musicPlaying ? "scale(1.025)" : "scale(1)",
                        transition: "transform 1.2s ease",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      No Cover
                    </div>
                  )}
                </div>

                {/* AUDIO VISUALIZER */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-16px",
                    left: "0",
                    width: "100%",
                    height: "32px",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: "4px",
                    pointerEvents: "none",
                    zIndex: 4,

                    opacity: musicPlaying ? 1 : 0,
                    transition: "opacity 400ms cubic-bezier(0.12, 1, 0.96, 1)",
                  }}
                >
                  {[
                    12, 18, 25, 15, 30, 22, 34, 18, 28, 38, 24, 32, 20, 40, 27,
                    35, 18, 30, 23, 16, 28, 36, 21, 31, 17, 26, 14, 22, 12,
                  ].map((height, index) => (
                    <span
                      key={index}
                      style={{
                        flex: "1",
                        maxWidth: "7px",
                        height: `${height}px`,
                        borderRadius: "4px 4px 0 0",
                        background: "rgba(255, 190, 0, 0.9)",
                        transformOrigin: "bottom",

                        animation: `soundBar ${
                          0.45 + (index % 5) * 0.08
                        }s ease-in-out infinite alternate`,

                        animationDelay: `${index * 0.035}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* CONTROLS */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                height: "280px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "8px 8px 4px 0",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 650,
                    lineHeight: 1.15,
                    marginBottom: "7px",
                  }}
                >
                  {currentSong?.title || "No song selected"}
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "14px",
                  }}
                >
                  {currentSong?.artist || "Kehkash"}
                </div>
              </div>

              {/* PROGRESS */}
              <input
                type="range"
                min="0"
                max={musicDuration || 0}
                step="0.0001"
                value={musicCurrentTime}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  if (audioRef.current) {
                    audioRef.current.currentTime = value;
                  }

                  setMusicCurrentTime(value);
                }}
                style={{
                  width: "100%",
                  accentColor: "#fff",
                  cursor: "pointer",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "7px",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                <span>
                  {Math.floor(musicCurrentTime / 60)}:
                  {String(Math.floor(musicCurrentTime % 60)).padStart(2, "0")}
                </span>

                <span>
                  {Math.floor(musicDuration / 60)}:
                  {String(Math.floor(musicDuration % 60)).padStart(2, "0")}
                </span>
              </div>

              {/* PLAYBACK BUTTONS */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "20px",
                  marginTop: "4px",
                }}
              >
                <button
                  onClick={playPreviousSong}
                  style={{
                    width: "45px",
                    height: "45px",
                    padding: 0,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.07)",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 5v14" />
                    <path d="M18 5l-9 7 9 7V5z" />
                  </svg>
                </button>
                {/* Looping option */}
                <button
                  type="button"
                  onClick={() => setMusicRepeat((prev) => !prev)}
                  title={musicRepeat ? "Repeat on" : "Repeat off"}
                  style={{
                    width: "45px",
                    height: "45px",
                    padding: 0,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: musicRepeat
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(255,255,255,0.07)",
                    color: musicRepeat ? "#fff" : "rgba(255,255,255,0.65)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 2l4 4-4 4" />
                    <path d="M3 11V9a3 3 0 0 1 3-3h15" />
                    <path d="M7 22l-4-4 4-4" />
                    <path d="M21 13v2a3 3 0 0 1-3 3H3" />
                  </svg>
                </button>
                <button
                  onClick={async () => {
                    if (!audioRef.current) return;

                    if (musicPlaying) {
                      audioRef.current.pause();
                    } else {
                      try {
                        await audioRef.current.play();
                      } catch (error) {
                        console.error("Playback failed:", error);
                      }
                    }
                  }}
                  style={{
                    width: "68px",
                    height: "68px",
                    padding: 0,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.35)",
                    background: "#fff",
                    color: "#1b1110",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                  }}
                >
                  {musicPlaying ? (
                    // PAUSE
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{
                        display: "block",
                      }}
                    >
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    // PLAY
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{
                        display: "block",
                        transform: "translateX(1px)",
                      }}
                    >
                      <path d="M8 5.5v13a1 1 0 0 0 1.52.86l10-6.5a1 1 0 0 0 0-1.72l-10-6.5A1 1 0 0 0 8 5.5Z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={playNextSong}
                  style={{
                    width: "45px",
                    height: "45px",
                    padding: 0,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.07)",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 5v14" />
                    <path d="M6 5l9 7-9 7V5z" />
                  </svg>
                </button>
              </div>

              {/* VOLUME */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  marginTop: "2px",
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    opacity: 0.75,
                    width: "20px",
                    textAlign: "center",
                  }}
                >
                  🔊
                </span>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={musicVolume}
                  onChange={(event) => {
                    const value = Number(event.target.value);

                    setMusicVolume(value);

                    if (audioRef.current) {
                      audioRef.current.volume = value;
                    }
                  }}
                  style={{
                    flex: 1,
                    accentColor: "#fff",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
          </div>

          {/* SONG LIST */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              padding: "18px 24px 22px",
              maxHeight: "190px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "10px",
              }}
            >
              Songs
            </div>

            {roomContent.music?.map((song, index) => (
              <button
                key={index}
                onClick={() => selectSong(index)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "11px 12px",
                  marginBottom: "4px",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    index === currentSongIndex
                      ? "rgba(255,255,255,0.12)"
                      : "transparent",
                  color: "#fff",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: "26px",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "12px",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span
                  style={{
                    flex: 1,
                    fontSize: "14px",
                  }}
                >
                  {song.title || `Song ${index + 1}`}
                </span>

                {index === currentSongIndex && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {musicPlaying ? "Playing" : "Selected"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      {musicOpen && musicMinimized && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: "28px",
            transform: "translateX(-50%)",
            zIndex: 200,

            width: "min(520px, 88vw)",
            padding: "12px 16px",

            borderRadius: "18px",

            background:
              "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.055))",

            backdropFilter: "blur(25px) saturate(150%)",
            WebkitBackdropFilter: "blur(25px) saturate(150%)",

            border: "1px solid rgba(255,255,255,0.18)",

            boxShadow: "0 15px 50px rgba(0,0,0,0.5)",

            color: "#fff",

            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              overflow: "hidden",
              flexShrink: 0,
              background: "rgba(255,255,255,0.08)",
            }}
          >
            {currentSong?.cover ? (
              <img
                src={currentSong.cover}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : null}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentSong?.title || "No song selected"}
            </div>

            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.45)",
                marginTop: "3px",
              }}
            >
              {musicPlaying ? "Playing" : "Paused"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "auto",
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMusicRepeat((prev) => !prev);
              }}
              title={musicRepeat ? "Repeat on" : "Repeat off"}
              style={{
                width: "34px",
                height: "34px",
                padding: 0,
                borderRadius: "9px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: musicRepeat
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(255,255,255,0.07)",
                color: musicRepeat ? "#fff" : "rgba(255,255,255,0.65)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 2l4 4-4 4" />
                <path d="M3 11V9a3 3 0 0 1 3-3h15" />
                <path d="M7 22l-4-4 4-4" />
                <path d="M21 13v2a3 3 0 0 1-3 3H3" />
              </svg>
            </button>
            {/* PREVIOUS */}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                playPreviousSong();
              }}
              style={{
                width: "34px",
                height: "34px",
                padding: 0,
                borderRadius: "9px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.07)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 5v14" />
                <path d="M18 5l-9 7 9 7V5z" />
              </svg>
            </button>

            {/* PLAY / PAUSE */}
            <button
              type="button"
              onClick={async (event) => {
                event.preventDefault();
                event.stopPropagation();

                const audio = audioRef.current;

                if (!audio) return;

                if (musicPlaying) {
                  audio.pause();
                } else {
                  try {
                    await audio.play();
                  } catch (error) {
                    console.error("Playback failed:", error);
                  }
                }
              }}
              style={{
                width: "38px",
                height: "38px",
                padding: 0,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "#fff",
                color: "#1b1110",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {musicPlaying ? (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5.5v13a1 1 0 0 0 1.52.86l10-6.5a1 1 0 0 0 0-1.72l-10-6.5A1 1 0 0 0 8 5.5Z" />
                </svg>
              )}
            </button>

            {/* NEXT */}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                playNextSong();
              }}
              style={{
                width: "34px",
                height: "34px",
                padding: 0,
                borderRadius: "9px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.07)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 5v14" />
                <path d="M6 5l9 7-9 7V5z" />
              </svg>
            </button>

            {/* EXPAND */}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMusicMinimized(false);
                setMusicOpen(true);
              }}
              style={{
                width: "36px",
                height: "36px",
                padding: 0,
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.07)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ↑
            </button>

            {/* CLOSE */}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }

                setMusicPlaying(false);
                setMusicCurrentTime(0);
                setMusicOpen(false);
                setMusicMinimized(false);
              }}
              style={{
                width: "36px",
                height: "36px",
                padding: 0,
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.07)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
