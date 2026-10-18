import type { ISerializable } from "../../interfaces/ISerializable";
import { NbtSerializer } from "../../serializer/NBTSerializer";
import type { IdentifierProvider } from "../../utils/TargetSelector";
import type { Dialog } from "../utils/Dialog";
import { Byte, Float, Int } from "nbt-ts";

/**
 * Text component format da Java Edition 26.3.
 *
 * As classes abaixo formam uma DSL para montar componentes de texto e
 * serializá-los como objeto (JSON) ou SNBT (comandos).
 *
 * @see https://minecraft.wiki/w/Text_component_format
 */

export type TextComponentType =
    "text"
  | "translatable"
  | "score"
  | "selector"
  | "keybind"
  | "nbt"
  | "object"
  ;
export type MinecraftColors =
    "black"
  | "dark_blue"
  | "dark_green"
  | "dark_aqua"
  | "dark_red"
  | "dark_purple"
  | "gold"
  | "gray"
  | "dark_gray"
  | "blue"
  | "green"
  | "aqua"
  | "red"
  | "light_purple"
  | "yellow"
  | "white"
  ;
export type TextComponentColor =
    `#${string}`
  | MinecraftColors;

/** Um componente pode ser uma string, um objeto ou uma lista deles. */
export type TextComponentProvider = string | Component | Component[];

// ---------------------------------------------------------------------------
// Click events
// ---------------------------------------------------------------------------

export type ClickEvent =
    { action: "open_url"; url: string }
  | { action: "open_file"; path: string }
  | { action: "run_command"; command: string }
  | { action: "suggest_command"; command: string }
  | { action: "change_page"; page: number }
  | { action: "copy_to_clipboard"; value: string }
  | { action: "show_dialog"; dialog: string | Dialog }
  | { action: "custom"; id: string; payload?: string }
  ;

// ---------------------------------------------------------------------------
// Hover events
// ---------------------------------------------------------------------------

export type HoverEvent =
    { action: "show_text"; value: TextComponentProvider }
  | {
        action: "show_item";
        id: string;
        count?: number;
        /** Componentes de item (data component format). */
        components?: Record<string, unknown>;
    }
  | {
        action: "show_entity";
        name?: TextComponentProvider;
        id: string;
        /** UUID em formato hyphenated ou lista de 4 números. */
        uuid: string | number[];
    }
  ;

// ---------------------------------------------------------------------------
// Conteúdo
// ---------------------------------------------------------------------------

export type ScoreContent = {
    /** Nome do score holder, seletor ou `"*"` (próprio leitor). */
    name: string;
    objective: string;
};

export type NbtSource = "block" | "entity" | "storage";
export type NbtValueOptions = {
    source?: NbtSource;
    interpret?: boolean;
    plain?: boolean;
    separator?: TextComponentProvider;
    entity?: string;
    block?: string;
    storage?: string;
};

export type PlayerProfileProperty = {
    name: string;
    value: string;
    signature?: string;
};
export type PlayerProfile = {
    name?: string;
    id?: string;
    properties?: PlayerProfileProperty[];
};

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

export type ComponentStyle = {
    color?: TextComponentColor;
    font?: string | IdentifierProvider;
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
    shadow_color?: number | [number, number, number, number];
    insertion?: string;
    click_event?: ClickEvent;
    hover_event?: HoverEvent;
};

export abstract class Component implements ISerializable {
    public abstract readonly type: TextComponentType;
    public readonly extra: Component[] = [];

    private readonly style: ComponentStyle = {};

    protected abstract content(): Record<string, unknown>;

    // --- formatação ---------------------------------------------------------

    public color(color: TextComponentColor): this {
        this.style.color = color;
        return this;
    }
    public font(font: string | IdentifierProvider): this {
        this.style.font = font;
        return this;
    }
    public bold(value: boolean = true): this {
        this.style.bold = value;
        return this;
    }
    public italic(value: boolean = true): this {
        this.style.italic = value;
        return this;
    }
    public underlined(value: boolean = true): this {
        this.style.underlined = value;
        return this;
    }
    public strikethrough(value: boolean = true): this {
        this.style.strikethrough = value;
        return this;
    }
    public obfuscated(value: boolean = true): this {
        this.style.obfuscated = value;
        return this;
    }
    public shadowColor(color: number | [number, number, number, number]): this {
        this.style.shadow_color = color;
        return this;
    }

    // --- interatividade -----------------------------------------------------

    public insert(text: string): this {
        this.style.insertion = text;
        return this;
    }
    public click(event: ClickEvent): this {
        this.style.click_event = event;
        return this;
    }
    public hover(event: HoverEvent): this {
        this.style.hover_event = event;
        return this;
    }

    // --- filhos -------------------------------------------------------------

    public append(...components: TextComponentProvider[]): this {
        for (const component of components) {
            if (Array.isArray(component)) {
                this.append(...component);
            } else {
                this.extra.push(asComponent(component));
            }
        }
        return this;
    }

    // --- serialização -------------------------------------------------------

    public toObject(): Record<string, unknown> {
        const object: Record<string, unknown> = {
            type: this.type,
            ...clean(this.content()),
            ...this.styleObject(),
        };
        if (this.extra.length > 0) {
            object.extra = this.extra.map((component) => component.toObject());
        }
        return object;
    }

    /** Permite `JSON.stringify(component)` diretamente. */
    public toJSON(): Record<string, unknown> {
        return this.toObject();
    }
    public toJson(pretty: boolean = false): string {
        return JSON.stringify(this.toObject(), null, pretty ? 2 : undefined);
    }
    public serialize(): string {
        return NbtSerializer.stringify(
            toSnbt(this.toObject()) as Parameters<typeof NbtSerializer.stringify>[0]
        );
    }

    private styleObject(): Record<string, unknown> {
        const style: Record<string, unknown> = {};
        if (this.style.color !== undefined) style.color = this.style.color;
        if (this.style.font !== undefined) style.font = identifierString(this.style.font);
        if (this.style.bold !== undefined) style.bold = this.style.bold;
        if (this.style.italic !== undefined) style.italic = this.style.italic;
        if (this.style.underlined !== undefined) style.underlined = this.style.underlined;
        if (this.style.strikethrough !== undefined) style.strikethrough = this.style.strikethrough;
        if (this.style.obfuscated !== undefined) style.obfuscated = this.style.obfuscated;
        if (this.style.shadow_color !== undefined) style.shadow_color = this.style.shadow_color;
        if (this.style.insertion !== undefined) style.insertion = this.style.insertion;
        if (this.style.click_event !== undefined) style.click_event = this.style.click_event;
        if (this.style.hover_event !== undefined) {
            style.hover_event = resolveHoverEvent(this.style.hover_event);
        }
        return style;
    }
}

// ---------------------------------------------------------------------------
// Conteúdos
// ---------------------------------------------------------------------------

export class Text extends Component {
    public readonly type = "text" as const;

    constructor(public readonly value: string) {
        super();
    }
    protected content(): Record<string, unknown> {
        return { text: this.value };
    }
}

export class Translatable extends Component {
    public readonly type = "translatable" as const;

    private readonly values: Component[];

    constructor(
        public readonly translate: string,
        values: TextComponentProvider[] = [],
        public readonly fallback?: string,
    ) {
        super();
        this.values = components(...values);
    }
    protected content(): Record<string, unknown> {
        return {
            translate: this.translate,
            fallback: this.fallback,
            with: this.values.length > 0
                ? this.values.map((component) => component.toObject())
                : undefined,
        };
    }
}

export class Score extends Component {
    public readonly type = "score" as const;

    constructor(
        public readonly name: string,
        public readonly objective: string,
    ) {
        super();
    }
    protected content(): Record<string, unknown> {
        return { score: { name: this.name, objective: this.objective } };
    }
}

export class Selector extends Component {
    public readonly type = "selector" as const;

    constructor(
        public readonly selector: string,
        public readonly separator?: TextComponentProvider,
    ) {
        super();
    }
    protected content(): Record<string, unknown> {
        return {
            selector: this.selector,
            separator: this.separator !== undefined
                ? resolveComponent(this.separator)
                : undefined,
        };
    }
}

export class Keybind extends Component {
    public readonly type = "keybind" as const;

    constructor(public readonly keybind: string) {
        super();
    }
    protected content(): Record<string, unknown> {
        return { keybind: this.keybind };
    }
}

export class Nbt extends Component {
    public readonly type = "nbt" as const;

    constructor(
        public readonly path: string,
        private readonly options: NbtValueOptions = {},
    ) {
        super();
    }
    protected content(): Record<string, unknown> {
        const options = this.options;
        return {
            source: options.source,
            nbt: this.path,
            interpret: options.interpret,
            plain: options.plain,
            separator: options.separator !== undefined
                ? resolveComponent(options.separator)
                : undefined,
            entity: options.entity,
            block: options.block,
            storage: options.storage,
        };
    }
}

/** Sprite de um texture atlas (ex.: `block/emerald_block`). */
export class Atlas extends Component {
    public readonly type = "object" as const;

    constructor(
        public readonly sprite: string,
        public readonly atlas?: string,
        public readonly fallback?: TextComponentProvider,
    ) {
        super();
    }
    protected content(): Record<string, unknown> {
        return {
            object: "atlas",
            atlas: this.atlas,
            sprite: this.sprite,
            fallback: this.fallback !== undefined
                ? resolveComponent(this.fallback)
                : undefined,
        };
    }
}

/** Face 2D de um perfil de jogador. */
export class PlayerObject extends Component {
    public readonly type = "object" as const;

    constructor(
        public readonly player: string | PlayerProfile,
        public readonly hat: boolean = true,
        public readonly fallback?: TextComponentProvider,
    ) {
        super();
    }
    protected content(): Record<string, unknown> {
        return {
            object: "player",
            player: this.player,
            hat: this.hat ? undefined : false,
            fallback: this.fallback !== undefined
                ? resolveComponent(this.fallback)
                : undefined,
        };
    }
}

// ---------------------------------------------------------------------------
// Factories (DSL)
// ---------------------------------------------------------------------------

export function text(value: string): Text {
    return new Text(value);
}
export function translatable(
    translate: string,
    values: TextComponentProvider[] = [],
    fallback?: string,
): Translatable {
    return new Translatable(translate, values, fallback);
}
export function score(name: string, objective: string): Score {
    return new Score(name, objective);
}
export function selector(
    selectorValue: string,
    separator?: TextComponentProvider,
): Selector {
    return new Selector(selectorValue, separator);
}
export function keybind(keybindValue: string): Keybind {
    return new Keybind(keybindValue);
}
export function nbt(path: string, options?: NbtValueOptions): Nbt {
    return new Nbt(path, options);
}
export function atlas(
    sprite: string,
    atlasName?: string,
    fallback?: TextComponentProvider,
): Atlas {
    return new Atlas(sprite, atlasName, fallback);
}
export function player(
    profile: string | PlayerProfile,
    hat: boolean = true,
    fallback?: TextComponentProvider,
): PlayerObject {
    return new PlayerObject(profile, hat, fallback);
}

/** Junta vários providers em uma lista de componentes. */
export function components(...values: TextComponentProvider[]): Component[] {
    const result: Component[] = [];
    for (const value of values) {
        if (Array.isArray(value)) {
            result.push(...components(...value));
        } else {
            result.push(asComponent(value));
        }
    }
    return result;
}

// ---------------------------------------------------------------------------
// Serialização
// ---------------------------------------------------------------------------

/** Converte um provider para o formato de objeto (JSON-safe). */
export function componentToObject(value: TextComponentProvider): unknown {
    if (typeof value === "string") {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(componentToObject);
    }
    return value.toObject();
}

export function componentToJson(
    value: TextComponentProvider,
    pretty: boolean = false,
): string {
    return JSON.stringify(componentToObject(value), null, pretty ? 2 : undefined);
}

export function componentToSnbt(value: TextComponentProvider): string {
    return NbtSerializer.stringify(
        toSnbt(componentToObject(value)) as Parameters<typeof NbtSerializer.stringify>[0]
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asComponent(value: string | Component): Component {
    return typeof value === "string" ? new Text(value) : value;
}

function resolveComponent(value: TextComponentProvider): unknown {
    return componentToObject(value);
}

function resolveHoverEvent(event: HoverEvent): Record<string, unknown> {
    if (event.action === "show_text") {
        return { action: event.action, value: resolveComponent(event.value) };
    }
    if (event.action === "show_item") {
        return clean({
            action: event.action,
            id: event.id,
            count: event.count,
            components: event.components,
        });
    }
    return clean({
        action: event.action,
        name: event.name !== undefined ? resolveComponent(event.name) : undefined,
        id: event.id,
        uuid: event.uuid,
    });
}

function identifierString(value: string | IdentifierProvider): string {
    return typeof value === "string" ? value : value.toIdentifier().toString();
}

/**
 * Converte valores JSON para os tipos que o `nbt-ts` entende como SNBT:
 * boolean -> byte (`true`/`false`), inteiro -> int (sem `.0`) e
 * `shadow_color` em lista -> floats.
 */
function toSnbt(value: unknown, key?: string): unknown {
    if (typeof value === "boolean") {
        return new Byte(value ? 1 : 0);
    }
    if (typeof value === "number") {
        return Number.isInteger(value) ? new Int(value) : value;
    }
    if (value instanceof Component) {
        return toSnbt(value.toObject(), key);
    }
    if (Array.isArray(value)) {
        if (key === "shadow_color") {
            return value.map((item) => new Float(item as number));
        }
        return value.map((item) => toSnbt(item));
    }
    if (value !== null && typeof value === "object" && (value as object).constructor === Object) {
        const result: Record<string, unknown> = {};
        for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
            result[childKey] = toSnbt(childValue, childKey);
        }
        return result;
    }
    return value;
}

function clean<T extends Record<string, unknown>>(object: T): T {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(object)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result as T;
}
