import type { CoordinateValue } from "../../../commands/FillCommand";
import type { INumber } from "../../interfaces/INumber";
import type { IString } from "../../interfaces/IString";

export class Coordinate implements IString, INumber {

    private value: CoordinateValue;
    constructor(
        value: CoordinateValue
    ) {
        this.value = value;
    }

    public getValue(): CoordinateValue {
        return this.value;
    }
    public setValue(value: CoordinateValue): this {
        this.value = value;
        return this;
    }

    public toString(): string {
        return `${this.value}`
    }
    public toNumber(): number {
        return parseFloat(this.value.toString().replace('~', ''))
    }
    public static auto(v: Coordinate | CoordinateValue): Coordinate {
        if (v instanceof Coordinate) {
            return v;
        } else {
            return new Coordinate(v);
        }
    }
}