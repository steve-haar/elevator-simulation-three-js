import * as THREE from "three";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { getStandardMaterial } from "./texture-loader";

export class Rendering {
  constructor(
    private readonly options: {
      numberOfCars: number;
      doorSize: number;
      doorMargin: number;
      floorDepth: number;
    }
  ) {}

  materials = this.getMaterials();
  font: Font;

  load() {
    return new Promise<void>((resolve) => {
      new FontLoader().load(
        "fonts/helvetiker_regular.typeface.json",
        (font) => {
          this.font = font;
          resolve();
        }
      );
    });
  }

  private getMaterials() {
    const passengers = ["green", "red"].map((color) =>
      getStandardMaterial(`${color}-fabric`, "jpg")
    );

    const wall = getStandardMaterial("concrete-wall", "jpg");
    wall.side = THREE.DoubleSide;
    wall.opacity = 0.5;
    wall.transparent = true;

    const door = getStandardMaterial("metal-plate", "jpg");
    door.side = THREE.DoubleSide;

    const cars = Array.from(Array(this.options.numberOfCars)).map(() => {
      const material = new THREE.MeshStandardMaterial();
      material.side = THREE.DoubleSide;
      material.opacity = 0.5;
      material.transparent = true;
      return material;
    });

    const floor = getStandardMaterial("floor-tiles", "jpg");
    floor.side = THREE.DoubleSide;

    [floor.map, floor.normalMap, floor.aoMap].forEach((texture) => {
      texture.repeat.set(
        ((this.options.doorSize + this.options.doorMargin * 2) *
          this.options.numberOfCars) /
          4,
        this.options.floorDepth / 4
      );
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    });

    const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000 });

    return { passengers, wall, door, cars, floor, textMaterial };
  }
}
