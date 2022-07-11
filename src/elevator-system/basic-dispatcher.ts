import {
  MaxPriorityQueue,
  MinPriorityQueue,
} from "@datastructures-js/priority-queue";
import {
  ElevatorCar,
  ElevatorCarDirection,
  ElevatorCarState,
} from "./elevator-car";
import { Dispatcher } from "./elevator-system";

export class BasicDispatcher implements Dispatcher {
  private readonly carQueues: {
    upQueue: MinPriorityQueue<number>;
    downQueue: MaxPriorityQueue<number>;
  }[];
  private readonly upCalls: boolean[];
  private readonly downCalls: boolean[];
  private readonly doorOpenTimes: number[];

  constructor(
    private readonly numberOfFloors: number,
    private readonly elevatorCars: ElevatorCar[]
  ) {
    this.carQueues = elevatorCars.map((car) => ({
      upQueue: new MinPriorityQueue<number>(),
      downQueue: new MaxPriorityQueue<number>(),
    }));
    this.upCalls = Array.from(Array(this.numberOfFloors)).map(() => false);
    this.downCalls = Array.from(Array(this.numberOfFloors)).map(() => false);
    this.doorOpenTimes = Array.from(Array(this.numberOfFloors)).map(() => null);
  }

  requestFloorFromCar(carIndex: number, destinationFloor: number) {
    console.log("request:", carIndex, destinationFloor);
    const car = this.elevatorCars[carIndex];
    const queues = this.carQueues[carIndex];
    const queue =
      destinationFloor > car.getPosition() ? queues.upQueue : queues.downQueue;
    queue.push(destinationFloor);
  }

  callForCar(floor: number, direction: ElevatorCarDirection) {
    console.log("call:", floor, direction);
    const queue =
      direction === ElevatorCarDirection.Up ? this.upCalls : this.downCalls;
    queue[floor] = true;
  }

  tick(_deltaTime: number, elapsedTime: number) {
    this.elevatorCars.forEach((car, carIndex) => {
      const state = car.getState();
      const position = car.getPosition();
      const queues = this.carQueues[carIndex];
      const closestDownCall = this.downCalls
        .slice(0, Math.floor(position) + 1)
        .lastIndexOf(true);
      const closestUpCall = this.upCalls.indexOf(true, Math.ceil(position));
      const nextUpQueue = queues.upQueue.front();
      const nextDownQueue = queues.downQueue.front();

      if (car.isOpen()) {
        const openTime = this.doorOpenTimes[carIndex];
        if (openTime + car.doorDelay <= elapsedTime) {
          car.closeDoor();
          this.doorOpenTimes[carIndex] = null;
          const callQueue =
            state === ElevatorCarState.Up ? this.upCalls : this.downCalls;
          callQueue[position] = false;
        }
      } else if (car.getDestination() === position) {
        if (
          position === this.numberOfFloors - 1 &&
          state === ElevatorCarState.Up
        ) {
          car.commandDown(null);
        } else if (position === 0 && state === ElevatorCarState.Down) {
          car.commandUp(null);
        }

        const callQueue =
          car.getState() === ElevatorCarState.Up
            ? this.upCalls
            : this.downCalls;
        const nextCarQueue =
          state === ElevatorCarState.Up ? nextUpQueue : nextDownQueue;
        if (callQueue[position] || nextCarQueue === position) {
          car.openDoor();
          this.doorOpenTimes[carIndex] = elapsedTime;
          const carQueue =
            state === ElevatorCarState.Up ? queues.upQueue : queues.downQueue;
          while (carQueue.front() === position) {
            carQueue.pop();
          }
        }
      } else {
        switch (state) {
          case ElevatorCarState.Idle:
            car.commandUp(this.numberOfFloors - 1);
            break;
          case ElevatorCarState.Up:
            if (
              closestUpCall >= 0 &&
              (nextUpQueue === null || closestUpCall < nextUpQueue)
            ) {
              // stop on the way
              car.commandUp(closestUpCall);
            } else if (nextUpQueue !== null) {
              // continue to destination
              car.commandUp(nextUpQueue);
            } else if (position != this.numberOfFloors - 1) {
              // go to the top
              car.commandUp(this.numberOfFloors - 1);
            } else {
              // switch direction
              car.commandDown(0);
            }
            break;
          case ElevatorCarState.Down:
            if (
              closestDownCall >= 0 &&
              (nextDownQueue === null || closestDownCall > nextDownQueue)
            ) {
              // stop on the way
              car.commandDown(closestDownCall);
            } else if (nextDownQueue !== null) {
              // continue to destination
              car.commandDown(nextDownQueue);
            } else if (position !== 0) {
              // go to the bottom
              car.commandDown(0);
            } else {
              car.commandUp(this.numberOfFloors - 1);
            }
            break;
        }
      }
    });
  }
}
