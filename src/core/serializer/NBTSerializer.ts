import { parse, stringify } from "nbt-ts";

export class NbtSerializer {
    public static parse(
        snbt: string
    ): ReturnType<typeof parse> {
        return parse(snbt);
    }

    public static stringify(
        value: Parameters<typeof stringify>[0]
    ): string {
        return stringify(value);
    }
}