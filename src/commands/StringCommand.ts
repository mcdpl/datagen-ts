import { Command } from "../core/models/Command";

export class StringCommand extends Command {
    public serialize(): string {
        return this.string;
    }
    public innerSerialize(): string {
        return this.serialize();
    }
    constructor(private readonly string: string) {
        super();
    }
    public getString(): string {
        return this.string;
    }
}