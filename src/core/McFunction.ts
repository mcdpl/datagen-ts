import { FunctionContext } from "./api/function/FunctionContext";
import type { ISerializable } from "./interfaces/ISerializable";
import type { ISizable } from "./interfaces/ISizable";
import type { IString } from "./interfaces/IString";
import { Identifier } from "./utils/Identifier";

export class McFunction implements IString, ISerializable, ISizable {
    private readonly name: string;
    private readonly commands: string[] = [];
    private namespace?: string;

    public constructor(name: string) {
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }
    /** Namespace ao qual a function pertence (definido ao adicioná-la a um `Namespace`). */
    public getNamespace(): string | undefined {
        return this.namespace;
    }
    public setNamespace(namespace: string): this {
        this.namespace = namespace;
        return this;
    }
    /** Identificador completo (`namespace:name`), se a function já pertence a um namespace. */
    public getIdentifier(): Identifier | undefined {
        return this.namespace === undefined
            ? undefined
            : Identifier.of(this.namespace, this.name);
    }
    public getCommands(): string[] {
        return [...this.commands];
    }
    public addCommand(command: string): void {
        this.commands.push(command);
    }
    public serialize(): string {
        return this.commands.join('\n');
    }
    public toString(): string {
        return this.serialize();
    }
    public getSize(): number {
        return this.commands.length;
    }

    public do(callback: (ctx: FunctionContext) => any): this {
        let ctx = new FunctionContext();
        callback(ctx);
        ctx.getCommands().forEach(v => {
            this.addCommand(v.serialize());
        });
        return this;
    }
}