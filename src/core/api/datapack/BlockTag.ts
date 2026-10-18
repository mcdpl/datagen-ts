import type { Block } from "../../../data/utils/holder/Block";
import { Tag } from "./Tag";

/**
 * Tag de blocks (`data/<namespace>/tags/block/<name>.json`).
 */
export class BlockTag extends Tag<Block<any>> {
    constructor(name: string) {
        super(name, "block");
    }

    protected override toValue(block: Block<any>): string {
        return block.toString();
    }
}
