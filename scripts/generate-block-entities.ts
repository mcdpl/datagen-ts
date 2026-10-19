import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Gera os schemas de NBT dos block entities a partir dos arquivos `.mcdoc`
 * do projeto SpyglassMC/vanilla-mcdoc.
 *
 * Uso:
 *   bun scripts/generate-block-entities.ts
 *   bun scripts/generate-block-entities.ts --refresh
 *
 * Variáveis opcionais:
 *   MCDOC_TARGET_VERSION=26.3
 *   MCDOC_REF=<commit ou branch do vanilla-mcdoc>
 */

const TARGET_VERSION = process.env.MCDOC_TARGET_VERSION ?? "26.3";
const MCDOC_REF =
    process.env.MCDOC_REF ??
    "b6df528ff97017da5b665a6a303a37e1682c6f7e";
const MCDOC_DIR = "src/data/summary/block_entities";
const OUTPUT_PATH = "src/data/enums/BlockEntityData.ts";
const REFRESH = process.argv.includes("--refresh");

const MCDOC_FILES = [
    "banner", "beacon", "beehive", "brewing_stand", "brushable_block",
    "campfire", "chiseled_bookshelf", "command_block", "comparator", "conduit",
    "container", "crafter", "creaking_heart", "decorated_pot", "enchanting_table",
    "end_gateway", "furnace", "head", "jigsaw", "jukebox", "lectern", "mod",
    "moving_piston", "potent_sulfur", "sculk_catalyst", "sculk_sensor",
    "sculk_shrieker", "sign", "spawner", "structure_block", "test_block",
    "test_instance_block", "vault",
];

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type TokenKind = "ident" | "string" | "number" | "symbol" | "newline" | "eof";

interface Token {
    kind: TokenKind;
    value: string;
    line: number;
    column: number;
}

const isDigit = (char: string): boolean => char >= "0" && char <= "9";

const isIdentStart = (char: string): boolean =>
    (char >= "a" && char <= "z") ||
    (char >= "A" && char <= "Z") ||
    char === "_" ||
    char === "$";

const isIdentPart = (char: string): boolean => isIdentStart(char) || isDigit(char);

function unescapeString(source: string, start: number): { value: string; end: number } {
    let index = start + 1;
    let value = "";

    while (index < source.length) {
        const char = source[index]!;
        if (char === '"') {
            return { value, end: index + 1 };
        }
        if (char !== "\\") {
            value += char;
            index++;
            continue;
        }
        const escaped = source[index + 1];
        switch (escaped) {
            case "n": value += "\n"; index += 2; break;
            case "r": value += "\r"; index += 2; break;
            case "t": value += "\t"; index += 2; break;
            case '"': value += '"'; index += 2; break;
            case "\\": value += "\\"; index += 2; break;
            case "u": {
                const hex = source.slice(index + 2, index + 6);
                value += String.fromCharCode(Number.parseInt(hex, 16));
                index += 6;
                break;
            }
            default:
                value += escaped ?? "";
                index += 2;
                break;
        }
    }

    return { value, end: index };
}

function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let index = 0;
    let line = 1;
    let column = 1;

    const push = (kind: TokenKind, value: string, tokenLine = line, tokenColumn = column) => {
        tokens.push({ kind, value, line: tokenLine, column: tokenColumn });
    };

    while (index < source.length) {
        const char = source[index]!;

        if (char === "\r") { index++; continue; }

        if (char === "\n") {
            push("newline", "\n");
            index++; line++; column = 1;
            continue;
        }

        if (char === " " || char === "\t") { index++; column++; continue; }

        if (char === "/" && source[index + 1] === "/") {
            while (index < source.length && source[index] !== "\n") {
                index++; column++;
            }
            continue;
        }

        if (char === "/" && source[index + 1] === "*") {
            index += 2; column += 2;
            while (index < source.length) {
                if (source[index] === "*" && source[index + 1] === "/") {
                    index += 2; column += 2; break;
                }
                if (source[index] === "\n") { index++; line++; column = 1; }
                else { index++; column++; }
            }
            continue;
        }

        if (char === '"') {
            const tokenLine = line;
            const tokenColumn = column;
            const parsed = unescapeString(source, index);
            push("string", parsed.value, tokenLine, tokenColumn);
            column += parsed.end - index;
            index = parsed.end;
            continue;
        }

        if (isDigit(char) || (char === "-" && isDigit(source[index + 1] ?? ""))) {
            const tokenLine = line;
            const tokenColumn = column;
            let value = "";

            if (char === "-") { value += "-"; index++; column++; }
            while (index < source.length && isDigit(source[index]!)) {
                value += source[index]; index++; column++;
            }

            if (
                source[index] === "." &&
                source[index + 1] !== "." &&
                isDigit(source[index + 1] ?? "")
            ) {
                value += "."; index++; column++;
                while (index < source.length && isDigit(source[index]!)) {
                    value += source[index]; index++; column++;
                }
            }

            if (source[index] && /[bsLfd]/.test(source[index]!)) {
                value += source[index]; index++; column++;
            }

            push("number", value, tokenLine, tokenColumn);
            continue;
        }

        if (isIdentStart(char) || char === "%") {
            const tokenLine = line;
            const tokenColumn = column;
            let value = "";

            if (char === "%") { value += "%"; index++; column++; }
            while (index < source.length && isIdentPart(source[index]!)) {
                value += source[index]; index++; column++;
            }

            push("ident", value, tokenLine, tokenColumn);
            continue;
        }

        if (source.startsWith("...", index)) {
            push("symbol", "..."); index += 3; column += 3; continue;
        }
        if (source.startsWith("::", index)) {
            push("symbol", "::"); index += 2; column += 2; continue;
        }
        if (source.startsWith("..", index)) {
            push("symbol", ".."); index += 2; column += 2; continue;
        }

        push("symbol", char);
        index++; column++;
    }

    push("eof", "");
    return tokens;
}

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

interface Attribute {
    name: string;
    value?: string;
}

interface TypeBase {
    attrs: Attribute[];
}

type TypeExpr =
    | (TypeBase & { kind: "primitive"; name: string })
    | (TypeBase & { kind: "literal"; value: string | number | boolean })
    | (TypeBase & { kind: "ref"; name: string; args?: TypeExpr[] })
    | (TypeBase & { kind: "list"; element: TypeExpr })
    | (TypeBase & { kind: "object"; members: StructMember[] })
    | (TypeBase & { kind: "union"; members: TypeExpr[] })
    | (TypeBase & { kind: "intersection"; members: TypeExpr[] })
    | (TypeBase & { kind: "tagged"; name: string; keys: string[] })
    | (TypeBase & { kind: "unknown" });

type StructMember =
    | {
          kind: "field";
          name: string;
          optional: boolean;
          type: TypeExpr;
          attrs: Attribute[];
      }
    | {
          kind: "map";
          key: TypeExpr;
          value: TypeExpr;
          attrs: Attribute[];
      }
    | {
          kind: "spread";
          type: TypeExpr;
          attrs: Attribute[];
      };

interface StructDecl {
    kind: "struct";
    name: string;
    members: StructMember[];
    attrs: Attribute[];
}

interface TypeDecl {
    kind: "type";
    name: string;
    type: TypeExpr;
    attrs: Attribute[];
}

interface EnumMember {
    name: string;
    value: string | number | boolean;
    attrs: Attribute[];
}

interface EnumDecl {
    kind: "enum";
    name: string;
    enumType: string;
    members: EnumMember[];
    attrs: Attribute[];
}

type SymbolDecl = StructDecl | TypeDecl | EnumDecl;

interface Dispatch {
    typeName: string;
    keys: string[];
    target: TypeExpr;
    attrs: Attribute[];
}

interface Document {
    modulePath: string;
    sourceFile: string;
    structs: Map<string, StructDecl>;
    types: Map<string, TypeDecl>;
    enums: Map<string, EnumDecl>;
    imports: Map<string, string>;
    entityDispatches: Dispatch[];
    blockDispatches: Dispatch[];
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

class Parser {
    private index = 0;
    private currentDoc!: Document;

    constructor(
        private readonly tokens: Token[],
        private readonly sourceFile: string,
    ) {}

    public parse(): Document {
        const document: Document = {
            modulePath:
                this.sourceFile === "mod"
                    ? "java/world/block"
                    : `java/world/block/${this.sourceFile}`,
            sourceFile: this.sourceFile,
            structs: new Map(),
            types: new Map(),
            enums: new Map(),
            imports: new Map(),
            entityDispatches: [],
            blockDispatches: [],
        };

        this.currentDoc = document;

        while (!this.checkEof()) {
            this.skipNewlines();
            if (this.checkEof()) break;

            const attrs = this.parseAttributes();
            if (this.checkEof()) break;

            if (this.match("use")) this.parseUse(document);
            else if (this.match("struct")) this.parseStructDecl(document, attrs);
            else if (this.match("type")) this.parseTypeDecl(document, attrs);
            else if (this.match("enum")) this.parseEnumDecl(document, attrs);
            else if (this.match("dispatch")) this.parseDispatchDecl(document, attrs);
            else this.skipUnknown();
        }

        return document;
    }

    private current(): Token {
        return this.tokens[this.index]!;
    }

    private peek(offset = 1): Token {
        return this.tokens[this.index + offset]!;
    }

    private next(): Token {
        const token = this.current();
        if (!this.checkEof()) this.index++;
        return token;
    }

    private checkEof(): boolean {
        return this.current().kind === "eof";
    }

    private check(value: string): boolean {
        return this.current().value === value;
    }

    private checkNewline(): boolean {
        return this.current().kind === "newline";
    }

    private match(value: string): boolean {
        if (!this.check(value)) return false;
        this.next();
        return true;
    }

    private expect(value: string): void {
        if (!this.match(value)) {
            const token = this.current();
            throw new Error(
                `[${this.sourceFile}] esperava "${value}", encontrou "${token.value}" na linha ${token.line}`,
            );
        }
    }

    private expectIdent(): string {
        const token = this.current();
        if (token.kind !== "ident") {
            throw new Error(
                `[${this.sourceFile}] esperava um identificador, encontrou "${token.value}" na linha ${token.line}`,
            );
        }
        this.next();
        return token.value;
    }

    private skipNewlines(): void {
        while (this.current().kind === "newline") this.next();
    }

    private parseAttributes(): Attribute[] {
        const attrs: Attribute[] = [];
        this.skipNewlines();

        while (this.check("#") && this.peek().value === "[") {
            this.next();
            this.next();

            const raw: Token[] = [];
            let depth = 1;

            while (!this.checkEof()) {
                const token = this.next();
                if (token.value === "[") {
                    depth++;
                    raw.push(token);
                } else if (token.value === "]") {
                    depth--;
                    if (depth === 0) break;
                    raw.push(token);
                } else {
                    raw.push(token);
                }
            }

            const nameToken = raw.find((token) => token.kind === "ident");
            const equalsIndex = raw.findIndex((token) => token.value === "=");
            const valueToken = equalsIndex >= 0 ? raw[equalsIndex + 1] : undefined;

            if (nameToken) {
                attrs.push({ name: nameToken.value, value: valueToken?.value });
            }

            this.skipNewlines();
        }

        return attrs;
    }

    private parsePath(): string {
        let path = "";
        if (this.match("::")) path = "::";
        path += this.expectIdent();

        while (true) {
            if (this.match("::")) {
                path += "::" + this.expectIdent();
            } else if (this.match(":")) {
                path += ":" + this.expectIdent();
            } else {
                break;
            }
        }

        return path;
    }

    private parseTypeExpr(): TypeExpr {
        return this.parseUnion();
    }

    private parseUnion(): TypeExpr {
        const members: TypeExpr[] = [];

        while (true) {
            const attrs = this.parseAttributes();
            const member = this.parseIntersection();
            if (attrs.length > 0) member.attrs = [...attrs, ...member.attrs];
            members.push(member);

            this.skipNewlines();
            if (!this.match("|")) break;
            this.skipNewlines();
            if (
                this.check(")") ||
                this.check("]") ||
                this.check("}") ||
                this.check(",") ||
                this.checkEof()
            ) {
                break;
            }
        }

        return members.length === 1
            ? members[0]!
            : { kind: "union", members, attrs: [] };
    }

    private parseIntersection(): TypeExpr {
        const members: TypeExpr[] = [];

        while (true) {
            const attrs = this.parseAttributes();
            const member = this.parsePostfix();
            if (attrs.length > 0) member.attrs = [...attrs, ...member.attrs];
            members.push(member);

            this.skipNewlines();
            if (!this.match("&")) break;
            this.skipNewlines();
        }

        return members.length === 1
            ? members[0]!
            : { kind: "intersection", members, attrs: [] };
    }

    private parsePostfix(): TypeExpr {
        let type = this.parsePrimary();

        while (true) {
            if (this.check("[") && this.peek().value === "]") {
                this.next();
                this.next();
                type = { kind: "list", element: type, attrs: [] };
                continue;
            }

            if (this.check("@")) {
                this.next();
                while (
                    this.current().kind === "number" ||
                    this.check("..") ||
                    this.check("-") ||
                    this.check("+") ||
                    this.check(".")
                ) {
                    this.next();
                }
                continue;
            }

            break;
        }

        return type;
    }

    private parsePrimary(): TypeExpr {
        if (this.match("(")) {
            const inner = this.parseTypeExpr();
            this.expect(")");
            return inner;
        }

        if (this.match("[")) {
            const element = this.parseTypeExpr();
            this.expect("]");
            return { kind: "list", element, attrs: [] };
        }

        if (this.match("struct")) {
            if (this.current().kind === "ident") {
                const name = this.next().value;
                this.skipNewlines();
                if (this.check("{")) {
                    const body = this.parseStructBody();
                    this.currentDoc.structs.set(name, {
                        kind: "struct",
                        name,
                        members: body.members,
                        attrs: [],
                    });
                    return { kind: "ref", name, attrs: [] };
                }
                return { kind: "ref", name, attrs: [] };
            }

            const body = this.parseStructBody();
            return { kind: "object", members: body.members, attrs: [] };
        }

        if (this.current().kind === "string") {
            return { kind: "literal", value: this.next().value, attrs: [] };
        }

        if (this.current().kind === "number") {
            return {
                kind: "literal",
                value: parseNumber(this.next().value),
                attrs: [],
            };
        }

        if (this.check("true") || this.check("false")) {
            return {
                kind: "literal",
                value: this.next().value === "true",
                attrs: [],
            };
        }

        if (this.current().kind === "ident") {
            const name = this.parsePath();
            let args: TypeExpr[] | undefined;

            if (this.match("<")) {
                args = [];
                while (!this.check(">")) {
                    args.push(this.parseTypeExpr());
                    if (!this.match(",")) break;
                }
                this.expect(">");
            }

            if (this.check("[") && this.peek().value !== "]") {
                return { kind: "tagged", name, keys: this.parseTaggedKeys(), attrs: [] };
            }

            return { kind: "ref", name, args, attrs: [] };
        }

        this.next();
        return { kind: "unknown", attrs: [] };
    }

    private parseStructBody(): { members: StructMember[] } {
        this.expect("{");
        const members: StructMember[] = [];

        while (!this.check("}") && !this.checkEof()) {
            this.skipNewlines();
            if (this.check("}")) break;

            const attrs = this.parseAttributes();

            if (this.match("...")) {
                members.push({
                    kind: "spread",
                    type: this.parseTypeExpr(),
                    attrs,
                });
            } else if (this.match("[")) {
                const key = this.parseTypeExpr();
                this.expect("]");
                this.expect(":");
                const value = this.parseTypeExpr();
                members.push({ kind: "map", key, value, attrs });
            } else {
                const name = this.parseFieldName();
                const optional = this.match("?");
                this.expect(":");
                const type = this.parseTypeExpr();
                members.push({ kind: "field", name, optional, type, attrs });
            }

            this.skipNewlines();
            this.match(",");
            this.match(";");
        }

        this.expect("}");
        return { members };
    }

    private parseFieldName(): string {
        if (this.current().kind === "string") return this.next().value;
        return this.expectIdent();
    }

    private parseTaggedKeys(): string[] {
        this.expect("[");
        const keys: string[] = [];
        let depth = 1;

        while (!this.checkEof()) {
            const token = this.next();
            if (token.value === "[") {
                depth++;
            } else if (token.value === "]") {
                depth--;
                if (depth === 0) break;
            } else if (
                depth === 1 &&
                (token.kind === "ident" ||
                    token.kind === "string" ||
                    token.kind === "number")
            ) {
                keys.push(token.value);
            }
        }

        return keys;
    }

    private parseUse(document: Document): void {
        const path = this.parsePath();
        let alias = path.split("::").pop() ?? path;
        if (this.match("as")) alias = this.expectIdent();
        document.imports.set(alias, path);
        this.skipToNewline();
    }

    private parseStructDecl(document: Document, attrs: Attribute[]): void {
        const name = this.expectIdent();
        const body = this.parseStructBody();
        document.structs.set(name, {
            kind: "struct",
            name,
            members: body.members,
            attrs,
        });
    }

    private parseTypeDecl(document: Document, attrs: Attribute[]): void {
        const name = this.expectIdent();
        this.expect("=");
        const type = this.parseTypeExpr();
        document.types.set(name, { kind: "type", name, type, attrs });
    }

    private parseEnumDecl(document: Document, attrs: Attribute[]): void {
        this.expect("(");
        const enumType = this.expectIdent();
        this.expect(")");
        const name = this.expectIdent();
        this.expect("{");

        const members: EnumMember[] = [];

        while (!this.check("}") && !this.checkEof()) {
            this.skipNewlines();
            if (this.check("}")) break;

            const memberAttrs = this.parseAttributes();
            const memberName = this.expectIdent();
            this.expect("=");
            const value = this.parseLiteralValue();
            members.push({ name: memberName, value, attrs: memberAttrs });

            this.skipNewlines();
            this.match(",");
            this.match(";");
        }

        this.expect("}");
        document.enums.set(name, {
            kind: "enum",
            name,
            enumType,
            members,
            attrs,
        });
    }

    private parseLiteralValue(): string | number | boolean {
        if (this.current().kind === "string") return this.next().value;
        if (this.current().kind === "number") return parseNumber(this.next().value);
        if (this.check("true") || this.check("false")) {
            return this.next().value === "true";
        }
        if (this.match("-")) return -parseNumber(this.next().value);
        return this.next().value;
    }

    private parseDispatchDecl(document: Document, attrs: Attribute[]): void {
        const typeName = this.parsePath();
        this.expect("[");

        const keys: string[] = [];
        while (!this.check("]") && !this.checkEof()) {
            this.skipNewlines();
            if (this.check("]")) break;

            const token = this.next();
            if (
                token.kind === "ident" ||
                token.kind === "string" ||
                token.kind === "number"
            ) {
                keys.push(token.value);
            }

            if (!this.match(",")) break;
        }

        this.expect("]");
        this.expect("to");
        const target = this.parseTypeExpr();
        const dispatch: Dispatch = { typeName, keys, target, attrs };

        if (typeName === "minecraft:block_entity") {
            document.entityDispatches.push(dispatch);
        } else if (typeName === "minecraft:block") {
            document.blockDispatches.push(dispatch);
        }
    }

    private skipUnknown(): void {
        if (this.check("{")) {
            let depth = 0;
            while (!this.checkEof()) {
                const token = this.next();
                if (token.value === "{") depth++;
                else if (token.value === "}") {
                    depth--;
                    if (depth === 0) break;
                }
            }
            return;
        }
        this.skipToNewline();
    }

    private skipToNewline(): void {
        while (!this.checkEof() && !this.checkNewline()) this.next();
    }
}

function parseNumber(value: string): number {
    return Number(value.replace(/[bsLfd]$/, ""));
}

// ---------------------------------------------------------------------------
// Version filtering
// ---------------------------------------------------------------------------

function parseVersion(version: string): [number, number, number] {
    const match = version.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    if (!match) return [0, 0, 0];
    return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

function compareVersion(left: string, right: string): number {
    const a = parseVersion(left);
    const b = parseVersion(right);
    for (let index = 0; index < 3; index++) {
        const difference = a[index]! - b[index]!;
        if (difference !== 0) return difference;
    }
    return 0;
}

function isActive(attrs: Attribute[], targetVersion: string): boolean {
    for (const attr of attrs) {
        if (attr.name === "since" && attr.value && compareVersion(targetVersion, attr.value) < 0) {
            return false;
        }
        if (attr.name === "until" && attr.value && compareVersion(targetVersion, attr.value) >= 0) {
            return false;
        }
    }
    return true;
}

// ---------------------------------------------------------------------------
// Symbol resolution / generation
// ---------------------------------------------------------------------------

interface SymbolInfo {
    decl: SymbolDecl;
    document: Document;
    generatedName: string;
}

interface GenerationContext {
    modules: Map<string, Document>;
    symbolsByDocument: Map<Document, Map<string, SymbolInfo>>;
    symbolsByName: Map<string, SymbolInfo[]>;
    symbolsByGeneratedName: Map<string, SymbolInfo>;
    entityTargets: Map<string, { document: Document; target: TypeExpr }>;
    targetVersion: string;
}

const sanitizeName = (name: string): string =>
    name.replace(/[^A-Za-z0-9_$]/g, "_");

function pascalCase(name: string): string {
    return name
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map((part) => part[0]!.toUpperCase() + part.slice(1))
        .join("");
}

function generatedNameFor(
    decl: SymbolDecl,
    document: Document,
    duplicateNames: Set<string>,
): string {
    if (decl.name === "BlockEntity") return "BlockEntityBase";
    if (decl.name === "BlockEntityData") return "BlockEntityDataStruct";

    const base = `BlockEntity${sanitizeName(decl.name)}`;
    if (!duplicateNames.has(decl.name)) return base;

    const moduleName = document.modulePath.split("/").pop() ?? "Block";
    return `BlockEntity${pascalCase(moduleName)}${sanitizeName(decl.name)}`;
}

function resolvePath(
    context: GenerationContext,
    document: Document,
    path: string,
): SymbolInfo | undefined {
    const parts = path.split("::");
    if (parts[0] === "") parts.shift();
    if (parts[0] !== "super") return undefined;
    parts.shift();

    const symbolName = parts.pop();
    if (!symbolName) return undefined;

    const parent = document.modulePath.split("/").slice(0, -1);
    const modulePath = [...parent, ...parts].join("/");
    const targetDocument = context.modules.get(modulePath);
    if (!targetDocument) return undefined;

    return context.symbolsByDocument.get(targetDocument)?.get(symbolName);
}

function resolveSymbol(
    context: GenerationContext,
    document: Document,
    name: string,
): SymbolInfo | undefined {
    if (name.startsWith("::")) return undefined;
    if (name.startsWith("super::")) return resolvePath(context, document, name);
    if (name.includes(":") && !name.includes("::")) return undefined;

    const imported = document.imports.get(name);
    if (imported) return resolvePath(context, document, imported);

    const local = context.symbolsByDocument.get(document)?.get(name);
    if (local) return local;

    const global = context.symbolsByName.get(name);
    if (global?.length === 1) return global[0];

    return undefined;
}

function typeIncludesBase(
    context: GenerationContext,
    document: Document,
    type: TypeExpr,
    seen: Set<string>,
): boolean {
    switch (type.kind) {
        case "ref": {
            if ((type.name.split("::").pop() ?? type.name) === "BlockEntity") {
                return true;
            }
            const symbol = resolveSymbol(context, document, type.name);
            return symbol ? symbolIncludesBase(context, symbol, seen) : false;
        }
        case "object":
            return membersIncludeBase(context, document, type.members, seen);
        case "union":
        case "intersection":
            return type.members.some((member) =>
                typeIncludesBase(context, document, member, seen),
            );
        default:
            return false;
    }
}

function membersIncludeBase(
    context: GenerationContext,
    document: Document,
    members: StructMember[],
    seen: Set<string>,
): boolean {
    for (const member of members) {
        if (!isActive(member.attrs, context.targetVersion)) continue;
        if (
            member.kind === "spread" &&
            typeIncludesBase(context, document, member.type, seen)
        ) {
            return true;
        }
    }
    return false;
}

function symbolIncludesBase(
    context: GenerationContext,
    symbol: SymbolInfo,
    seen = new Set<string>(),
): boolean {
    if (seen.has(symbol.generatedName)) return false;
    seen.add(symbol.generatedName);

    if (symbol.decl.name === "BlockEntity") return true;

    if (symbol.decl.kind === "struct") {
        return membersIncludeBase(
            context,
            symbol.document,
            symbol.decl.members,
            seen,
        );
    }

    if (symbol.decl.kind === "type") {
        return typeIncludesBase(context, symbol.document, symbol.decl.type, seen);
    }

    return false;
}

const propertyName = (name: string): string =>
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);

const needsParentheses = (type: string): boolean =>
    type.includes(" | ") || type.includes(" & ");

const DYE_COLORS =
    '"white" | "orange" | "magenta" | "light_blue" | "yellow" | "lime" | ' +
    '"pink" | "gray" | "light_gray" | "cyan" | "purple" | "blue" | ' +
    '"brown" | "green" | "red" | "black"';

const DIRECTIONS = '"down" | "up" | "north" | "south" | "west" | "east"';

const EQUIPMENT_SLOTS =
    '"mainhand" | "offhand" | "head" | "chest" | "legs" | "feet" | ' +
    '"body" | "saddle"';

const SIMPLE_EXTERNALS: Record<string, string> = {
    string: "string",
    boolean: "boolean",
    byte: "number",
    short: "number",
    int: "number",
    long: "number",
    float: "number",
    double: "number",
    any: "NbtValue",
    Text: "NbtValue",
    ItemStack: "NbtValue",
    ItemPredicate: "NbtValue",
    DataComponentPatch: "NbtValue",
    BlockState: "string",
    DyeColor: DYE_COLORS,
    DyeColorInt: "number",
    DyeColorByte: "number",
    Direction: DIRECTIONS,
    DirectionInt: "number",
    DirectionByte: "number",
    Rotation: "string",
    EquipmentSlot: EQUIPMENT_SLOTS,
    EffectId: "string",
    BannerPattern: "NbtValue",
    Profile: "NbtValue",
    AnyEntity: "NbtValue",
    TrialSpawnerConfig: "NbtValue",
    WeightedEntry: "NbtValue",
    VibrationListener: "NbtValue",
    PotDecorations: "NbtValue",
    SignText: "NbtValue",
    "minecraft:block_entity": "NbtValue",
    "minecraft:data_component": "NbtValue",
};

function resolveObject(
    context: GenerationContext,
    document: Document,
    members: StructMember[],
): string {
    const fields: string[] = [];
    const intersections: string[] = [];

    for (const member of members) {
        if (!isActive(member.attrs, context.targetVersion)) continue;

        if (member.kind === "field") {
            fields.push(
                `${propertyName(member.name)}${member.optional ? "?" : ""}: ` +
                    `${resolveType(context, document, member.type)};`,
            );
        } else if (member.kind === "map") {
            intersections.push(
                `Record<string, ${resolveType(context, document, member.value)}>`,
            );
        } else {
            const spread = resolveType(context, document, member.type);
            if (spread === "{}" || spread === "never") continue;
            intersections.push(needsParentheses(spread) ? `(${spread})` : spread);
        }
    }

    const object = fields.length > 0 ? `{ ${fields.join(" ")} }` : "{}";
    if (intersections.length === 0) return object;
    if (fields.length === 0) return intersections.join(" & ");
    return [object, ...intersections].join(" & ");
}

function resolveExternal(
    context: GenerationContext,
    document: Document,
    name: string,
    args?: TypeExpr[],
): string {
    const shortName = name.split("::").pop() ?? name;

    if (shortName === "SlottedItem") {
        const slot = args?.[0] ? resolveType(context, document, args[0]) : "number";
        return `BlockEntitySlottedItem<${slot}>`;
    }

    if (shortName === "InclusiveRange") {
        const value = args?.[0] ? resolveType(context, document, args[0]) : "number";
        return `{ min?: ${value}; max?: ${value} }`;
    }

    if (shortName === "%none") return "never";
    if (shortName === "%unknown") return "NbtValue";

    return SIMPLE_EXTERNALS[shortName] ?? "NbtValue";
}

function resolveType(
    context: GenerationContext,
    document: Document,
    expression: TypeExpr,
): string {
    if (!isActive(expression.attrs, context.targetVersion)) return "never";

    switch (expression.kind) {
        case "primitive":
            return SIMPLE_EXTERNALS[expression.name] ?? "NbtValue";

        case "literal":
            return typeof expression.value === "string"
                ? JSON.stringify(expression.value)
                : String(expression.value);

        case "ref": {
            if (expression.name === "BlockEntityData") return "NbtValue";
            const symbol = resolveSymbol(context, document, expression.name);
            if (symbol) {
                if (symbol.decl.name === "BlockEntityData") return "NbtValue";
                return symbol.generatedName;
            }
            return resolveExternal(context, document, expression.name, expression.args);
        }

        case "list": {
            const element = resolveType(context, document, expression.element);
            return `${needsParentheses(element) ? `(${element})` : element}[]`;
        }

        case "object":
            return resolveObject(context, document, expression.members);

        case "union": {
            const parts = expression.members
                .filter((member) => isActive(member.attrs, context.targetVersion))
                .map((member) => resolveType(context, document, member));
            return parts.length > 0 ? parts.join(" | ") : "never";
        }

        case "intersection": {
            const parts = expression.members
                .filter((member) => isActive(member.attrs, context.targetVersion))
                .map((member) => {
                    const resolved = resolveType(context, document, member);
                    return needsParentheses(resolved) ? `(${resolved})` : resolved;
                });
            return parts.length > 0 ? parts.join(" & ") : "never";
        }

        case "tagged":
            return "NbtValue";

        case "unknown":
            return "NbtValue";
    }
}

function resolveBlockTarget(
    context: GenerationContext,
    document: Document,
    target: TypeExpr,
): string {
    if (!isActive(target.attrs, context.targetVersion)) return "never";

    if (target.kind === "union") {
        const parts = target.members
            .filter((member) => isActive(member.attrs, context.targetVersion))
            .map((member) => resolveBlockTarget(context, document, member));
        return parts.length > 0 ? parts.join(" | ") : "never";
    }

    if (target.kind === "tagged" && target.name.endsWith("block_entity")) {
        const key = target.keys[0];
        const entity = key ? context.entityTargets.get(key) : undefined;
        if (entity) return resolveType(context, entity.document, entity.target);
        return "BlockEntityBase";
    }

    if (target.kind === "ref") {
        const symbol = resolveSymbol(context, document, target.name);
        if (symbol) {
            if (symbol.decl.name === "BlockEntity") return "BlockEntityBase";
            return symbol.generatedName;
        }
        if ((target.name.split("::").pop() ?? target.name) === "BlockEntity") {
            return "BlockEntityBase";
        }
    }

    return resolveType(context, document, target);
}

async function ensureMcdocFiles(): Promise<void> {
    mkdirSync(MCDOC_DIR, { recursive: true });

    const missing = MCDOC_FILES.filter(
        (file) => REFRESH || !existsSync(join(MCDOC_DIR, `${file}.mcdoc`)),
    );

    if (missing.length === 0) {
        console.log(`Usando ${MCDOC_FILES.length} arquivos mcdoc locais.`);
        return;
    }

    console.log(`Baixando ${missing.length} arquivo(s) mcdoc de ${MCDOC_REF}...`);

    await Promise.all(
        missing.map(async (file) => {
            const url =
                `https://raw.githubusercontent.com/SpyglassMC/vanilla-mcdoc/` +
                `${MCDOC_REF}/java/world/block/${file}.mcdoc`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Falha ao baixar ${url}: ${response.status}`);
            }
            writeFileSync(join(MCDOC_DIR, `${file}.mcdoc`), await response.text());
        }),
    );
}

function buildContext(documents: Document[]): GenerationContext {
    const modules = new Map<string, Document>();
    const symbolsByDocument = new Map<Document, Map<string, SymbolInfo>>();
    const symbolsByName = new Map<string, SymbolInfo[]>();
    const symbolsByGeneratedName = new Map<string, SymbolInfo>();

    const allDecls: Array<{ decl: SymbolDecl; document: Document }> = [];

    for (const document of documents) {
        modules.set(document.modulePath, document);
        for (const decl of document.structs.values()) {
            allDecls.push({ decl, document });
        }
        for (const decl of document.types.values()) {
            allDecls.push({ decl, document });
        }
        for (const decl of document.enums.values()) {
            allDecls.push({ decl, document });
        }
    }

    const nameCounts = new Map<string, number>();
    for (const { decl } of allDecls) {
        nameCounts.set(decl.name, (nameCounts.get(decl.name) ?? 0) + 1);
    }
    const duplicateNames = new Set(
        [...nameCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name),
    );

    for (const document of documents) {
        symbolsByDocument.set(document, new Map());
    }

    for (const { decl, document } of allDecls) {
        const info: SymbolInfo = {
            decl,
            document,
            generatedName: generatedNameFor(decl, document, duplicateNames),
        };
        symbolsByDocument.get(document)?.set(decl.name, info);
        symbolsByGeneratedName.set(info.generatedName, info);
        const list = symbolsByName.get(decl.name) ?? [];
        list.push(info);
        symbolsByName.set(decl.name, list);
    }

    const context: GenerationContext = {
        modules,
        symbolsByDocument,
        symbolsByName,
        symbolsByGeneratedName,
        entityTargets: new Map(),
        targetVersion: TARGET_VERSION,
    };

    for (const document of documents) {
        for (const dispatch of document.entityDispatches) {
            if (!isActive(dispatch.attrs, TARGET_VERSION)) continue;
            for (const key of dispatch.keys) {
                context.entityTargets.set(key, {
                    document,
                    target: dispatch.target,
                });
            }
        }
    }

    return context;
}

function generateDeclarations(
    context: GenerationContext,
    documents: Document[],
): string[] {
    const lines: string[] = [];
    const infos: SymbolInfo[] = [];

    for (const document of documents) {
        for (const info of context.symbolsByDocument.get(document)?.values() ?? []) {
            if (info.decl.name === "BlockEntityData") continue;
            infos.push(info);
        }
    }

    infos.sort((left, right) => {
        if (left.generatedName === "BlockEntityBase") return -1;
        if (right.generatedName === "BlockEntityBase") return 1;
        return left.generatedName.localeCompare(right.generatedName);
    });

    for (const info of infos) {
        const decl = info.decl;

        if (decl.kind === "struct") {
            lines.push(
                `export type ${info.generatedName} = ` +
                    `${resolveObject(context, info.document, decl.members)};`,
            );
        } else if (decl.kind === "type") {
            lines.push(
                `export type ${info.generatedName} = ` +
                    `${resolveType(context, info.document, decl.type)};`,
            );
        } else {
            const activeMembers = decl.members.filter((member) =>
                isActive(member.attrs, context.targetVersion),
            );
            let body = "number";

            if (decl.enumType === "string") {
                const values = activeMembers
                    .filter((member) => typeof member.value === "string")
                    .map((member) => JSON.stringify(member.value));
                body = values.length > 0 ? values.join(" | ") : "never";
            }

            lines.push(`export type ${info.generatedName} = ${body};`);
        }

        lines.push("");
    }

    return lines;
}

function generateBlockMap(
    context: GenerationContext,
    documents: Document[],
): string[] {
    const schemas = new Map<string, string>();

    for (const document of documents) {
        for (const dispatch of document.blockDispatches) {
            if (!isActive(dispatch.attrs, context.targetVersion)) continue;
            const resolved = resolveBlockTarget(context, document, dispatch.target);

            let schema: string;
            if (resolved === "never" || resolved === "{}") {
                schema = "{}";
            } else if (
                resolved === "BlockEntityBase" ||
                resolved.startsWith("BlockEntityBase &")
            ) {
                schema = resolved;
            } else {
                const direct = context.symbolsByGeneratedName.get(resolved);
                schema =
                    direct && symbolIncludesBase(context, direct)
                        ? resolved
                        : `BlockEntityBase & ${
                              needsParentheses(resolved) ? `(${resolved})` : resolved
                          }`;
            }

            for (const key of dispatch.keys) {
                if (key.startsWith("%")) continue;
                schemas.set(key, schema);
            }
        }
    }

    const lines = [
        "export type BlockEntityDataByBlock = {",
        "    [key: string]: {};",
    ];

    for (const key of [...schemas.keys()].sort()) {
        lines.push(`    ${propertyName(key)}: ${schemas.get(key)};`);
    }

    lines.push("};", "");
    return lines;
}

async function main(): Promise<void> {
    await ensureMcdocFiles();

    const documents = MCDOC_FILES.map((file) => {
        const source = readFileSync(join(MCDOC_DIR, `${file}.mcdoc`), "utf8");
        return new Parser(tokenize(source), file).parse();
    });

    const context = buildContext(documents);
    const declarations = generateDeclarations(context, documents);
    const blockMap = generateBlockMap(context, documents);

    const output = [
        "// Gerado por scripts/generate-block-entities.ts",
        `// Fonte: SpyglassMC/vanilla-mcdoc (${MCDOC_REF})`,
        `// Alvo: Minecraft Java ${TARGET_VERSION}`,
        "// Não edite manualmente.",
        "",
        'import type { NbtValue } from "../utils/holder/Block";',
        "",
        "export type BlockEntitySlottedItem<T = number> = NbtValue & { Slot?: T };",
        "",
        ...declarations,
        ...blockMap,
    ].join("\n");

    writeFileSync(OUTPUT_PATH, output);

    const blockCount = blockMap.filter((line) => line.includes(":") && !line.includes("[key:")).length;
    console.log(`Gerado ${OUTPUT_PATH}`);
    console.log(`  ${context.symbolsByDocument.size} arquivos analisados`);
    console.log(`  ${blockCount} blocos com dados de block entity`);
}

await main();

