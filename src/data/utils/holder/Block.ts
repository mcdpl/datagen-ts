import type { Identifier } from "../../../core/utils/Identifier";
import { IdentifierHolder } from "../IdentifierHolder";

export class Block<S extends Object> extends IdentifierHolder {
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
    }
}