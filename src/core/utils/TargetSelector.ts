import type { IBoolean } from "../interfaces/IBoolean";
import type { INumber } from "../interfaces/INumber";
import type { ISerializable } from "../interfaces/ISerializable";
import type { IString } from "../interfaces/IString";
import { NbtSerializer } from "../serializer/NBTSerializer";
import { Byte } from "nbt-ts";
import type { AdvancementsProvider } from "./AdvancementsProvider";
import type { IIdentifier } from "./IIdentifier";
import type { Range } from "./Range";
import type { TargetScoresProvider } from "./TargetScoresProvider";

export type SelectorVariable = 
    'a'
    | 'e'
    | 'n'
    | 'p'
    | 'r'
    | 's';
export type SortingMethod =
    "nearest"
  | "furthest"
  | "random"
  | "arbitrary";
export type ExclusionOf<T extends StringProvider> =
    T extends string ? `!${T}` : string;
export type SupportsExclusion<T extends StringProvider> =
    T | ExclusionOf<T>;
export type NumberOrRangeProvider = INumber | number | Range;
export type NumberProdiver = INumber | number;
export type StringProvider = IString | string;
export type BooleanProvider = IBoolean | boolean;
export type IdentifierProvider = IIdentifier;
export type Gamemode = "survival" | "creative" | "adventure" | "spectator"
/**
 * Argumentos do target selector da Java Edition (JE only). Argumentos
 * exclusivos da Bedrock Edition (ex.: `family`, `hasitem`, `r`/`rm`) não entram.
 */
export type SelectorProps = {
    x: NumberOrRangeProvider,
    y: NumberOrRangeProvider,
    z: NumberOrRangeProvider,
    distance: NumberOrRangeProvider,
    dx: NumberOrRangeProvider,
    dy: NumberOrRangeProvider,
    dz: NumberOrRangeProvider,
    x_rotation: NumberOrRangeProvider,
    y_rotation: NumberOrRangeProvider,
    scores: TargetScoresProvider,
    tag: SupportsExclusion<StringProvider>,
    team: SupportsExclusion<StringProvider>,
    name: SupportsExclusion<StringProvider>,
    type: SupportsExclusion<StringProvider>,
    predicate: IdentifierProvider,
    nbt: Object,
    level: NumberOrRangeProvider,
    gamemode: SupportsExclusion<Gamemode>,
    advancements: AdvancementsProvider,
    limit: NumberProdiver,
    sort: SortingMethod
};

export class TargetSelector implements IString, ISerializable {
    /**
     * Ordem canônica dos argumentos, seguindo o resumo da wiki de target selectors.
     * @see https://minecraft.wiki/w/Target_selectors
     */
    private static readonly PROP_ORDER: readonly (keyof SelectorProps)[] = [
        'x', 'y', 'z', 'distance',
        'dx', 'dy', 'dz',
        'x_rotation', 'y_rotation',
        'scores', 'tag', 'team',
        'name', 'type', 'predicate',
        'nbt',
        'level', 'gamemode', 'advancements',
        'limit', 'sort',
    ];

    /**
     * Serializa o seletor no formato `@<variable>[<argument>=<value>,...]`.
     *
     * @public
     * @returns {string} o target selector, ex.: `@a[scores={foo=1},tag=!bot,limit=1,sort=nearest]`
     */
    public toString(): string {
        const args = TargetSelector.PROP_ORDER
            .filter((key) => this.props[key] !== null && this.props[key] !== undefined)
            .map((key) => `${key}=${this.format(this.props[key])}`);

        if (args.length === 0) {
            return `@${this.variable}`;
        }
        return `@${this.variable}[${args.join(',')}]`;
    }
    public serialize(): string {
        return this.toString();
    }

    private format(value: unknown): string {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value !== 'object') {
            return String(value);
        }

        const provider = value as Partial<INumber & ISerializable & IString>;
        if (typeof provider.toNumber === 'function') {
            return String(provider.toNumber());
        }
        if (typeof provider.serialize === 'function') {
            return provider.serialize();
        }
        if (typeof provider.toString === 'function' && provider.toString !== Object.prototype.toString) {
            return provider.toString();
        }

        // Objetos simples só aparecem no argumento `nbt`, que usa SNBT (ex.: {OnGround:true}).
        return NbtSerializer.stringify(
            this.normalizeNbt(value) as Parameters<typeof NbtSerializer.stringify>[0]
        );
    }

    /**
     * Converte a árvore de NBT para tipos aceitos pelo serializador, trocando
     * booleanos por bytes (true -> 1b, false -> 0b), como na wiki.
     */
    private normalizeNbt(value: unknown): unknown {
        if (typeof value === 'boolean') {
            return new Byte(value ? 1 : 0);
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.normalizeNbt(item));
        }
        if (value !== null && typeof value === 'object' && (value as object).constructor === Object) {
            const out: Record<string, unknown> = {};
            Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
                out[key] = this.normalizeNbt(item);
            });
            return out;
        }
        return value;
    }
    private variable: SelectorVariable = 's';
    private props: Partial<SelectorProps> = {};

    public constructor(
        variable: SelectorVariable,
        props: Partial<SelectorProps>
    ) {
        this.variable = variable;
        Object.assign(this.props, props);
    }

    public getVariable(): SelectorVariable {
        return this.variable;
    }
    public getProps(): Partial<SelectorProps> {
        return {...this.props};
    }
}