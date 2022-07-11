import { ElevatorCarDirection } from "../elevator-system/elevator-car";

export class Passenger {
  private elevatorIndex: number = null;
  private id: Symbol;

  constructor(
    readonly creationTimestamp: number,
    readonly startingFloor: number,
    readonly destinationFloor: number
  ) {
    this.id = Symbol();
  }

  getId(): Symbol {
    return this.id;
  }

  getElevatorIndex(): number {
    return this.elevatorIndex;
  }

  getDirection(): ElevatorCarDirection {
    return this.destinationFloor > this.startingFloor
      ? ElevatorCarDirection.Up
      : ElevatorCarDirection.Down;
  }

  enterElevator(elevatorIndex: number): void {
    this.elevatorIndex = elevatorIndex;
  }
}
