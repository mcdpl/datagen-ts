import type { Identifier } from "../../../core/utils/Identifier";
import { IdentifierHolder } from "../IdentifierHolder";

/** Valor NBT aceito em um bloco (string, número, booleano, lista ou compound). */
export type NbtValue =
    | string
    | number
    | boolean
    | NbtValue[]
    | { [key: string]: NbtValue };

/**
 * Dados NBT de um block entity (um compound).
 *
 * O mcmeta não expõe um schema NBT por bloco, então os blocos gerados usam
 * este tipo genérico. Para um bloco específico, use `Block<Estado, SeuSchema>`.
 */
export type BlockEntityData = { [key: string]: NbtValue };

export class Block<
    S extends Object = any,
    E extends Object = BlockEntityData,
> extends IdentifierHolder {
    private state: Partial<S>;
    private entityData: Partial<E>;

    constructor(id: Identifier) {
        super(id);
        this.state = {};
        this.entityData = {};
    }

    public getState(): Partial<S> {
        return this.state;
    }
    public setState(state: Partial<S>): this {
        Object.assign(this.state, state);
        return this;
    }

    public setStateKey<K extends keyof S>(key: K, value: S[K]): this {
        this.state[key] = value;
        return this;
    }
    public setDataKey<K extends keyof E>(key: K, value: E[K]): this {
        this.entityData[key] = value;
        return this;
    }
    public getStateKey<K extends keyof S>(key: K): S[K] | null {
        return this.getState()[key] ?? null;
    }
    public getStateKeyOrDefault<K extends keyof S, V extends S[K]>(key: K, default_: V): V {
        return this.getStateKey(key) as V ?? default_;
    }

    public getEntityData(): Partial<E> {
        return this.entityData;
    }
    public setEntityData(entityData: Partial<E>): this {
        Object.assign(this.entityData, entityData);
        return this;
    }
    public setEntityDataKey<K extends keyof E, V extends E[K]>(
        key: K, value: V
    ) {
        this.entityData[key] = value;
        return this;
    }
    public getEntityDataKey<K extends keyof E>(
        key: K
    ): E[K] | null {
        return this.entityData[key] ?? null;
    }
    public getEntityDataKeyOrDefault<K extends keyof E, V extends E[K]>(
        key: K, default_: V
    ): V {
        return this.entityData[key] as V ?? default_;
    }

    public copy(): Block<S, E> {
        return new Block<S, E>(this.getIdentifier())
            .setState({ ...this.getState() })
            .setEntityData({ ...this.getEntityData() });
    }
}
