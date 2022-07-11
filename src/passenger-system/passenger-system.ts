import { ElevatorSystem } from "../elevator-system/elevator-system";
import { Passenger } from "./passenger";

export interface PassengerDetails {
  id: Symbol;
  creationTimestamp: number;
  startingFloor: number;
  destinationFloor: number;
  elevatorIndex: number;
}

export class PassengerSystem {
  private lastTime = 0;
  private passengersPerMinute: number;
  private readonly maxPassengers: number;
  private readonly passengerExitedCallback: (
    passenger: PassengerDetails,
    elapsedTime: number
  ) => void;
  private passengers: Passenger[] = [];
  private totalPeopleCreated = 0;

  constructor(
    private readonly elevatorSystem: ElevatorSystem,
    options: {
      passengersPerMinute: number;
      maxPassengers: number;
      passengerExitedCallback: (
        passenger: PassengerDetails,
        elapsedTime: number
      ) => void;
    }
  ) {
    this.passengersPerMinute = options.passengersPerMinute;
    this.maxPassengers = options.maxPassengers;
    this.passengerExitedCallback = options.passengerExitedCallback;
  }

  getPassengerDetails(): PassengerDetails[] {
    return this.passengers.map(getPassengerDetails);
  }

  tick(elapsedTime: number): void {
    this.movePassengers(elapsedTime);
    this.createPassengers(elapsedTime);
  }

  updatePassengersPerMinute(value: number) {
    this.passengersPerMinute = value;
    const rate = 60 / this.passengersPerMinute;
    const expectedPeople = Math.floor(this.lastTime / rate);
    this.totalPeopleCreated = expectedPeople;
  }

  private movePassengers(elapsedTime: number): void {
    this.elevatorSystem.getCarDetails().forEach((car, carIndex) => {
      if (car.isOpen) {
        const onboardPassengers = this.passengers.filter(
          (passenger) => passenger.getElevatorIndex() === carIndex
        );
        const exiting = onboardPassengers.filter(
          (passenger) => passenger.destinationFloor === car.position
        );
        const remainingCapacity =
          car.capacity - onboardPassengers.length + exiting.length;
        const entering = this.passengers
          .filter(
            (passenger) =>
              passenger.getElevatorIndex() === null &&
              passenger.startingFloor === car.position &&
              (passenger.getDirection() as any) === car.state
          )
          .slice(0, remainingCapacity);

        this.passengers = this.passengers.filter(
          (passenger) => !exiting.includes(passenger)
        );

        if (this.passengerExitedCallback) {
          exiting.forEach((passenger) => {
            this.passengerExitedCallback(
              getPassengerDetails(passenger),
              elapsedTime
            );
          });
        }

        if (entering.length) {
          console.log("entering", entering.length);
        }

        entering.forEach((passenger) => {
          passenger.enterElevator(carIndex);
          this.elevatorSystem.requestFloorFromCar(
            carIndex,
            passenger.destinationFloor
          );
        });
      }
    });
  }

  private createPassengers(elapsedTime: number): void {
    this.lastTime = elapsedTime;
    const rate = 60 / this.passengersPerMinute;
    const expectedPeople = Math.floor(elapsedTime / rate);
    const toCreate = expectedPeople - this.totalPeopleCreated;
    this.totalPeopleCreated += toCreate;

    const numberOfFloors = this.elevatorSystem.getNumberOfFloors();

    for (let i = 0; i < toCreate; i++) {
      if (this.passengers.length < this.maxPassengers) {
        const starting = Math.floor(Math.random() * numberOfFloors);
        let destination = Math.floor(Math.random() * (numberOfFloors - 1));
        destination = destination >= starting ? destination + 1 : destination;
        const passenger = new Passenger(elapsedTime, starting, destination);
        this.passengers.push(passenger);
        this.elevatorSystem.callForCar(starting, passenger.getDirection());
      }
    }
  }
}

function getPassengerDetails(passenger: Passenger): PassengerDetails {
  return {
    id: passenger.getId(),
    creationTimestamp: passenger.creationTimestamp,
    startingFloor: passenger.startingFloor,
    destinationFloor: passenger.destinationFloor,
    elevatorIndex: passenger.getElevatorIndex(),
  };
}
