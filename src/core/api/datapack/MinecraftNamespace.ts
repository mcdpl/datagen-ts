import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { McFunction } from "../../McFunction";
import { Namespace } from "./Namespace";
import { Tag } from "./Tag";

/**
 * O namespace `minecraft` de um data pack.
 *
 * Além das functions normais, expõe as function tags `LOAD` e `TICK`,
 * usadas para rodar functions ao carregar o mundo e a cada tick.
 *
 * @see https://minecraft.wiki/w/Tag#Function_tags
 */
export class MinecraftNamespace extends Namespace {
    /** Functions executadas quando o data pack é carregado (`#minecraft:load`). */
    public readonly LOAD: Tag<McFunction>;
    /** Functions executadas a cada tick (`#minecraft:tick`). */
    public readonly TICK: Tag<McFunction>;

    public constructor() {
        super("minecraft");
        this.LOAD = new Tag("load");
        this.TICK = new Tag("tick");
    }

    public override build(at: string): void {
        super.build(at);

        const tagsDir = join(at, "tags", "function");
        for (const tag of [this.LOAD, this.TICK]) {
            const values = tag.get().map((fn) =>
                (fn.getIdentifier() ?? this.identify(fn.getName())).toString()
            );
            if (values.length === 0) continue;

            mkdirSync(tagsDir, { recursive: true });
            writeFileSync(
                join(tagsDir, `${tag.getName()}.json`),
                `${JSON.stringify({ values }, null, 2)}\n`,
                "utf8"
            );
        }
    }
}
