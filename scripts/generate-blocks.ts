import { readFileSync, writeFileSync } from "node:fs";

const blocks: string[] = JSON.parse(readFileSync("src/data/registries/block/data.json").toString());

const properties = blocks.map((id) => {
    const [namespace, path] = id.split(":");

    if (!namespace || !path) {
        throw new Error(`Invalid block identifier: ${id}`);
    }

    const name = path
        .replaceAll("/", "_")
        .replaceAll(".", "_")
        .replaceAll("-", "_")
        .toUpperCase();

    return `    public static readonly ${name} = new Block(Identifier.of(${JSON.stringify(namespace)}, ${JSON.stringify(path)}));`;
});

const output = `import { Identifier } from "../../core/utils/Identifier";
import { Block } from "../utils/holder/Block";

export class Blocks {
${properties.join("\n")}
}
`;

writeFileSync("src/data/enums/Blocks.ts", output);