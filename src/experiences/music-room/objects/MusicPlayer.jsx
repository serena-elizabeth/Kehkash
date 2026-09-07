import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { roomContent } from "../data/roomContent";

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  const m = Math.floor(value / 60);
  const s = Math.floor(value % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function mat(color, roughness = 0.5, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function textTexture(text, color = "#d7ad63", size = 90) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `500 ${size}px Georgia, serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 600, 150);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addBox(parent, size, position, material, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

export default function MusicPlayer({ scene, music = [], interactionRef }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [miniDismissed, setMiniDismissed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const recordRef = useRef(null);
  const playingRef = useRef(false);
  const powerRef = useRef(null);

  const currentSong = music[currentIndex] || null;

  const nextIndex = useMemo(
    () => (music.length ? (currentIndex + 1) % music.length : 0),
    [music.length, currentIndex],
  );

  const previousIndex = useMemo(
    () => (music.length ? (currentIndex - 1 + music.length) % music.length : 0),
    [music.length, currentIndex],
  );

  // --------------------------------------------------
  // REALISTIC SUITCASE TURNTABLE
  // --------------------------------------------------
  useEffect(() => {
    if (!scene || !interactionRef.current) return;

    const player = new THREE.Group();
    player.position.set(-3.55, 0.95, -3.55);
    player.rotation.y = Math.PI + 0.08;

    player.userData.type = "musicPlayer";
    player.userData.interactive = true;
    player.userData.open = () => setIsOpen(true);

    const shell = mat(0x090a0c, 0.3, 0.38);
    const shellSoft = mat(0x17181b, 0.48, 0.25);
    const innerRed = mat(0x4d090d, 0.62, 0.08);
    const red = mat(0xa3131a, 0.42, 0.18);
    const gold = mat(0xc69a50, 0.22, 0.9);
    const silver = mat(0xb8b8b4, 0.2, 0.9);
    const rubber = mat(0x050505, 0.9, 0.02);
    const wood = mat(0x402315, 0.46, 0.03);

    // --------------------------------------------------
    // ROYAL WRITING DESK
    // --------------------------------------------------

    const table = new THREE.Group();
    player.add(table);

    const deskWood = mat(0x3a1d0f, 0.55, 0.02);
    const deskDark = mat(0x1b0d08, 0.78, 0.01);
    const deskGold = mat(0x8c6530, 0.28, 0.75);

    // Large polished tabletop
    addBox(table, [4.6, 0.16, 1.72], [0, -0.05, 0], deskWood);

    // Slightly darker underside
    addBox(table, [4.42, 0.1, 1.55], [0, -0.15, 0], deskDark);

    // --------------------------------------------------
    // TABLE LEGS
    // --------------------------------------------------

    for (const x of [-2.05, 2.05]) {
      for (const z of [-0.63, 0.63]) {
        addBox(table, [0.16, 1.05, 0.16], [x, -0.58, z], deskDark);
      }
    }

    // --------------------------------------------------
    // FRONT APRON
    // --------------------------------------------------

    addBox(table, [4.25, 0.2, 0.12], [0, -0.38, -0.72], deskDark);

    // --------------------------------------------------
    // CENTRAL DRAWER
    // --------------------------------------------------

    const drawer = new THREE.Group();

    drawer.position.set(0, -0.34, -0.75);
    table.add(drawer);

    addBox(drawer, [1.15, 0.38, 0.1], [0, 0, 0], deskWood);

    // Drawer front border
    addBox(drawer, [1.05, 0.025, 0.025], [0, 0.14, -0.065], deskGold);

    addBox(drawer, [1.05, 0.025, 0.025], [0, -0.14, -0.065], deskGold);

    // Drawer knob
    const drawerKnob = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 12),
      deskGold,
    );

    drawerKnob.position.set(0, 0, -0.11);
    drawer.add(drawerKnob);

    // --------------------------------------------------
    // LOWER BOOK STORAGE
    // --------------------------------------------------

    const lowerShelf = new THREE.Group();
    table.add(lowerShelf);

    addBox(lowerShelf, [3.85, 0.08, 1.05], [0, -0.95, 0], deskDark);

    // Vertical dividers
    for (const x of [-1.25, 0, 1.25]) {
      addBox(lowerShelf, [0.08, 0.85, 0.95], [x, -0.52, 0], deskDark);
    }

    // --------------------------------------------------
    // BOOKS INSIDE STORAGE
    // --------------------------------------------------

    const bookColors = [0x32120f, 0x4b2415, 0x5a351c, 0x24201b, 0x6b4524];

    for (let section = 0; section < 3; section++) {
      for (let i = 0; i < 4; i++) {
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.55 + (i % 2) * 0.08, 0.62),
          mat(bookColors[(section + i) % bookColors.length], 0.82, 0.02),
        );

        book.position.set(-1.72 + section * 1.25 + i * 0.21, -0.67, -0.02);

        book.rotation.z = i % 2 ? 0.035 : -0.025;

        lowerShelf.add(book);
      }
    }

    // --------------------------------------------------
    // ROYAL READING CHAIR
    // --------------------------------------------------

    const chair = new THREE.Group();

    // Position in front-left of desk
    chair.position.set(-3.55, 0, 0.15);
    chair.rotation.y = Math.PI;

    const chairWood = mat(0x4a2412, 0.48, 0.15);
    const chairLeather = mat(0x401515, 0.62, 0.02);
    const chairGold = mat(0xb08a45, 0.25, 0.8);

    // --------------------------------------------------
    // SEAT
    // --------------------------------------------------

    addBox(chair, [1.05, 0.2, 0.95], [0, 0.82, 0], chairLeather);

    // Seat frame
    addBox(chair, [1.18, 0.12, 1.05], [0, 0.7, 0], chairWood);

    // --------------------------------------------------
    // BACKREST
    // --------------------------------------------------

    addBox(chair, [1.05, 1.55, 0.18], [0, 1.55, 0.35], chairWood);

    addBox(chair, [0.82, 1.25, 0.12], [0, 1.55, 0.22], chairLeather);

    // --------------------------------------------------
    // TUFTED BUTTONS
    // --------------------------------------------------

    for (const y of [1.25, 1.55, 1.85]) {
      for (const x of [-0.25, 0.25]) {
        const button = new THREE.Mesh(
          new THREE.SphereGeometry(0.035, 12, 8),
          chairGold,
        );

        button.position.set(x, y, 0.16);
        chair.add(button);
      }
    }

    // --------------------------------------------------
    // ARMRESTS
    // --------------------------------------------------

    for (const x of [-0.62, 0.62]) {
      addBox(chair, [0.14, 0.72, 0.18], [x, 1.05, 0.05], chairWood);

      addBox(chair, [0.18, 0.1, 0.7], [x, 1.35, 0.05], chairWood);
    }

    // --------------------------------------------------
    // FRONT LEGS
    // --------------------------------------------------

    for (const x of [-0.48, 0.48]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.1, 0.78, 12),
        chairWood,
      );

      leg.position.set(x, 0.35, -0.32);
      chair.add(leg);
    }

    // --------------------------------------------------
    // BACK LEGS
    // --------------------------------------------------

    for (const x of [-0.48, 0.48]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.1, 0.78, 12),
        chairWood,
      );

      leg.position.set(x, 0.35, 0.32);
      chair.add(leg);
    }

    // Decorative gold accents
    for (const x of [-0.62, 0.62]) {
      const ornament = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 12),
        chairGold,
      );

      ornament.position.set(x, 1.42, 0.12);
      chair.add(ornament);
    }

    scene.add(chair);
    // --------------------------------------------------
    // TABLETOP DECOR
    // --------------------------------------------------

    const tabletop = new THREE.Group();
    tabletop.position.y = 0.03;
    table.add(tabletop);
    // --------------------------------------------------
    // OPEN BOOK
    // --------------------------------------------------

    const bookGroup = new THREE.Group();

    bookGroup.position.set(1.15, 0.02, 0.05);
    bookGroup.rotation.y = -0.12;
    table.add(bookGroup);

    const bookCoverImage = roomContent?.book?.cover || "/room/book-cover.png";

    const bookCoverTexture = new THREE.TextureLoader().load(bookCoverImage);

    bookCoverTexture.colorSpace = THREE.SRGBColorSpace;

    const bookCoverMaterial = new THREE.MeshStandardMaterial({
      map: bookCoverTexture,
      roughness: 0.75,
    });

    // Page material
    const pageMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8dfc8,
      roughness: 0.95,
    });

    // Left page
    const leftPages = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.045, 0.88),
      pageMaterial,
    );

    leftPages.position.set(-0.31, 0.055, 0);
    leftPages.rotation.z = -0.025;

    bookGroup.add(leftPages);

    // Right page
    const rightPages = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.045, 0.88),
      pageMaterial,
    );

    rightPages.position.set(0.31, 0.055, 0);
    rightPages.rotation.z = 0.025;

    bookGroup.add(rightPages);

    // Center crease
    const crease = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.01, 0.82),
      new THREE.MeshStandardMaterial({
        color: 0x9b907c,
        roughness: 1,
      }),
    );

    crease.position.y = 0.082;

    bookGroup.add(crease);
    // -----------------------------------------
    // SMALL NOTEBOOK
    // -----------------------------------------

    const notebook = new THREE.Group();

    notebook.position.set(-0.95, 0.045, 0.32);
    notebook.rotation.y = 0.08;
    notebook.rotation.z = -0.02;
    tabletop.add(notebook);

    addBox(notebook, [0.9, 0.055, 0.55], [0, 0, 0], mat(0x30231d, 0.72, 0.05));

    addBox(
      notebook,
      [0.82, 0.018, 0.48],
      [0, 0.038, 0],
      mat(0x594638, 0.82, 0.02),
    );

    // -----------------------------------------
    // PEN ON NOTEBOOK
    // -----------------------------------------

    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.62, 16),
      mat(0x151515, 0.35, 0.7),
    );

    pen.rotation.z = Math.PI / 2;
    pen.rotation.y = 0.05;
    pen.position.set(-0.95, 0.1, 0.32);

    tabletop.add(pen);

    // Pen tip
    const penTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.025, 0.09, 12),
      mat(0xc69a50, 0.25, 0.8),
    );

    penTip.rotation.z = -Math.PI / 2;
    penTip.position.set(-0.95 + 0.35, 0.1, 0.32);

    tabletop.add(penTip);

    // -----------------------------------------
    // PHONE
    // -----------------------------------------

    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.035, 0.82),
      mat(0x08090b, 0.28, 0.45),
    );

    phone.position.set(-0.15, 0.055, -0.52);
    phone.rotation.y = -0.18;
    phone.rotation.z = 0.015;

    tabletop.add(phone);

    // Phone screen
    const phoneScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.39, 0.008, 0.7),
      new THREE.MeshStandardMaterial({
        color: 0x111b22,
        roughness: 0.18,
        metalness: 0.3,
      }),
    );

    phoneScreen.position.set(-0.15, 0.078, -0.52);
    phoneScreen.rotation.y = -0.18;

    tabletop.add(phoneScreen);

    // -----------------------------------------
    // COFFEE MUG
    // -----------------------------------------

    const mug = new THREE.Group();

    mug.position.set(0.0, 0.05, 0.48);
    tabletop.add(mug);

    const mugMaterial = mat(0x40372e, 0.55, 0.05);

    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.13, 0.28, 24),
      mugMaterial,
    );

    cup.position.y = 0.14;
    mug.add(cup);

    // Coffee surface
    const coffee = new THREE.Mesh(
      new THREE.CircleGeometry(0.125, 24),
      mat(0x21140c, 0.85, 0),
    );

    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.285;
    mug.add(coffee);
    // Mug handle
    const mugHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.025, 12, 24, Math.PI),
      mugMaterial,
    );

    mugHandle.rotation.y = Math.PI / 2;
    mugHandle.position.set(0.16, 0.16, 0);
    mug.add(mugHandle);

    // -----------------------------------------
    // SMALL COFFEE CARAFE
    // -----------------------------------------

    const carafe = new THREE.Group();

    carafe.position.set(1.85, 0.04, 0.38);
    tabletop.add(carafe);

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x3c3028,
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.78,
    });

    // Coffee container
    const carafeBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.14, 0.42, 24),
      glassMaterial,
    );

    carafeBody.position.y = 0.22;
    carafe.add(carafeBody);

    // Coffee inside
    const coffeeBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.115, 0.25, 24),
      mat(0x24140b, 0.9, 0),
    );

    coffeeBody.position.y = 0.16;
    carafe.add(coffeeBody);

    // Neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.13, 0.22, 20),
      glassMaterial,
    );

    neck.position.y = 0.53;
    carafe.add(neck);

    // Top
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.09, 0.035, 20),
      glassMaterial,
    );

    top.position.y = 0.65;
    carafe.add(top);

    // Suitcase base.
    const suitcase = new THREE.Group();
    suitcase.position.y = 0.08;

    // Smaller, more proportionate turntable
    suitcase.scale.setScalar(0.68);

    player.add(suitcase);

    addBox(suitcase, [2.45, 0.58, 1.58], [0, 0.31, 0], shell);
    addBox(suitcase, [2.51, 0.075, 1.64], [0, 0.62, 0], shellSoft);

    // Gold perimeter rails.
    addBox(suitcase, [2.36, 0.025, 0.035], [0, 0.67, -0.79], gold);
    addBox(suitcase, [2.36, 0.025, 0.035], [0, 0.67, 0.79], gold);
    addBox(suitcase, [0.035, 0.025, 1.55], [-1.2, 0.67, 0], gold);
    addBox(suitcase, [0.035, 0.025, 1.55], [1.2, 0.67, 0], gold);

    // Metallic corner caps.
    for (const x of [-1.09, 1.09]) {
      for (const z of [-0.69, 0.69]) {
        addBox(suitcase, [0.15, 0.13, 0.06], [x, 0.16, z], gold);
      }
    }

    // Front speaker grilles.
    for (const x of [-0.78, 0.78]) {
      addBox(suitcase, [0.48, 0.3, 0.035], [x, 0.3, -0.815], rubber);
      addBox(
        suitcase,
        [0.4, 0.23, 0.014],
        [x, 0.3, -0.837],
        mat(0x17181a, 0.95),
      );
      for (let i = 0; i < 8; i++) {
        addBox(
          suitcase,
          [0.31, 0.008, 0.008],
          [x, 0.205 + i * 0.027, -0.847],
          mat(0x303033, 0.92),
        );
      }
    }

    // Two front latches.
    for (const x of [-0.38, 0.38]) {
      addBox(suitcase, [0.2, 0.2, 0.055], [x, 0.49, -0.825], gold);
      addBox(suitcase, [0.08, 0.09, 0.065], [x, 0.49, -0.858], shellSoft);
    }

    // Carry handle.
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.055, 16, 48, Math.PI),
      mat(0x111214, 0.65, 0.12),
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0.1, -0.88);
    suitcase.add(handle);

    // Open lid. The lid faces the camera (+Z).
    const lid = new THREE.Group();
    lid.position.set(0, 0.65, 0.68);
    suitcase.add(lid);

    addBox(lid, [2.42, 1.42, 0.11], [0, 0.7, 0], shell);
    addBox(lid, [2.15, 1.15, 0.035], [0, 0.7, -0.07], innerRed);
    addBox(lid, [1.95, 0.95, 0.018], [0, 0.7, -0.095], mat(0x260305, 0.9));

    // Red/gold inner border.
    addBox(lid, [1.96, 0.025, 0.012], [0, 1.17, -0.11], gold);
    addBox(lid, [1.96, 0.025, 0.012], [0, 0.23, -0.11], gold);
    addBox(lid, [0.025, 0.94, 0.012], [-0.98, 0.7, -0.11], gold);
    addBox(lid, [0.025, 0.94, 0.012], [0.98, 0.7, -0.11], gold);

    const logoTex = textTexture("Kehkash", "#d9ad5e", 92);
    const logo = new THREE.Mesh(
      new THREE.PlaneGeometry(1.12, 0.28),
      new THREE.MeshBasicMaterial({
        map: logoTex,
        transparent: true,
        depthWrite: false,
      }),
    );
    logo.position.set(0, 0.74, -0.12);
    lid.add(logo);

    const subTex = textTexture("SOUND  &  SOUL", "#bd8d42", 34);
    const sub = new THREE.Mesh(
      new THREE.PlaneGeometry(0.82, 0.13),
      new THREE.MeshBasicMaterial({
        map: subTex,
        transparent: true,
        depthWrite: false,
      }),
    );
    sub.position.set(0, 0.54, -0.121);
    lid.add(sub);

    // Lid hinges.
    for (const x of [-0.76, 0.76]) {
      addBox(suitcase, [0.22, 0.1, 0.14], [x, 0.68, 0.69], gold);
    }

    // Platter.
    const platter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.69, 0.69, 0.05, 96),
      mat(0x252629, 0.38, 0.35),
    );
    platter.position.set(-0.27, 0.7, -0.1);
    suitcase.add(platter);

    // Record group — only this group rotates.
    const record = new THREE.Group();
    record.position.set(-0.27, 0.745, -0.1);
    suitcase.add(record);

    // The actual vinyl platter gets its own rotating group.
    // This makes the BLACK DISC itself visibly rotate.
    const spinningVinyl = new THREE.Group();
    record.add(spinningVinyl);
    recordRef.current = spinningVinyl;

    spinningVinyl.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.61, 0.61, 0.035, 128),
        mat(0x020203, 0.22, 0.45),
      ),
    );

    // Vinyl grooves.
    // Perfect concentric circles are physically plausible, but they look static
    // from most camera angles because rotating a circle produces the same image.
    // Use very subtle spiral grooves instead: they remain flat on the record,
    // but their shape gives the eye a clear rotational cue from any viewpoint.
    const grooveMaterial = new THREE.LineBasicMaterial({
      color: 0x4a474d,
      transparent: true,
      opacity: 0.34,
    });

    for (let spiral = 0; spiral < 3; spiral += 1) {
      const points = [];
      const startR = 0.16 + spiral * 0.13;
      const endR = 0.55;
      const turns = 5.8;
      const samples = 900;

      for (let i = 0; i <= samples; i += 1) {
        const t = i / samples;
        const angle = t * turns * Math.PI * 2;
        const radius = startR + (endR - startR) * t;

        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            0.021,
            Math.sin(angle) * radius,
          ),
        );
      }

      const groove = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        grooveMaterial,
      );

      spinningVinyl.add(groove);
    }

    // A few extremely subtle circular groove bands preserve the familiar
    // appearance of a real record without overpowering the spiral motion cue.
    for (let r = 0.22; r <= 0.52; r += 0.075) {
      const groove = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.001, 4, 128),
        mat(0x29282c, 0.22, 0.3),
      );
      groove.rotation.x = Math.PI / 2;
      groove.position.y = 0.0207;
      spinningVinyl.add(groove);
    }

    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.125, 0.04, 64),
      red,
    );
    label.position.y = 0.023;
    spinningVinyl.add(label);

    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.11, 24),
      silver,
    );
    spindle.position.set(-0.27, 0.8, -0.1);
    suitcase.add(spindle);

    // Physical control deck.
    addBox(
      suitcase,
      [0.62, 0.04, 0.82],
      [0.67, 0.69, -0.02],
      mat(0x08090a, 0.36, 0.4),
    );

    // Three large knobs.
    const knobs = [
      [0.49, -0.29, 0.08],
      [0.74, -0.29, 0.08],
      [0.62, 0.04, 0.06],
    ];

    knobs.forEach(([x, z, r]) => {
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r * 0.88, 0.085, 32),
        gold,
      );
      knob.position.set(x, 0.755, z);
      suitcase.add(knob);

      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.012, r * 0.65),
        mat(0x21160b, 0.55, 0.1),
      );
      marker.position.set(x, 0.802, z - r * 0.2);
      suitcase.add(marker);
    });

    // Actual-looking transport buttons.
    const buttonXs = [0.48, 0.68, 0.88];
    const buttonSymbols = ["|<", ">", ">|"];

    buttonXs.forEach((x, i) => {
      const button = new THREE.Mesh(
        new THREE.BoxGeometry(0.105, 0.045, 0.13),
        mat(0x252629, 0.32, 0.55),
      );
      button.position.set(x, 0.755, 0.27);
      suitcase.add(button);

      // tiny red/white indicator bar
      addBox(
        suitcase,
        [0.05, 0.008, 0.008],
        [x, 0.781, 0.27],
        i === 1 ? mat(0xd7d7d2, 0.35, 0.6) : mat(0x7a1b1f, 0.4, 0.35),
      );
    });

    const power = new THREE.Mesh(
      new THREE.TorusGeometry(0.034, 0.008, 10, 24),
      mat(0x401013, 0.35, 0.5),
    );
    power.rotation.x = Math.PI / 2;
    power.position.set(0.94, 0.76, 0.28);
    suitcase.add(power);
    powerRef.current = power;

    // Tonearm.
    const tonearm = new THREE.Group();
    tonearm.position.set(0.78, 0.79, 0.31);
    suitcase.add(tonearm);

    const pivot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.1, 32),
      gold,
    );
    pivot.position.y = 0.03;
    tonearm.add(pivot);

    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.68, 24),
      silver,
    );
    arm.position.set(-0.25, 0.1, -0.17);
    arm.rotation.z = -0.72;
    tonearm.add(arm);

    const cartridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.065, 0.1),
      shell,
    );
    cartridge.position.set(-0.48, -0.14, -0.35);
    cartridge.rotation.z = -0.72;
    tonearm.add(cartridge);

    // Large invisible interaction volume, easier to target than individual meshes.
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.85, 1.25, 1.3),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
      }),
    );

    hitbox.position.set(0, 0.6, 0.05);
    player.add(hitbox);
    player.userData.interactionTarget = hitbox;

    hitbox.userData.interactive = true;
    hitbox.userData.type = "musicPlayer";

    scene.add(player);
    interactionRef.current.add(player);

    let raf;
    let last = performance.now();

    const animate = (now) => {
      raf = requestAnimationFrame(animate);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (recordRef.current && playingRef.current) {
        // Standard vinyl direction: clockwise when viewed from above.
        // Standard record-player direction: clockwise when viewed from above.
        // 33⅓ RPM = 0.555 revolutions per second.
        // recordRef is the physical BLACK VINYL group, not just the grooves.
        recordRef.current.rotation.y -= Math.PI * 2 * 0.555 * delta;
      }

      if (powerRef.current) {
        powerRef.current.material.color.set(
          playingRef.current ? 0xff3038 : 0x3b0e12,
        );
      }
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      interactionRef.current?.remove(player);
      scene.remove(player);
      logoTex.dispose();
      subTex.dispose();

      player.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      });

      recordRef.current = null;
      powerRef.current = null;
    };
  }, [scene, interactionRef]);

  // ESC only minimizes the library. Audio and the turntable continue playing.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // --------------------------------------------------
  // AUDIO
  // --------------------------------------------------
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onMeta = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => {
      playingRef.current = true;
      setIsPlaying(true);
      setHasStartedPlayback(true);
      setMiniDismissed(false);
    };
    const onPause = () => {
      playingRef.current = false;
      setIsPlaying(false);
    };
    const onEnded = () => {
      playingRef.current = false;
      setIsPlaying(false);
      if (music.length > 1) {
        setCurrentIndex((i) => (i + 1) % music.length);
      }
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.src = "";
      playingRef.current = false;
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, [music.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const wasPlaying = playingRef.current;
    audio.pause();
    playingRef.current = false;
    setIsPlaying(false);

    audio.src = currentSong.src;
    audio.load();
    setCurrentTime(0);
    setDuration(0);

    if (wasPlaying) {
      audio.play().catch(() => {});
    }
  }, [currentSong]);

  const playSong = async (index) => {
    const audio = audioRef.current;
    const song = music[index];
    if (!audio || !song) return;

    if (index !== currentIndex) {
      audio.pause();
      audio.src = song.src;
      audio.currentTime = 0;
      setCurrentIndex(index);
      setCurrentTime(0);
      setDuration(0);
    }

    try {
      await audio.play();
    } catch {
      playingRef.current = false;
      setIsPlaying(false);
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {}
    } else {
      audio.pause();
    }
  };

  const changeSong = (direction) => {
    if (!music.length) return;
    const index = direction < 0 ? previousIndex : nextIndex;
    playSong(index);
  };

  const seek = (event) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = THREE.MathUtils.clamp(
      (event.clientX - rect.left) / rect.width,
      0,
      1,
    );
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  // Closing the mini-player is an explicit STOP action.
  // ESC and the main library close button only minimize the library.
  const closeMiniPlayer = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    playingRef.current = false;
    setIsPlaying(false);
    setHasStartedPlayback(false);
    setMiniDismissed(true);
    setCurrentTime(0);
  };

  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      {/* Persistent background player: appears only after playback begins.
          ESC only closes the main library; it does not hide this player. */}
      {currentSong && hasStartedPlayback && !miniDismissed && (
        <div style={miniPlayerStyle}>
          <div
            style={{
              ...miniDiscStyle,
              animation: isPlaying
                ? "kehkashDiscSpin 1.8s linear infinite"
                : "none",
            }}
          />

          <div style={miniInfoStyle}>
            <div style={miniTitleStyle}>{currentSong.title}</div>
            <div style={miniArtistStyle}>{currentSong.artist || "Artist"}</div>
            <div onClick={seek} style={miniProgressTrack}>
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #d4af37, #8d4bb0)",
                }}
              />
            </div>
          </div>

          <button onClick={() => changeSong(-1)} style={miniButton}>
            ‹‹
          </button>
          <button onClick={togglePlayback} style={miniPlayButton}>
            {isPlaying ? "Ⅱ" : "▶"}
          </button>
          <button onClick={() => changeSong(1)} style={miniButton}>
            ››
          </button>

          <button onClick={() => setIsOpen(true)} style={miniLibraryButton}>
            LIBRARY
          </button>

          <button
            onClick={closeMiniPlayer}
            style={miniCloseButton}
            aria-label="Stop music and close player"
            title="Stop music"
          >
            ×
          </button>
        </div>
      )}

      {/* Liquid-glass music library */}
      {isOpen && (
        <div
          style={overlayStyle}
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
            <div style={glassHighlightStyle} />

            <div style={headerStyle}>
              <div>
                <div style={eyebrowStyle}>KEHKASH · MUSIC ROOM</div>
                <div style={headingStyle}>Vinyl Player</div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={closeStyle}
                aria-label="Minimize music player"
                title="Minimize"
              >
                ×
              </button>
            </div>

            <div style={playerBodyStyle}>
              {/* Album-art / record visual */}
              <div style={artColumnStyle}>
                <div
                  style={{
                    ...albumArtStyle,
                    animation: isPlaying
                      ? "kehkashArtGlow 2.8s ease-in-out infinite"
                      : "none",
                  }}
                >
                  <div style={artRingOuter} />
                  <div style={artRingMiddle} />
                  <div style={artRingInner}>
                    <span style={artLetter}>K</span>
                  </div>
                </div>

                <div style={artCaption}>SOUND · SOUL · SPACE</div>
              </div>

              {/* Player controls */}
              <div style={mainColumnStyle}>
                {currentSong && (
                  <>
                    <div style={trackMetaStyle}>
                      <div>
                        <div style={nowPlayingTitle}>{currentSong.title}</div>
                        <div style={artistStyle}>
                          {currentSong.artist || "Artist"}
                        </div>
                      </div>

                      <div style={timeStyle}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>

                    <div style={progressTrack} onClick={seek}>
                      <div
                        style={{
                          width: `${progress}%`,
                          height: "100%",
                          borderRadius: "10px",
                          background:
                            "linear-gradient(90deg, #d4af37, #7d259d)",
                          boxShadow: "0 0 14px rgba(125,37,157,0.32)",
                        }}
                      />
                    </div>

                    <div style={controlRow}>
                      <button
                        onClick={() => changeSong(-1)}
                        style={sideControl}
                        title="Previous"
                      >
                        ‹‹
                        <span>PREV</span>
                      </button>

                      <button
                        onClick={togglePlayback}
                        style={playButton}
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? "Ⅱ" : "▶"}
                      </button>

                      <button
                        onClick={() => changeSong(1)}
                        style={sideControl}
                        title="Next"
                      >
                        ››
                        <span>NEXT</span>
                      </button>
                    </div>
                  </>
                )}

                <div style={recordsLabel}>YOUR RECORDS</div>

                <div style={recordsArea}>
                  {music.map((song, index) => {
                    const active = index === currentIndex;
                    return (
                      <button
                        key={song.id || `${song.src}-${index}`}
                        onClick={() => playSong(index)}
                        style={{
                          ...recordItem,
                          borderColor: active
                            ? "rgba(212,175,55,0.46)"
                            : "rgba(255,255,255,0.10)",
                          background: active
                            ? "linear-gradient(90deg, rgba(125,37,157,0.15), rgba(212,175,55,0.045))"
                            : "rgba(255,255,255,0.025)",
                        }}
                      >
                        <div style={recordLeft}>
                          <div
                            style={{
                              ...recordDisc,
                              animation:
                                active && isPlaying
                                  ? "kehkashDiscSpin 1.8s linear infinite"
                                  : "none",
                            }}
                          />
                          <div>
                            <div style={recordTitle}>{song.title}</div>
                            <div style={recordArtist}>
                              {song.artist || "Artist"}
                            </div>
                          </div>
                        </div>

                        <div style={recordAction}>
                          {active && isPlaying ? "PLAYING" : "PLAY"}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={hintStyle}>
                  ESC minimizes the player. Playback continues in the room.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes kehkashDiscSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes kehkashArtGlow {
          0%, 100% { box-shadow: 0 0 35px rgba(125,37,157,.14), inset 0 0 35px rgba(212,175,55,.06); }
          50% { box-shadow: 0 0 55px rgba(125,37,157,.30), inset 0 0 45px rgba(212,175,55,.10); }
        }

        .kehkash-glass-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .kehkash-glass-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .kehkash-glass-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(#7d259d, #d4af37);
          border-radius: 20px;
        }
      `}</style>
    </>
  );
}

const miniPlayerStyle = {
  position: "fixed",
  left: "24px",
  bottom: "24px",
  zIndex: 85,
  width: "min(650px, calc(100vw - 48px))",
  minHeight: "72px",
  padding: "11px 13px",
  display: "flex",
  alignItems: "center",
  gap: "11px",
  border: "1px solid rgba(212,175,55,0.25)",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, rgba(20,16,23,0.76), rgba(10,10,13,0.68))",
  backdropFilter: "blur(24px) saturate(145%)",
  WebkitBackdropFilter: "blur(24px) saturate(145%)",
  boxShadow:
    "0 20px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10), 0 0 40px rgba(125,37,157,0.08)",
  color: "#fff",
};

const miniDiscStyle = {
  width: "43px",
  height: "43px",
  flexShrink: 0,
  borderRadius: "50%",
  border: "1px solid rgba(212,175,55,0.35)",
  background:
    "radial-gradient(circle, #d4af37 0 7%, #7d259d 8% 13%, #050505 14% 68%, #45404a 69% 71%, #050505 72%)",
  boxShadow: "0 0 18px rgba(125,37,157,0.18)",
};

const miniInfoStyle = {
  flex: 1,
  minWidth: 0,
};

const miniTitleStyle = {
  fontSize: "13px",
  letterSpacing: "0.01em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const miniArtistStyle = {
  marginTop: "3px",
  fontSize: "10px",
  color: "rgba(255,255,255,0.48)",
};

const miniProgressTrack = {
  height: "3px",
  marginTop: "8px",
  borderRadius: "10px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.10)",
  cursor: "pointer",
};

const miniButton = {
  border: 0,
  background: "transparent",
  color: "#d9c98f",
  opacity: 0.78,
  fontSize: "17px",
  cursor: "pointer",
};

const miniPlayButton = {
  width: "36px",
  height: "36px",
  flexShrink: 0,
  borderRadius: "50%",
  border: "1px solid rgba(212,175,55,0.72)",
  background: "linear-gradient(145deg, #7d259d, #51205f)",
  color: "#f5e8c2",
  cursor: "pointer",
  boxShadow: "0 0 22px rgba(125,37,157,0.22)",
};

const miniLibraryButton = {
  border: "1px solid rgba(212,175,55,0.26)",
  borderRadius: "9px",
  padding: "8px 10px",
  background: "rgba(125,37,157,0.10)",
  color: "#d4af37",
  fontSize: "9px",
  letterSpacing: "0.12em",
  cursor: "pointer",
};

const miniCloseButton = {
  width: "28px",
  height: "28px",
  flexShrink: 0,
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.025)",
  color: "rgba(255,255,255,0.52)",
  fontSize: "17px",
  cursor: "pointer",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 90,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "26px",
  background:
    "radial-gradient(circle at 50% 38%, rgba(125,37,157,0.14), rgba(4,4,7,0.50) 44%, rgba(0,0,0,0.72) 100%)",
  backdropFilter: "blur(17px) saturate(120%)",
  WebkitBackdropFilter: "blur(17px) saturate(120%)",
};

const panelStyle = {
  position: "relative",
  width: "min(900px, calc(100vw - 34px))",
  maxHeight: "min(680px, calc(100vh - 44px))",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.16)",
  borderTopColor: "rgba(255,255,255,0.30)",
  borderRadius: "28px",
  background:
    "linear-gradient(135deg, rgba(26,21,31,0.60), rgba(10,10,14,0.52))",
  backdropFilter: "blur(34px) saturate(150%)",
  WebkitBackdropFilter: "blur(34px) saturate(150%)",
  color: "#fff",
  boxShadow:
    "0 40px 140px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(212,175,55,0.10), 0 0 80px rgba(125,37,157,0.10)",
};

const glassHighlightStyle = {
  position: "absolute",
  top: "-160px",
  left: "10%",
  width: "80%",
  height: "230px",
  borderRadius: "50%",
  background:
    "radial-gradient(ellipse, rgba(255,255,255,0.075), transparent 68%)",
  pointerEvents: "none",
};

const headerStyle = {
  position: "relative",
  padding: "28px 32px 23px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  borderBottom: "1px solid rgba(255,255,255,0.09)",
  background:
    "linear-gradient(90deg, rgba(125,37,157,0.10), transparent 45%, rgba(212,175,55,0.035))",
};

const eyebrowStyle = {
  fontSize: "10px",
  letterSpacing: "0.30em",
  color: "#d4af37",
  opacity: 0.82,
};

const headingStyle = {
  marginTop: "7px",
  fontSize: "32px",
  fontWeight: 400,
  letterSpacing: "-0.025em",
};

const closeStyle = {
  width: "42px",
  height: "42px",
  border: "1px solid rgba(212,175,55,0.28)",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.035)",
  color: "#d4af37",
  fontSize: "23px",
  cursor: "pointer",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
};

const playerBodyStyle = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "240px minmax(0, 1fr)",
  gap: "28px",
  padding: "28px",
};

const artColumnStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  paddingTop: "6px",
};

const albumArtStyle = {
  position: "relative",
  width: "205px",
  height: "205px",
  borderRadius: "22px",
  overflow: "hidden",
  border: "1px solid rgba(212,175,55,0.34)",
  background:
    "radial-gradient(circle at 50% 48%, rgba(212,175,55,0.14), transparent 27%), linear-gradient(145deg, #321b3b, #0c0b10 68%)",
  boxShadow:
    "0 22px 50px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.12)",
};

const artRingOuter = {
  position: "absolute",
  width: "154px",
  height: "154px",
  left: "25px",
  top: "25px",
  borderRadius: "50%",
  border: "1px solid rgba(212,175,55,0.26)",
  background:
    "repeating-radial-gradient(circle, transparent 0 9px, rgba(255,255,255,0.035) 10px 11px)",
};

const artRingMiddle = {
  position: "absolute",
  width: "106px",
  height: "106px",
  left: "49px",
  top: "49px",
  borderRadius: "50%",
  border: "1px solid rgba(125,37,157,0.45)",
  boxShadow: "0 0 35px rgba(125,37,157,0.20)",
};

const artRingInner = {
  position: "absolute",
  width: "66px",
  height: "66px",
  left: "69px",
  top: "69px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(212,175,55,0.68)",
  background:
    "radial-gradient(circle at 35% 30%, #a16abb, #5b1f70 52%, #27142d)",
  boxShadow: "0 0 26px rgba(125,37,157,0.30)",
};

const artLetter = {
  color: "#f0ddb0",
  fontFamily: "Georgia, serif",
  fontSize: "26px",
};

const artCaption = {
  marginTop: "13px",
  fontSize: "8px",
  letterSpacing: "0.22em",
  color: "rgba(212,175,55,0.64)",
};

const mainColumnStyle = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
};

const trackMetaStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "20px",
  marginBottom: "16px",
};

const nowPlayingTitle = {
  fontSize: "27px",
  fontWeight: 400,
  letterSpacing: "-0.02em",
};

const artistStyle = {
  marginTop: "6px",
  fontSize: "12px",
  color: "rgba(255,255,255,0.46)",
};

const timeStyle = {
  fontSize: "10px",
  color: "rgba(255,255,255,0.40)",
  whiteSpace: "nowrap",
};

const progressTrack = {
  height: "5px",
  borderRadius: "10px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.11)",
  cursor: "pointer",
};

const controlRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "55px",
  marginTop: "22px",
  marginBottom: "22px",
};

const sideControl = {
  minWidth: "75px",
  border: 0,
  background: "transparent",
  color: "#d9c98f",
  opacity: 0.84,
  fontSize: "17px",
  cursor: "pointer",
};

const playButton = {
  width: "67px",
  height: "67px",
  borderRadius: "50%",
  border: "1px solid rgba(212,175,55,0.76)",
  background:
    "linear-gradient(145deg, rgba(137,47,166,0.96), rgba(75,25,91,0.96))",
  color: "#f5e8c2",
  fontSize: "21px",
  cursor: "pointer",
  boxShadow:
    "0 0 34px rgba(125,37,157,0.24), inset 0 1px 0 rgba(255,255,255,0.18)",
};

const recordsLabel = {
  padding: "5px 0 9px",
  fontSize: "9px",
  letterSpacing: "0.24em",
  color: "#d4af37",
  opacity: 0.72,
};

const recordsArea = {
  padding: "0 2px 5px",
  maxHeight: "195px",
  overflowY: "auto",
};

const recordItem = {
  width: "100%",
  padding: "12px 13px",
  marginBottom: "8px",
  border: "1px solid",
  borderRadius: "13px",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  textAlign: "left",
  transition: "all 160ms ease",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const recordLeft = {
  display: "flex",
  alignItems: "center",
  gap: "13px",
};

const recordDisc = {
  width: "36px",
  height: "36px",
  flexShrink: 0,
  borderRadius: "50%",
  border: "1px solid rgba(212,175,55,0.25)",
  background:
    "radial-gradient(circle, #d4af37 0 9%, #7d259d 10% 17%, #030303 18% 68%, #38323c 69% 71%, #030303 72%)",
};

const recordTitle = {
  fontSize: "13px",
};

const recordArtist = {
  marginTop: "4px",
  fontSize: "10px",
  color: "rgba(255,255,255,0.40)",
};

const recordAction = {
  fontSize: "9px",
  letterSpacing: "0.15em",
  color: "#d4af37",
  opacity: 0.78,
};

const hintStyle = {
  padding: "10px 0 0",
  fontSize: "9px",
  color: "rgba(255,255,255,0.32)",
  letterSpacing: "0.02em",
};
