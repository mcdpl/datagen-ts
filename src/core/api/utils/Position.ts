import type { CoordinateValue } from "../../../commands/FillCommand";
import type { IString } from "../../interfaces/IString";
import { Coordinate } from "./Coordinate";

export class Position implements IString {
    private x: Coordinate;
    private y: Coordinate;
    private z: Coordinate;
    constructor(
        x: Coordinate | CoordinateValue,
        y: Coordinate | CoordinateValue,
        z: Coordinate | CoordinateValue
    ) {
        this.x = Coordinate.auto(x);
        this.y = Coordinate.auto(y);
        this.z = Coordinate.auto(z);
    }

    public getX(): Coordinate { return this.x }
    public getY(): Coordinate { return this.y }
    public getZ(): Coordinate { return this.z }

    public setX(value: CoordinateValue): this { 
        this.x.setValue(value);
        return this;
    }
    public setY(value: CoordinateValue): this { 
        this.y.setValue(value);
        return this;
    }
    public setZ(value: CoordinateValue): this { 
        this.z.setValue(value);
        return this;
    }

    public toString(): string {
        return `${this.x} ${this.y} ${this.z}`
    }
}