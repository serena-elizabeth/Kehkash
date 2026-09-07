import * as THREE from "three";

export default class InteractionManager {
  constructor(camera, renderer) {
    this.camera = camera;
    this.renderer = renderer;

    this.raycaster = new THREE.Raycaster();
    this.center = new THREE.Vector2(0, 0);

    this.interactables = new Set();

    this.currentObject = null;
    this.previousObject = null;

    this.onInteract = null;
    this.maxInteractionDistance = 3.0;
  }

  add(object) {
    if (!object) return;

    this.interactables.add(object);
  }

  remove(object) {
    if (!object) return;

    this.interactables.delete(object);

    if (this.currentObject === object) {
      this.currentObject = null;
    }
  }

  update() {
    if (this.interactables.size === 0) {
      this.previousObject = this.currentObject;
      this.currentObject = null;

      return null;
    }

    const objects = Array.from(this.interactables);

    this.raycaster.setFromCamera(this.center, this.camera);

    const intersections = this.raycaster.intersectObjects(objects, true);

    if (intersections.length === 0) {
      this.previousObject = this.currentObject;
      this.currentObject = null;

      return null;
    }

    const hit = intersections[0].object;

    let interactiveObject = hit;

    while (interactiveObject && !this.interactables.has(interactiveObject)) {
      interactiveObject = interactiveObject.parent;
    }

    if (!interactiveObject) {
      this.previousObject = this.currentObject;
      this.currentObject = null;

      return null;
    }

    // --------------------------------------------------
    // INTERACTION DISTANCE CHECK
    // --------------------------------------------------

    const objectPosition = new THREE.Vector3();
    const cameraPosition = new THREE.Vector3();

    interactiveObject.getWorldPosition(objectPosition);
    this.camera.getWorldPosition(cameraPosition);

    const distance = cameraPosition.distanceTo(objectPosition);

    if (distance > 4.5) {
      this.previousObject = this.currentObject;
      this.currentObject = null;

      return null;
    }

    this.previousObject = this.currentObject;

    this.currentObject = interactiveObject;

    return interactiveObject;
  }

  interact() {
    if (!this.currentObject || !this.onInteract) {
      return;
    }

    this.onInteract(this.currentObject);
  }

  destroy() {
    this.interactables.clear();
    this.currentObject = null;
    this.previousObject = null;
    this.onInteract = null;
  }
}
