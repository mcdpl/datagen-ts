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

    public static of(id: string): Identifier;
    public static of(namespace: string, path: string): Identifier;
    public static of(...args: [id: string] | [namespace: string, path: string]): Identifier {
        if (args.length == 1) {
            let id = args[0];
            let [ns, path] = id.split(Identifier.SEPARATOR);
            return new Identifier(ns, path);
        } else {
            return new Identifier(...args);
        }
    }
}