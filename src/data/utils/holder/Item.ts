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
    public get<K extends keyof C>(key: K): C[K] | null {
        return this.getComponents()[key] ?? null;
    }
    public getOrDefault<K extends keyof C, V extends C[K]>(key: K, default_: V): V {
        return this.get(key) as V ?? default_;
    }

    public copy() {
        return new Item(this.getIdentifier(), this.getComponents())
    }
}