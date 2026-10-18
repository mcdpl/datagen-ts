import { FunctionTag } from "./FunctionTag";
import { Namespace } from "./Namespace";

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
    public readonly LOAD: FunctionTag;
    /** Functions executadas a cada tick (`#minecraft:tick`). */
    public readonly TICK: FunctionTag;

    public constructor() {
        super("minecraft");
        this.LOAD = new FunctionTag("load");
        this.TICK = new FunctionTag("tick");
        this.addTag(this.LOAD);
        this.addTag(this.TICK);
    }
}
