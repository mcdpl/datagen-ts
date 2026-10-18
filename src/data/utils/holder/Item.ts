import type { Identifier } from "../../../core/utils/Identifier";
import { IdentifierHolder } from "../IdentifierHolder";

export class Item<C extends Object> extends IdentifierHolder {
    private components: Partial<C>;
    constructor(id: Identifier, default_: Partial<C>) {
        super(id);
        this.components = default_;
    }

    public getComponents(): Partial<C> {
        return this.components;
    }
    public setComponents(components: Partial<C>) {
        Object.assign(this.components, components);
        return this;
    }

    public copy() {
        return new Item(this.getIdentifier(), this.getComponents())
    }
}