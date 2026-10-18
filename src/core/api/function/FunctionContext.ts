import type { Command } from "../../models/Command";
import { WorldContext } from "../world/WorldContext";

export class FunctionContext {

    private readonly commands: Command[] = [];
    public addCommand(command: Command): this {
        this.commands.push(command);
        return this;
    }
    public getCommands(): Command[] {
        return [...this.commands];
    }

    private readonly world = new WorldContext(this);
    public getWorld(): WorldContext {
        return this.world;
    }

    constructor() {}
}