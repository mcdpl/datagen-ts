import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { McFunction } from "../../McFunction";
import { Identifier } from "../../utils/Identifier";

/**
 * Um namespace de data pack (`data/<namespace>`).
 *
 * Agrupa arquivos de um mesmo namespace e sabe escrevê-los em disco.
 */
export class Namespace {
    /** Namespace vanilla (`minecraft`). */
    public static readonly MINECRAFT = new Namespace("minecraft");

    private readonly functions: McFunction[] = [];

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
        return this;
    }

    public getFunctions(): McFunction[] {
        return [...this.functions];
    }

    /**
     * Escreve o conteúdo do namespace em `at`.
     *
     * `at` é o diretório do namespace (normalmente `<datapack>/data/<namespace>`);
     * as functions vão para `at/function/<name>.mcfunction`.
     */
    public build(at: string): void {
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
}
