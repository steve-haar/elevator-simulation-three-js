export enum ElevatorCarState {
  Up = "Up",
  Down = "Down",
  Idle = "Idle",
}

export enum ElevatorCarDirection {
  Up = "Up",
  Down = "Down",
}

export class ElevatorCar {
  readonly capacity: number;
  readonly doorDelay: number;
  private speed: number;
  private position: number;
  private state: ElevatorCarState;
  private destination: number = null;
  private _isOpen = false;

  constructor(options: {
    capacity: number;
    speed: number;
    doorDelay: number;
    position: number;
    state: ElevatorCarState;
  }) {
    this.capacity = options.capacity;
    this.speed = options.speed;
    this.doorDelay = options.doorDelay;
    this.position = options.position;
    this.state = options.state;
  }

  getPosition() {
    return this.position;
  }

  getState() {
    return this.state;
  }

  getDestination() {
    return this.destination;
  }

  isOpen() {
    return this._isOpen;
  }

  tick(deltaTime: number) {
    if (this.state !== ElevatorCarState.Idle && !this._isOpen) {
      const shouldGoUp = this.destination > this.position;
      const movement = deltaTime * this.speed;

      if (shouldGoUp) {
        this.position = Math.min(this.position + movement, this.destination);
      } else {
        this.position = Math.max(this.position - movement, this.destination);
      }
    }
  }

  openDoor() {
    console.log("open door");
    this._isOpen = true;
  }

  closeDoor() {
    console.log("close door");
    this._isOpen = false;
    this.destination = null;
  }

  commandUp(destination: number) {
    this.state = ElevatorCarState.Up;
    this.destination = destination;
  }

  commandDown(destination: number) {
    this.state = ElevatorCarState.Down;
    this.destination = destination;
  }

  commandIdle() {
    this.state = ElevatorCarState.Idle;
    this.destination = null;
  }

  updateSpeed(value: number) {
    this.speed = value;
  }
}
