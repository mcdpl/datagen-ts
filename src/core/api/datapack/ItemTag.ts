import type { Identifier } from "../../utils/Identifier";
import { Tag } from "./Tag";

/**
 * Tag de items (`data/<namespace>/tags/item/<name>.json`).
 */
export class ItemTag extends Tag<Identifier> {
    constructor(name: string) {
        super(name, "item");
    }

    protected override toValue(id: Identifier): string {
        return id.toString();
    }
}
