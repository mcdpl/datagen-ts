/**
 * Tipo de uma tag, que também define a pasta onde ela é salva:
 * `tags/function`, `tags/item` ou `tags/block`.
 */
export type TagType = "function" | "item" | "block";

/**
 * Visão não-genérica de uma tag, usada pelo `Namespace` para
 * armazenar e serializar tags de tipos diferentes.
 */
export interface TagLike {
    getName(): string;
    getType(): TagType;
    getSize(): number;
    /** Valores serializados da tag (ex.: `minecraft:stone`). */
    getValues(namespace: string): string[];
}

/**
 * Um registro ordenado de entradas, usado por tags.
 *
 * Funciona como um conjunto: adicionar, pegar e remover entradas.
 */
export class Tag<T> implements TagLike {
    private readonly entries: T[] = [];

    constructor(
        private readonly name: string,
        private readonly type: TagType = "function",
    ) {}

    public getName(): string {
        return this.name;
    }

    public getType(): TagType {
        return this.type;
    }

    /** Adiciona uma entrada. Lança erro se ela já estiver na tag. */
    public add(entry: T): this {
        if (this.has(entry)) {
            throw new Error(`Tag '${this.name}' already contains this entry`);
        }
        this.entries.push(entry);
        return this;
    }

    /** Retorna uma cópia das entradas da tag. */
    public get(): T[] {
        return [...this.entries];
    }

    public has(entry: T): boolean {
        return this.entries.includes(entry);
    }

    /** Remove uma entrada. Retorna `true` se ela existia. */
    public remove(entry: T): boolean {
        const index = this.entries.indexOf(entry);
        if (index === -1) return false;
        this.entries.splice(index, 1);
        return true;
    }

    public clear(): this {
        this.entries.length = 0;
        return this;
    }

    public getSize(): number {
        return this.entries.length;
    }

    /** Valores serializados, no formato aceito pelo JSON da tag. */
    public getValues(namespace: string): string[] {
        return this.entries.map((entry) => this.toValue(entry, namespace));
    }

    /**
     * Converte uma entrada no valor da tag.
     *
     * Subclasses sobrescrevem para usar o identificador correto
     * (functions, items, blocks).
     */
    protected toValue(entry: T, _namespace: string): string {
        return String(entry);
    }
}
