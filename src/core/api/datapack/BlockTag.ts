import type { Block } from "../world/Block";
import { Tag } from "./Tag";

/**
 * Tag de blocks (`data/<namespace>/tags/block/<name>.json`).
 */
export class BlockTag extends Tag<Block> {
    constructor(name: string) {
        super(name, "block");
    }

    protected override toValue(block: Block): string {
        return block.toString();
    }
}
