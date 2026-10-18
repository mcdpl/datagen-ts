import type { ISerializable } from "./interfaces/ISerializable";
import type { IString } from "./interfaces/IString";

export class McFunction implements IString, ISerializable {
    private readonly name: string;
    private readonly commands: string[] = [];

    public constructor(name: string) {
        this.name = name;
    }

    public getName(): string {
        return this.name;
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
}