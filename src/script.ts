import "./style.css";
import * as THREE from "three";

import { Animation } from "./animation/animation";
import { ElevatorSystem } from "./elevator-system/elevator-system";
import { BasicDispatcher } from "./elevator-system/basic-dispatcher";
import {
  PassengerDetails,
  PassengerSystem,
} from "./passenger-system/passenger-system";
import { ElevatorCarState } from "./elevator-system/elevator-car";
import { Scene } from "./animation/scene";
import { Rendering } from "./animation/rendering";

(async function () {
  const options = {
    // system
    numberOfCars: 4,
    elevatorSpeed: 0.2,
    elevatorDoorDelay: 3,
    elevatorCapacity: 9,
    numberOfFloors: 8,
    maxPassengers: 200,
    passengersPerMinute: 60,
    // visual
    doorSize: 4,
    doorDepth: 0.1,
    doorMargin: 2,
    elevatorDepth: 4,
    floorDepth: 20,
    floorPatternRepeat: 4,
    passengerRadius: 0.5,
    passengerSetback: 5,
    passengerHeight: 1,
    wallHeight: 8,
  };

  const elevatorSystem = new ElevatorSystem({
    numberOfFloors: options.numberOfFloors,
    numberOfCars: options.numberOfCars,
    elevatorCapacity: options.elevatorCapacity,
    elevatorSpeed: options.elevatorSpeed,
    elevatorDoorDelay: options.elevatorDoorDelay,
    dispatcherFactory: BasicDispatcher,
  });

  const passengerSystem = new PassengerSystem(elevatorSystem, {
    passengersPerMinute: options.passengersPerMinute,
    maxPassengers: options.maxPassengers,
    passengerExitedCallback,
  });

  const rendering = new Rendering(options);
  await rendering.load();

  const scene = new Scene(rendering, options);

  const animation = new Animation(
    document.getElementsByTagName("canvas")[0],
    animationLoop
  );

  animation.controls.target.setX(scene.getWallWidth() / 2);

  animation.scene.add(...scene.cars);
  animation.scene.add(...scene.doors);
  animation.scene.add(...scene.floors);
  animation.scene.add(...scene.lights);
  animation.scene.add(...scene.walls);

  setupDebugControls();
  animation.initialize();

  function animationLoop(clock: THREE.Clock) {
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    elevatorSystem.tick(deltaTime, elapsedTime);
    passengerSystem.tick(elapsedTime);

    drawCars();
    drawDoors();
    drawPassengers();
  }

  function setupDebugControls() {
    animation.debugControls
      .add(options, "passengersPerMinute")
      .min(0)
      .max(120)
      .step(1)
      .onChange(() => {
        passengerSystem.updatePassengersPerMinute(options.passengersPerMinute);
      });

    animation.debugControls
      .add(options, "elevatorSpeed")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange(() => {
        elevatorSystem.updateCarSpeed(options.elevatorSpeed);
      });
  }

  function drawCars() {
    const rows = Math.ceil(Math.sqrt(options.elevatorCapacity));
    const offset = options.doorSize / (rows + 1);

    const passengerDetails = passengerSystem.getPassengerDetails();

    elevatorSystem.getCarDetails().map((car, carIndex) => {
      const carDrawing = scene.cars[carIndex];
      carDrawing.position.setY(car.position * options.wallHeight);
      rendering.materials.cars[carIndex].color = new THREE.Color(
        getCarColor(car.state)
      );

      const onboardPassengers = passengerDetails.filter(
        (passenger) => passenger.elevatorIndex === carIndex
      );
      onboardPassengers.forEach((passenger, passengerIndex) => {
        const passengerDrawing = scene.passengers.get(passenger.id);
        if (!carDrawing.getObjectById(passengerDrawing.id)) {
          carDrawing.add(passengerDrawing);
        }
        passengerDrawing.position.set(
          (options.doorSize + options.doorMargin * 2) * carIndex +
            options.doorMargin +
            offset * ((passengerIndex % rows) + 1),
          options.passengerHeight / 2,
          -options.elevatorDepth +
            offset * (Math.floor(passengerIndex / rows) + 1)
        );
      });
    });
  }

  function drawDoors() {
    elevatorSystem.getCarDetails().map((car, carIndex) => {
      const carDoors = scene.doors.filter(
        (_, doorIndex) => doorIndex % options.numberOfCars === carIndex
      );
      carDoors.map((door, doorIndex) => {
        door.visible = !car.isOpen || car.position !== doorIndex;
      });
    });
  }

  function drawPassengers() {
    const passengerDetails = passengerSystem.getPassengerDetails();

    Array.from(Array(elevatorSystem.getNumberOfFloors())).map((_, floor) => {
      const passengersOnFloor = passengerDetails.filter(
        (passenger) =>
          passenger.elevatorIndex === null && passenger.startingFloor === floor
      );
      passengersOnFloor.map((passenger, index) => {
        let passengerDrawing = scene.passengers.get(passenger.id);
        if (!passengerDrawing) {
          passengerDrawing = scene.createPassenger(passenger);
          animation.scene.add(passengerDrawing);
        }
        passengerDrawing.position.set(
          scene.getWallWidth() / 2,
          passenger.startingFloor * options.wallHeight +
            options.passengerHeight / 2 +
            0.01,
          options.passengerRadius +
            options.passengerSetback +
            options.passengerRadius * 2 * index
        );
      });
    });
  }

  function getCarColor(state: ElevatorCarState) {
    switch (state) {
      case ElevatorCarState.Up:
        return 0x00ff00;
      case ElevatorCarState.Down:
        return 0xff0000;
      default:
        return 0xffff00;
    }
  }

  function passengerExitedCallback(
    passengerDetails: PassengerDetails,
    elapsedTime: number
  ) {
    const passengerDrawing = scene.passengers.get(passengerDetails.id);
    scene.cars[passengerDetails.elevatorIndex].remove(passengerDrawing);
    scene.passengers.delete(passengerDetails.id);
    animation.scene.remove(passengerDrawing);
    console.log("delivered:", elapsedTime);
  }
})();
