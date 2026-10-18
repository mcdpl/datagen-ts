import { SayCommand } from "../../../commands/SayCommand";
import type { FunctionContext } from "../function/FunctionContext";

export class WorldContext {
    constructor(private readonly fctx: FunctionContext) {}

    public say(message: string): this {
        this.fctx.addCommand(this.isay(message));
        return this;
    }
    public isay(message: string): SayCommand { return new SayCommand(message) }
}