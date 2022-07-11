import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { Font } from "three/examples/jsm/loaders/FontLoader";
import { PassengerDetails } from "../passenger-system/passenger-system";
import { Rendering } from "./rendering";

export class Scene {
  constructor(
    private readonly rendering: Rendering,
    private readonly options: {
      doorSize: number;
      doorMargin: number;
      numberOfCars: number;
      floorDepth: number;
      wallHeight: number;
      numberOfFloors: number;
      elevatorDepth: number;
      doorDepth: number;
      passengerRadius: number;
      passengerHeight: number;
    }
  ) {}

  private passengerGeometry = this.getPassengerGeometry();
  private textGeometries = this.getTextGeometries(this.rendering.font);

  lights = this.getLights();
  floors = this.getFloors();
  walls = this.getWalls();
  doors = this.getDoors();
  cars = this.getCars();
  passengers = new Map<Symbol, THREE.Group>();

  getWallWidth() {
    return (
      (this.options.doorSize + 2 * this.options.doorMargin) *
      this.options.numberOfCars
    );
  }

  createPassenger(passenger: PassengerDetails) {
    const passengerMesh = new THREE.Mesh(
      this.passengerGeometry,
      this.rendering.materials.passengers[
        passenger.destinationFloor > passenger.startingFloor ? 0 : 1
      ]
    );

    const textMesh = new THREE.Mesh(
      this.textGeometries[passenger.destinationFloor],
      this.rendering.materials.textMaterial
    );

    textMesh.position.set(
      -this.options.passengerRadius / 2,
      this.options.passengerHeight / 2,
      0
    );

    const group = new THREE.Group();
    group.add(passengerMesh, textMesh);
    this.passengers.set(passenger.id, group);

    return group;
  }

  private getLights() {
    return [new THREE.AmbientLight()];
  }

  private getFloors() {
    const floorWidth =
      (this.options.doorSize + 2 * this.options.doorMargin) *
      this.options.numberOfCars;

    const geometry = new THREE.PlaneGeometry(
      floorWidth,
      this.options.floorDepth
    );

    return Array.from(Array(this.options.numberOfFloors)).map((_, i) => {
      const floor = new THREE.Mesh(geometry, this.rendering.materials.floor);

      floor.position.set(floorWidth / 2, 0, this.options.floorDepth / 2);
      floor.rotation.set(Math.PI * -0.5, 0, 0);
      floor.position.y = this.options.wallHeight * i;

      return floor;
    });
  }

  private getWalls() {
    const wallWidth = this.getWallWidth();
    const geometry = new THREE.PlaneGeometry(wallWidth, 1);

    return Array.from(Array(this.options.numberOfFloors)).map(
      (_, wallIndex) => {
        const wall = new THREE.Mesh(geometry, this.rendering.materials.wall);
        wall.position.set(
          wallWidth / 2,
          this.options.wallHeight * wallIndex + this.options.wallHeight / 2,
          0
        );
        wall.scale.setY(this.options.wallHeight);

        const textMesh = new THREE.Mesh(
          this.textGeometries[wallIndex],
          this.rendering.materials.textMaterial
        );

        textMesh.position.set(
          this.getWallWidth() / 2,
          wallIndex * this.options.wallHeight +
            this.options.doorSize +
            (this.options.wallHeight - this.options.doorSize) / 2,
          0.1
        );

        const group = new THREE.Group();
        group.add(wall, textMesh);

        return group;
      }
    );
  }

  private getDoors() {
    const offset = this.options.doorSize + this.options.doorMargin * 2;
    const geometry = new THREE.BoxGeometry(
      this.options.doorSize,
      this.options.doorSize,
      this.options.doorDepth
    );

    return Array.from(Array(this.options.numberOfFloors))
      .map((_, floor) =>
        Array.from(Array(this.options.numberOfCars)).map((_, i) => {
          const door = new THREE.Mesh(geometry, this.rendering.materials.door);
          door.renderOrder = 1;
          door.position.set(
            this.options.doorSize / 2 + this.options.doorMargin + offset * i,
            this.options.wallHeight * floor + this.options.doorSize / 2,
            0
          );
          return door;
        })
      )
      .flat();
  }

  private getCars() {
    const offset = this.options.doorSize + this.options.doorMargin * 2;

    return Array.from(Array(this.options.numberOfCars)).map((_, i) => {
      const geometry = new THREE.PlaneGeometry(this.options.doorSize, 1);
      const elevator = new THREE.Group();
      elevator.add(
        ...[
          {
            position: {
              x:
                this.options.doorSize / 2 +
                this.options.doorMargin +
                offset * i,
              y: this.options.doorSize / 2,
              z: -this.options.elevatorDepth,
            },
            rotation: {
              x: 0,
              y: 0,
              z: 0,
            },
          },
          {
            position: {
              x: this.options.doorMargin + offset * i,
              y: this.options.doorSize / 2,
              z: -this.options.elevatorDepth / 2,
            },
            rotation: {
              x: 0,
              y: Math.PI / 2,
              z: 0,
            },
          },
          {
            position: {
              x: this.options.doorSize + this.options.doorMargin + offset * i,
              y: this.options.doorSize / 2,
              z: -this.options.elevatorDepth / 2,
            },
            rotation: {
              x: 0,
              y: Math.PI / 2,
              z: 0,
            },
          },
          {
            position: {
              x:
                this.options.doorSize / 2 +
                this.options.doorMargin +
                offset * i,
              y: 0,
              z: -this.options.elevatorDepth / 2,
            },
            rotation: {
              x: Math.PI / 2,
              y: 0,
              z: 0,
            },
          },
        ].map((wallOptions) => {
          const wall = new THREE.Mesh(
            geometry,
            this.rendering.materials.cars[i]
          );
          wall.position.set(
            wallOptions.position.x,
            wallOptions.position.y,
            wallOptions.position.z
          );
          wall.rotation.set(
            wallOptions.rotation.x,
            wallOptions.rotation.y,
            wallOptions.rotation.z
          );
          wall.scale.setY(this.options.doorSize);

          return wall;
        })
      );

      return elevator;
    });
  }

  private getPassengerGeometry() {
    return new THREE.ConeGeometry(
      this.options.passengerRadius,
      this.options.passengerHeight
    );
  }

  private getTextGeometries(font: Font) {
    return Array.from(Array(this.options.numberOfFloors)).map(
      (_, i) =>
        new TextGeometry((i + 1).toString(), {
          font,
          size: this.options.passengerRadius,
          height: 0.01,
        })
    );
  }
}
