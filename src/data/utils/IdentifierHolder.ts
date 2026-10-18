import type { Identifier } from "../../core/utils/Identifier";
import type { IIdentifier } from "../../core/utils/IIdentifier";

export class IdentifierHolder implements IIdentifier {
    constructor(
        private readonly id: Identifier
    ) {}

    public getIdentifier(): Identifier {
        return this.id;
    }

    public toIdentifier(): Identifier {
        return this.getIdentifier();
    }

    public toString(): string {
        return this.id.toString();
    }

    public serialize(): string {
        return this.toString();
    }
}