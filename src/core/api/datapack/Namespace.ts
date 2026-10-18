import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { McFunction } from "../../McFunction";
import { Identifier } from "../../utils/Identifier";
import type { TagLike } from "./Tag";

/**
 * Um namespace de data pack (`data/<namespace>`).
 *
 * Agrupa functions e tags de um mesmo namespace e sabe escrevê-las em disco.
 */
export class Namespace {
    /** Namespace vanilla (`minecraft`). */
    public static readonly MINECRAFT = new Namespace("minecraft");

    private readonly functions: McFunction[] = [];
    private readonly tags: TagLike[] = [];

    constructor(private readonly name: string) {}

    public getName(): string {
        return this.name;
    }

    /** Cria um `Identifier` dentro deste namespace. */
    public identify(path: string): Identifier {
        return Identifier.of(this.name, path);
    }

    /** Cria uma function, adiciona ao namespace e a retorna. */
    public createFunction(name: string): McFunction {
        const fn = new McFunction(name);
        this.addFunction(fn);
        return fn;
    }

    public addFunction(fn: McFunction): this {
        if (this.functions.some((existing) => existing.getName() === fn.getName())) {
            throw new Error(
                `Function '${fn.getName()}' already exists in namespace '${this.name}'`
            );
        }
        this.functions.push(fn);
        fn.setNamespace(this.name);
        return this;
    }

    public getFunctions(): McFunction[] {
        return [...this.functions];
    }

    /**
     * Adiciona uma tag ao namespace.
     *
     * Tags de tipos diferentes podem ter o mesmo nome; a duplicidade
     * é verificada por `tipo + nome`.
     */
    public addTag(tag: TagLike): this {
        const exists = this.tags.some(
            (existing) =>
                existing.getName() === tag.getName() &&
                existing.getType() === tag.getType()
        );
        if (exists) {
            throw new Error(
                `Tag '${tag.getType()}/${tag.getName()}' already exists in namespace '${this.name}'`
            );
        }
        this.tags.push(tag);
        return this;
    }

    public getTags(): TagLike[] {
        return [...this.tags];
    }

    /** Remove uma tag. Retorna `true` se ela existia no namespace. */
    public removeTag(tag: TagLike): boolean {
        const index = this.tags.indexOf(tag);
        if (index === -1) return false;
        this.tags.splice(index, 1);
        return true;
    }

    /**
     * Escreve o conteúdo do namespace em `at`.
     *
     * `at` é o diretório do namespace (normalmente `<datapack>/data/<namespace>`);
     * as functions vão para `at/function/<name>.mcfunction` e as tags para
     * `at/tags/<tipo>/<name>.json`.
     */
    public build(at: string): void {
        this.buildFunctions(at);
        this.buildTags(at);
    }

    private buildFunctions(at: string): void {
        if (this.functions.length === 0) return;

        const functionDir = join(at, "function");
        mkdirSync(functionDir, { recursive: true });

        for (const fn of this.functions) {
            const file = join(functionDir, `${fn.getName()}.mcfunction`);
            mkdirSync(dirname(file), { recursive: true });

            const content = fn.serialize();
            const trailingNewline = content.length === 0 || content.endsWith("\n") ? "" : "\n";
            writeFileSync(file, `${content}${trailingNewline}`, "utf8");
        }
    }

    private buildTags(at: string): void {
        for (const tag of this.tags) {
            const values = tag.getValues(this.name);
            if (values.length === 0) continue;

            const tagDir = join(at, "tags", tag.getType());
            mkdirSync(tagDir, { recursive: true });

            writeFileSync(
                join(tagDir, `${tag.getName()}.json`),
                `${JSON.stringify({ values }, null, 2)}\n`,
                "utf8"
            );
        }
    }
}
