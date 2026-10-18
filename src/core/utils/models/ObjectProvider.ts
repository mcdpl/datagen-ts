import type { IBoolean } from "../../interfaces/IBoolean";
import type { INumber } from "../../interfaces/INumber";
import type { ISerializable } from "../../interfaces/ISerializable";
import type { IString } from "../../interfaces/IString";
import type { NumberOrRangeProvider, StringProvider } from "../TargetSelector";

export class ObjectProvider<K, V> implements IString, ISerializable {

    private map: Map<K, V> = new Map<K, V>();

    constructor() {}

    public toString(): string {
        return `{${Array.from(this.map.entries())
            .map(([k, v]) => `${this.format(k)}=${this.format(v)}`)
            .join(',')}}`;
    }
    public serialize(): string {
        return this.toString();
    }

    public toObject(): Record<string, unknown> {
        const out: Record<string, unknown> = {};
        this.map.forEach((value, key) => {
            out[this.formatKey(key)] = this.resolve(value);
        });
        return out;
    }

    private formatKey(key: unknown): string {
        if (key && typeof key === 'object') {
            const provider = key as Partial<ISerializable & IString>;
            if (typeof provider.serialize === 'function') {
                return provider.serialize();
            }
            if (typeof provider.toString === 'function' && provider.toString !== Object.prototype.toString) {
                return provider.toString();
            }
        }
        return String(key);
    }

    private resolve(value: unknown): unknown {
        if (value === null || value === undefined) {
            return value;
        }
        if (typeof value !== 'object') {
            return value;
        }
        if (value instanceof ObjectProvider) {
            return value.toObject();
        }

        const provider = value as Partial<IBoolean & INumber & ISerializable & IString>;
        if (typeof provider.toBoolean === 'function') {
            return provider.toBoolean();
        }
        if (typeof provider.toNumber === 'function') {
            return provider.toNumber();
        }
        if (typeof provider.serialize === 'function') {
            return provider.serialize();
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.resolve(item));
        }
        if (typeof provider.toString === 'function' && provider.toString !== Object.prototype.toString) {
            return provider.toString();
        }

        const out: Record<string, unknown> = {};
        Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
            out[k] = this.resolve(v);
        });
        return out;
    }

    private format(value: unknown): string {
        if (value === null || value === undefined) {
            return 'null';
        }
        if (typeof value !== 'object') {
            return String(value);
        }

        const provider = value as Partial<IBoolean & INumber & ISerializable & IString>;
        if (typeof provider.toBoolean === 'function') {
            return String(provider.toBoolean());
        }
        if (typeof provider.toNumber === 'function') {
            return String(provider.toNumber());
        }
        if (typeof provider.serialize === 'function') {
            return provider.serialize();
        }
        if (typeof provider.toString === 'function' && provider.toString !== Object.prototype.toString) {
            return provider.toString();
        }

        return `{${Object.entries(value as Record<string, unknown>)
            .map(([k, v]) => `${k}=${this.format(v)}`)
            .join(',')}}`;
    }
    
    public set(key: K, value: V) {
        this.map.set(key, value);
        return this;
    }
    public def(...pairs: [K, V][]): this {
        pairs.forEach(([k, v]) => {
            this.set(k, v);
        })
        return this;
    }
    public get(key: K): V | null {
        return this.map.get(key) ?? null;
    }
    public getOrDefault(key: K, default_: V): V {
        return this.map.get(key) ?? default_;
    }
}