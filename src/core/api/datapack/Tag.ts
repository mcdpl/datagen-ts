/**
 * Um registro ordenado de entradas, usado por function tags
 * (por exemplo `#minecraft:load` e `#minecraft:tick`).
 *
 * Funciona como um conjunto: adicionar, pegar e remover entradas.
 */
export class Tag<T> {
    private readonly entries: T[] = [];

    constructor(private readonly name: string) {}

    public getName(): string {
        return this.name;
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
}
