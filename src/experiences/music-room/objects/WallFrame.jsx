import { useEffect } from "react";
import * as THREE from "three";

export default function WallFrame({
  scene,
  image,
  title = "",
  description = "",
  onReady,
  position = [0, 2, -4.85],
  rotation = [0, 0, 0],
  width = 1.4,
  height = 1.8,
}) {
  useEffect(() => {
    if (!scene || !image) return;

    // -----------------------------------------
    // FRAME GROUP
    // -----------------------------------------

    const frameGroup = new THREE.Group();

    frameGroup.userData.interactive = true;
    frameGroup.userData.type = "wallFrame";
    frameGroup.userData.title = title;
    frameGroup.userData.description = description;

    frameGroup.position.set(position[0], position[1], position[2]);

    frameGroup.rotation.set(rotation[0], rotation[1], rotation[2]);

    // -----------------------------------------
    // FRAME DIMENSIONS
    // -----------------------------------------

    const frameThickness = 0.09;
    const frameDepth = 0.08;

    const innerWidth = width - frameThickness * 2;

    const innerHeight = height - frameThickness * 2;

    // -----------------------------------------
    // FRAME MATERIAL
    // -----------------------------------------

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x17120d,
      roughness: 0.45,
      metalness: 0.35,
    });

    // -----------------------------------------
    // TOP
    // -----------------------------------------

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(width, frameThickness, frameDepth),
      frameMaterial,
    );

    top.position.y = height / 2 - frameThickness / 2;

    frameGroup.add(top);

    // -----------------------------------------
    // BOTTOM
    // -----------------------------------------

    const bottom = new THREE.Mesh(
      new THREE.BoxGeometry(width, frameThickness, frameDepth),
      frameMaterial,
    );

    bottom.position.y = -height / 2 + frameThickness / 2;

    frameGroup.add(bottom);

    // -----------------------------------------
    // LEFT
    // -----------------------------------------

    const left = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, innerHeight, frameDepth),
      frameMaterial,
    );

    left.position.x = -width / 2 + frameThickness / 2;

    frameGroup.add(left);

    // -----------------------------------------
    // RIGHT
    // -----------------------------------------

    const right = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, innerHeight, frameDepth),
      frameMaterial,
    );

    right.position.x = width / 2 - frameThickness / 2;

    frameGroup.add(right);

    // -----------------------------------------
    // BACKING
    // -----------------------------------------

    const backingMaterial = new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 1,
    });

    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(innerWidth, innerHeight, 0.025),
      backingMaterial,
    );

    // The backing belongs on the wall-facing side of the frame. Putting it
    // on the room-facing side hides the image plane from the camera.
    backing.position.z = frameDepth / 2;

    frameGroup.add(backing);

    // -----------------------------------------
    // ADD FRAME TO SCENE
    // -----------------------------------------

    scene.add(frameGroup);

    if (onReady) {
      onReady(frameGroup);
    }

    // -----------------------------------------
    // LOAD IMAGE
    // -----------------------------------------

    const loader = new THREE.TextureLoader();

    let imageTexture = null;
    let imageMaterial = null;
    let imageMesh = null;

    loader.load(
      image,

      // ---------------------------------------
      // SUCCESS
      // ---------------------------------------

      (loadedTexture) => {
        imageTexture = loadedTexture;

        loadedTexture.colorSpace = THREE.SRGBColorSpace;

        loadedTexture.anisotropy = 4;
        loadedTexture.needsUpdate = true;

        // -------------------------------------
        // ORIGINAL IMAGE ASPECT RATIO
        // -------------------------------------

        const imageAspect =
          loadedTexture.image.width / loadedTexture.image.height;

        const frameAspect = innerWidth / innerHeight;

        let imageWidth;
        let imageHeight;

        if (imageAspect > frameAspect) {
          // ---------------------------------
          // WIDE IMAGE
          // ---------------------------------

          imageWidth = innerWidth;

          imageHeight = imageWidth / imageAspect;
        } else {
          // ---------------------------------
          // TALL / PORTRAIT IMAGE
          // ---------------------------------

          imageHeight = innerHeight;

          imageWidth = imageHeight * imageAspect;
        }

        // -------------------------------------
        // IMAGE MATERIAL
        // -------------------------------------

        const imageMaterial = new THREE.MeshBasicMaterial({
          map: loadedTexture,
          side: THREE.FrontSide,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
        });

        // -------------------------------------
        // IMAGE MESH
        // -------------------------------------

        imageMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(imageWidth, imageHeight),
          imageMaterial,
        );

        // The player views this frame from its local -Z side. Place the art
        // just behind the front rails on that side; the backing remains behind
        // it against the wall.
        imageMesh.position.z = -frameDepth / 2 + 0.003;
        imageMesh.rotation.y = Math.PI;
        imageMesh.renderOrder = 20;

        frameGroup.add(imageMesh);
      },

      // ---------------------------------------
      // PROGRESS
      // ---------------------------------------

      undefined,

      // ---------------------------------------
      // ERROR
      // ---------------------------------------

      (error) => {
        console.error("WallFrame image failed to load:", image, error);
      },
    );

    // -----------------------------------------
    // CLEANUP
    // -----------------------------------------

    return () => {
      if (onReady) {
        onReady(null);
      }

      scene.remove(frameGroup);

      frameGroup.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();

          if (object.material) {
            object.material.dispose();
          }
        }
      });

      if (imageTexture) {
        imageTexture.dispose();
      }
    };
  }, [
    scene,
    image,
    title,
    description,
    position,
    rotation,
    width,
    height,
    onReady,
  ]);

  return null;
}
