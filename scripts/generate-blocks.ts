import { readFileSync, writeFileSync } from "node:fs";

/** `[properties, defaults]`, no formato do `26.3-summary/blocks`. */
type BlockStateFormat = [
    properties: Record<string, string[]>,
    defaults: Record<string, string>,
];

const BLOCK_REGISTRY_PATH = "src/data/registries/block/data.json";
const BLOCK_STATES_PATH = "src/data/summary/blocks/data.min.json";
const OUTPUT_PATH = "src/data/enums/Blocks.ts";

const blocks: string[] = JSON.parse(readFileSync(BLOCK_REGISTRY_PATH, "utf8"));
const stateFormats = JSON.parse(
    readFileSync(BLOCK_STATES_PATH, "utf8"),
) as Record<string, BlockStateFormat>;

function toConstantName(path: string): string {
    const name = path
        .replaceAll("/", "_")
        .replaceAll(".", "_")
        .replaceAll("-", "_")
        .toUpperCase();

    return /^[0-9]/.test(name) ? `_${name}` : name;
}

function toTypeKey(key: string): string {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function toStateType(properties: Record<string, string[]>): string {
    const fields = Object.entries(properties).map(([key, values]) => {
        const union = values.map((value) => JSON.stringify(value)).join(" | ");
        return `${toTypeKey(key)}: ${union}`;
    });

    return fields.length === 0 ? "{}" : `{ ${fields.join("; ")} }`;
}

const properties = blocks.map((id) => {
    const [namespace, path] = id.includes(":")
        ? id.split(":", 2)
        : ["minecraft", id];

    if (!namespace || !path) {
        throw new Error(`Invalid block identifier: ${id}`);
    }

    const format = stateFormats[path];
    if (!format) {
        throw new Error(`No block state format for: ${id}`);
    }

    const [stateProperties] = format;
    const name = toConstantName(path);
    const stateType = toStateType(stateProperties);

    return `    public static readonly ${name} = new Block<${stateType}, BlockEntityDataByBlock[${JSON.stringify(path)}]>(Identifier.of(${JSON.stringify(namespace)}, ${JSON.stringify(path)}));`;
});

const output = `import { Identifier } from "../../core/utils/Identifier";
import { Block } from "../utils/holder/Block";
import type { BlockEntityDataByBlock } from "./BlockEntityData";

export class Blocks {
${properties.join("\n")}
}
`;

writeFileSync(OUTPUT_PATH, output);
