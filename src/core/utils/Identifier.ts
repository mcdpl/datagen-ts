import type { ISerializable } from "../interfaces/ISerializable";
import type { IString } from "../interfaces/IString";

export class Identifier implements IString, ISerializable {
    public static readonly SEPARATOR = ':';
    private constructor(
        private readonly namespace: string,
        private readonly path: string
    ) {}

    public getNamespace(): string { return this.namespace; }
    public getPath(): string { return this.path; }

    public toString(): string {
        return `${this.getNamespace()}${Identifier.SEPARATOR}${this.getPath()}`;
    }
    public serialize(): string {
        return this.toString();
    }
}