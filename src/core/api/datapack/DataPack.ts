import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Namespace } from "./Namespace";

/**
 * Um data pack da Java Edition.
 *
 * Monta a estrutura `pack.mcmeta` + `data/<namespace>/...` e escreve em disco
 * com {@link build}.
 *
 * @see https://minecraft.wiki/w/Data_pack
 */
export class DataPack {
    private readonly namespaces: Namespace[] = [];
    private description: string;

    /**
     * @param name Nome do data pack.
     * @param description Descrição exibida na lista de packs. Padrão: `"a mcdpl output"`.
     */
    constructor(
        private readonly name: string,
        description: string = "a mcdpl output",
    ) {
        this.description = description;
    }

    public getName(): string {
        return this.name;
    }
    public getDescription(): string {
        return this.description;
    }
    public setDescription(desc: string): this {
        this.description = desc;
        return this;
    }

    /** Cria um namespace, adiciona ao pack e o retorna. */
    public createNamespace(name: string): Namespace {
        const namespace = new Namespace(name);
        this.addNamespace(namespace);
        return namespace;
    }

    public addNamespace(namespace: Namespace): this {
        if (this.namespaces.some((existing) => existing.getName() === namespace.getName())) {
            throw new Error(
                `Namespace '${namespace.getName()}' already exists in data pack '${this.name}'`
            );
        }
        this.namespaces.push(namespace);
        return this;
    }

    public getNamespaces(): Namespace[] {
        return [...this.namespaces];
    }

    /**
     * Escreve o data pack em `at`.
     *
     * `at` é o diretório raiz do pack: recebe `pack.mcmeta` e a pasta `data/`.
     */
    public build(at: string): void {
        mkdirSync(at, { recursive: true });
        writeFileSync(join(at, "pack.mcmeta"), this.mcmeta(), "utf8");

        for (const namespace of this.namespaces) {
            namespace.build(join(at, "data", namespace.getName()));
        }
    }

    private mcmeta(): string {
        const pack = {
            description: this.description,
            min_format: DATA_PACK_FORMAT,
            max_format: DATA_PACK_FORMAT,
        };
        return `${JSON.stringify({ pack }, null, 2)}\n`;
    }
}

/** Pack format da Java Edition 26.3. */
export const DATA_PACK_FORMAT = 121;
