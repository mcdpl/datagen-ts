import { readFileSync, writeFileSync } from "node:fs";

type ItemComponentMap = Record<string, Record<string, unknown>>;

const ITEM_COMPONENTS_PATH = "src/data/summary/item_components/data.json";
const OUTPUT_PATH = "src/data/enums/Items.ts";

const items = JSON.parse(
    readFileSync(ITEM_COMPONENTS_PATH, "utf8"),
) as ItemComponentMap;

function toConstantName(path: string): string {
    const name = path
        .replaceAll("/", "_")
        .replaceAll(".", "_")
        .replaceAll("-", "_")
        .toUpperCase();

    return /^[0-9]/.test(name) ? `_${name}` : name;
}

function componentType(values: unknown[]): string {
    const types = new Set(
        values.map((value) => {
            if (value === null) return "null";
            if (Array.isArray(value)) return "array";
            return typeof value;
        }),
    );

    if (types.size !== 1) return "JsonValue";

    switch ([...types][0]) {
        case "string": {
            const unique = [...new Set(values as string[])].sort();

            return unique.length > 1 && unique.length <= 20
                ? unique.map((value) => JSON.stringify(value)).join(" | ")
                : "string";
        }
        case "number":
            return "number";
        case "boolean":
            return "boolean";
        case "array":
            return "JsonValue[]";
        case "object":
            return "JsonObject";
        case "null":
            return "null";
        default:
            return "JsonValue";
    }
}

const componentValues = new Map<string, unknown[]>();
for (const components of Object.values(items)) {
    for (const [key, value] of Object.entries(components)) {
        const values = componentValues.get(key);
        if (values) {
            values.push(value);
        } else {
            componentValues.set(key, [value]);
        }
    }
}

const componentTypes = [...componentValues.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => `    ${JSON.stringify(key)}: ${componentType(values)};`);

const usedNames = new Map<string, string>();
const entries = Object.entries(items).map(([id, components]) => {
    const [namespace, path] = id.includes(":")
        ? id.split(":", 2)
        : ["minecraft", id];

    if (!namespace || !path) {
        throw new Error(`Invalid item identifier: ${id}`);
    }

    const name = toConstantName(path);
    const existing = usedNames.get(name);
    if (existing) {
        throw new Error(`Duplicate item constant '${name}' for '${existing}' and '${id}'`);
    }
    usedNames.set(name, id);

    return `    public static readonly ${name} = new Item<ItemComponents>(Identifier.of(${JSON.stringify(namespace)}, ${JSON.stringify(path)}), ${JSON.stringify(components)});`;
});

const output = `import { Identifier } from "../../core/utils/Identifier";
import { Item } from "../utils/holder/Item";

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

/** Componentes padrão dos itens da 26.3. */
export interface ItemComponents {
${componentTypes.join("\n")}
}

export class Items {
${entries.join("\n")}
}
`;

writeFileSync(OUTPUT_PATH, output);
