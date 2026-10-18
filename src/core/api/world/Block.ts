import { Identifier } from "../../utils/Identifier";

/**
 * Um bloco da Java Edition, identificado por `namespace:path`
 * (ex.: `minecraft:stone`).
 */
export class Block {
    private constructor(private readonly id: Identifier) {}

    public static of(id: Identifier | string): Block {
        return new Block(typeof id === "string" ? Identifier.of(id) : id);
    }

    public getId(): Identifier {
        return this.id;
    }

    public getIdentifier(): Identifier {
        return this.id;
    }

    public toString(): string {
        return this.id.toString();
    }

    public serialize(): string {
        return this.toString();
    }
}
