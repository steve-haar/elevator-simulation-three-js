import {
  ElevatorCar,
  ElevatorCarDirection,
  ElevatorCarState,
} from "./elevator-car";

export class ElevatorSystem {
  private readonly dispatcher: Dispatcher;
  private readonly cars: ElevatorCar[];
  private readonly numberOfFloors: number;

  constructor(options: {
    numberOfFloors: number;
    numberOfCars: number;
    elevatorCapacity: number;
    elevatorSpeed: number;
    elevatorDoorDelay: number;
    dispatcherFactory: new (
      numberOfFloors: number,
      elevatorCars: ElevatorCar[]
    ) => Dispatcher;
  }) {
    this.numberOfFloors = options.numberOfFloors;

    this.cars = Array.from(Array(options.numberOfCars)).map(
      (_, carIndex) =>
        new ElevatorCar({
          capacity: options.elevatorCapacity,
          speed: options.elevatorSpeed,
          doorDelay: options.elevatorDoorDelay,
          position: Math.floor(Math.random() * this.numberOfFloors),
          state:
            carIndex % 2 === 1 ? ElevatorCarState.Up : ElevatorCarState.Down,
        })
    );
    this.dispatcher = new options.dispatcherFactory(
      options.numberOfFloors,
      this.cars
    );
  }

  getCarDetails() {
    return this.cars.map((car) => ({
      position: car.getPosition(),
      state: car.getState(),
      isOpen: car.isOpen(),
      capacity: car.capacity,
    }));
  }

  getNumberOfFloors() {
    return this.numberOfFloors;
  }

  tick(deltaTime: number, elapsedTime: number) {
    this.dispatcher.tick(deltaTime, elapsedTime);
    this.cars.forEach((car) => {
      car.tick(deltaTime);
    });
  }

  requestFloorFromCar(carIndex: number, destinationFloor: number) {
    this.dispatcher.requestFloorFromCar(carIndex, destinationFloor);
  }

  callForCar(floor: number, direction: ElevatorCarDirection) {
    this.dispatcher.callForCar(floor, direction);
  }

  updateCarSpeed(value: number) {
    this.cars.forEach((car) => {
      car.updateSpeed(value);
    });
  }
}

export interface ElevatorCarDetails {
  position: number;
  state: ElevatorCarState;
  isOpen: boolean;
  capacity: number;
}

export interface Dispatcher {
  requestFloorFromCar(carIndex: number, destinationFloor: number);
  callForCar(floor: number, direction: ElevatorCarDirection);
  tick(deltaTime: number, elapsedTime: number);
}
