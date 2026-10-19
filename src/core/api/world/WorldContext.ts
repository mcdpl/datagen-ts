import { FillCommand } from "../../../commands/FillCommand";
import { SayCommand } from "../../../commands/SayCommand";
import { SetBlockCommand } from "../../../commands/SetBlockCommand";
import type { Block } from "../../../data/utils/holder/Block";
import type { FunctionContext } from "../function/FunctionContext";
import type { Position } from "../utils/Position";

export class WorldContext {
    constructor(private readonly fctx: FunctionContext) {}

    public say(message: string): this {
        this.fctx.addCommand(this.isay(message));
        return this;
    }
    public isay(message: string): SayCommand { return new SayCommand(message) }

    public setBlock(position: Position, block: Block) {
        this.fctx.addCommand(this.isetBlock(position, block))
        return this;
    }
    public isetBlock(position: Position, block: Block) {
        return new SetBlockCommand(
            position.getX().getValue(), 
            position.getY().getValue(), 
            position.getZ().getValue(), 
            block
        );
    }

    public fill(pos1: Position, pos2: Position, block: Block) {
        this.fctx.addCommand(this.ifill(pos1, pos2, block));
        return this;
    }

    public ifill(pos1: Position, pos2: Position, block: Block) {
        return new FillCommand(
            pos1.getX().getValue(),
            pos1.getY().getValue(),
            pos1.getZ().getValue(),
            pos2.getX().getValue(),
            pos2.getY().getValue(),
            pos2.getZ().getValue(),
            block
        )
    }

}