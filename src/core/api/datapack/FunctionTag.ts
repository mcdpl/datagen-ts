import type { McFunction } from "../../McFunction";
import { Identifier } from "../../utils/Identifier";
import { Tag } from "./Tag";

/**
 * Tag de functions (`data/<namespace>/tags/function/<name>.json`).
 *
 * As entradas são serializadas como identificadores de function,
 * por exemplo `mypack:tick`.
 */
export class FunctionTag extends Tag<McFunction> {
    constructor(name: string) {
        super(name, "function");
    }

    protected override toValue(fn: McFunction, namespace: string): string {
        return (fn.getIdentifier() ?? Identifier.of(namespace, fn.getName())).toString();
    }
}
