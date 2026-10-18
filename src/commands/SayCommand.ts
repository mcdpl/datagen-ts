import { Command } from "../core/models/Command";

export class SayCommand extends Command {

    constructor(private readonly message: string) { super(); }
    public serialize(): string {
        return `say ${this.message}`
    }
    public innerSerialize(): string {
        return this.serialize();
    }

    public getMessage(): string { return this.message; } 
}