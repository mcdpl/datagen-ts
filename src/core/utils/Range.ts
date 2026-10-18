import type { IString } from "../interfaces/IString";

export class Range implements IString {
    private constructor(
        private min: number | null,
        private max: number | null
    ) {
    }

    public getMin(): number | null {return this.min}
    public getMax(): number | null {return this.max}

    public static of(min: number | null, max: number | null): Range {
        if (min != null && max != null) {   
            if (min > max) {
                throw new Error("Minimum is bigger than maximum");
            }
        } else if (min == null && min == null) {
            throw new Error("Cannot make range with minimum and maximum being the same");
        }
        return new Range(min, max);
    }
    public static withMin(min: number) {return this.of(min, null)};
    public static withMax(max: number) {return this.of(null, max)};

    public toString(): string {
        return `${this.min ?? ''}..${this.max ?? ''}`;
    }
}