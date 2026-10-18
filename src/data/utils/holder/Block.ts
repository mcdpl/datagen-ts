import type { Identifier } from "../../../core/utils/Identifier";
import { IdentifierHolder } from "../IdentifierHolder";

export class Block<S extends Object = any> extends IdentifierHolder {
    private state: Partial<S>;
    constructor(id: Identifier) {
        super(id);
        this.state = {};
    }

    public getState(): Partial<S> {
        return this.state;
    }
    public setState(state: Partial<S>) {
        Object.assign(this.state, state);
        return this;
    }
    public get<K extends keyof S>(key: K): S[K] | null {
        return this.getState()[key] ?? null;
    }
    public getOrDefault<K extends keyof S, V extends S[K]>(key: K, default_: V): V {
        return this.get(key) as V ?? default_;
    }

    public copy() {
        return new Block(this.getIdentifier()).setState({...this.getState()})
    }
}