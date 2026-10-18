#!/usr/bin/env bun
/**
 * web-fetch — cached, filtered fetching for agents.
 * Zero dependencies. Uses Bun's built-in HTMLRewriter for CSS selection.
 *
 * Commands:
 *   wiki <title>          wikitext  (--html, --section N, --sections, --plain)
 *   search <query>        wiki search (--limit N, --snippets)
 *   batch <title...>      wikitext of up to 50 pages in one request
 *   mcmeta <path>         vanilla data from misode/mcmeta (--ref, --version, --pin, --list)
 *   version               current mcmeta version + branch heads
 *   get <url>             raw fetch with cache (--json, --key a.b.0.c)
 *   html <file|url|->     extract from HTML (--select, --mode text|html|md, --attr, --limit, --sep)
 *
 * Global flags:
 *   --ttl <seconds>       cache freshness (default 86400)
 *   --refresh             ignore freshness, revalidate with ETag
 *   --no-cache            bypass cache entirely
 *   --timeout <ms>        per-attempt timeout (default 30000)
 *   --out <file>          write full output to file, print only a summary
 *   --max-bytes <n>       stdout budget before truncation (default 50000)
 *   --no-truncate         never truncate
 *   --quiet               no [fetch]/[cache] logging on stderr
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------- args

type FlagValue = string | true;
const flags: Record<string, FlagValue> = {};
const positional: string[] = [];

const BOOLEAN = new Set([
  "refresh", "no-cache", "quiet", "list", "json", "raw", "html", "sections",
  "plain", "snippets", "unique", "no-truncate", "help",
]);

const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--") || a === "--") {
    positional.push(a);
    continue;
  }
  const body = a.slice(2);
  const eq = body.indexOf("=");
  if (eq !== -1) {
    flags[body.slice(0, eq)] = body.slice(eq + 1);
  } else if (BOOLEAN.has(body) || i + 1 >= argv.length) {
    flags[body] = true;
  } else {
    flags[body] = argv[++i];
  }
}

const BOOL = (k: string) => flags[k] === true;
const STR = (k: string, d = "") => (typeof flags[k] === "string" ? (flags[k] as string) : d);
const NUM = (k: string, d: number) => (flags[k] === undefined ? d : Number(flags[k]));

function fail(msg: string): never {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------- cache

const CACHE_ROOT = join(
  process.env.XDG_CACHE_HOME?.trim() || join(homedir(), ".cache"),
  "opencode-web-fetch",
);
const UA = "opencode-web-fetch/1.0 (+https://opencode.ai)";

type Meta = { at: number; etag?: string; lastModified?: string; status: number };

const keyOf = (url: string) => createHash("sha256").update(url).digest("hex").slice(0, 40);

async function cacheRead(key: string): Promise<{ body: string; meta: Meta } | null> {
  try {
    const meta = JSON.parse(await readFile(join(CACHE_ROOT, `${key}.json`), "utf8")) as Meta;
    const body = await readFile(join(CACHE_ROOT, `${key}.body`), "utf8");
    return { body, meta };
  } catch {
    return null;
  }
}

async function cacheWrite(key: string, body: string, meta: Meta) {
  await mkdir(CACHE_ROOT, { recursive: true });
  await writeFile(join(CACHE_ROOT, `${key}.body`), body);
  await writeFile(join(CACHE_ROOT, `${key}.json`), JSON.stringify(meta));
}

type RequestOpts = { ttl?: number; refresh?: boolean; headers?: Record<string, string> };

async function request(url: string, opts: RequestOpts = {}): Promise<string> {
  const ttl = opts.ttl ?? NUM("ttl", 86400);
  const refresh = opts.refresh || BOOL("refresh");
  const useCache = !BOOL("no-cache");
  const key = keyOf(url);
  const hit = useCache ? await cacheRead(key) : null;

  if (hit && !refresh && Date.now() - hit.meta.at < ttl * 1000) {
    if (!BOOL("quiet")) process.stderr.write(`[cache] ${url}\n`);
    return hit.body;
  }

  const headers: Record<string, string> = { "user-agent": UA, ...opts.headers };
  if (hit?.meta.etag) headers["if-none-match"] = hit.meta.etag;
  if (hit?.meta.lastModified) headers["if-modified-since"] = hit.meta.lastModified;

  let res: Response | undefined;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(url, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(NUM("timeout", 30_000)),
      });
      lastErr = undefined;
    } catch (err) {
      lastErr = err;
      res = undefined;
      if (attempt < 2) await Bun.sleep(400 * (attempt + 1));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get("retry-after"));
      if (attempt < 2) {
        await Bun.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * (attempt + 1));
      }
      continue;
    }
    break;
  }

  if (!res) {
    if (hit) {
      if (!BOOL("quiet")) {
        process.stderr.write(`[stale] network failed, serving cached copy: ${(lastErr as Error)?.message}\n`);
      }
      return hit.body;
    }
    throw lastErr;
  }

  if (res.status === 304 && hit) {
    await cacheWrite(key, hit.body, { ...hit.meta, at: Date.now() });
    if (!BOOL("quiet")) process.stderr.write(`[revalidated] ${url}\n`);
    return hit.body;
  }

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText} for ${url}`) as Error & {
      status: number;
      body: string;
    };
    err.status = res.status;
    err.body = text;
    throw err;
  }

  if (useCache) {
    await cacheWrite(key, text, {
      at: Date.now(),
      status: res.status,
      etag: res.headers.get("etag") ?? undefined,
      lastModified: res.headers.get("last-modified") ?? undefined,
    });
  }
  if (!BOOL("quiet")) process.stderr.write(`[fetch] ${url}\n`);
  return text;
}

async function getJson(url: string, ttl?: number): Promise<any> {
  return JSON.parse(await request(url, { ttl, headers: { accept: "application/json" } }));
}

// ---------------------------------------------------------------- output

const MAX_BYTES = NUM("max-bytes", 50_000);

async function emit(text: string): Promise<void> {
  const out = STR("out");
  if (out) {
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, text);
    process.stdout.write(
      `saved ${out} (${Buffer.byteLength(text)} bytes, ${text.split("\n").length} lines)\n`,
    );
    return;
  }
  let body = text;
  if (!BOOL("no-truncate")) {
    const size = Buffer.byteLength(body);
    if (size > MAX_BYTES) {
      body = body.slice(0, MAX_BYTES);
      const cut = body.lastIndexOf("\n");
      if (cut > 0) body = body.slice(0, cut);
      body +=
        `\n\n... [truncated: showing ${MAX_BYTES} of ${size} bytes]` +
        ` narrow with --section/--key/--select/--limit, or save with --out <file>\n`;
    }
  }
  process.stdout.write(body.endsWith("\n") ? body : `${body}\n`);
}

// ---------------------------------------------------------------- wiki

const WIKI = "https://minecraft.wiki";

function apiUrl(params: Record<string, string | number>): string {
  const sp = new URLSearchParams({ format: "json", formatversion: "2" });
  for (const [k, v] of Object.entries(params)) sp.set(k, String(v));
  return `${WIKI}/api.php?${sp}`;
}

function stripTemplates(s: string): string {
  let prev = "";
  let guard = 0;
  while (s !== prev && guard++ < 20) {
    prev = s;
    s = s.replace(/\{\{[^{}]*\}\}/g, "");
  }
  return s;
}

function plain(s: string): string {
  return stripTemplates(
    s
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<ref[^>]*\/>/g, "")
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
      .replace(/\[\[(?:File|Image|Arquivo):[^\]]*\]\]/gi, "")
      .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
      .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1")
      .replace(/'''?/g, ""),
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function pageTitle(): string {
  const t = positional.slice(1).join(" ").trim();
  if (!t) fail("missing page title");
  return t.replace(/\s+/g, "_");
}

async function cmdWiki() {
  const title = pageTitle();
  const ttl = NUM("ttl", 86400);

  if (BOOL("sections")) {
    const j = await getJson(apiUrl({ action: "parse", page: title, prop: "sections", redirects: "1" }), ttl);
    if (j.error) fail(`${j.error.code}: ${j.error.info}`);
    const rows = (j.parse.sections as any[]).map(
      (s) =>
        `${s.index}\t${"  ".repeat(Math.max(0, s.toclevel - 1))}` +
        `${decodeEntities(String(s.line).replace(/<[^>]+>/g, ""))}`,
    );
    return emit(rows.join("\n"));
  }

  const params: Record<string, string | number> = {
    action: "parse",
    page: title,
    prop: BOOL("html") ? "text" : "wikitext",
    redirects: "1",
  };
  if (flags.section !== undefined) params.section = STR("section");

  const j = await getJson(apiUrl(params), ttl);
  if (j.error) fail(`${j.error.code}: ${j.error.info}`);

  let text: string = BOOL("html") ? j.parse.text : j.parse.wikitext;
  if (!BOOL("html") && BOOL("plain")) text = plain(text);
  if (BOOL("html") && flags.select) text = await extractHtml(text, htmlOpts());
  await emit(text);
}

async function cmdSearch() {
  const q = positional.slice(1).join(" ").trim();
  if (!q) fail("missing search query");
  const limit = Math.min(NUM("limit", 10), 50);
  const j = await getJson(
    apiUrl({
      action: "query",
      list: "search",
      srsearch: q,
      srlimit: limit,
      srprop: BOOL("snippets") ? "snippet|wordcount" : "wordcount",
      redirects: "1",
    }),
  );
  if (j.error) fail(`${j.error.code}: ${j.error.info}`);
  const lines = (j.query?.search ?? []).map((r: any) => {
    const base = `${r.title} — ${r.wordcount} words — ${WIKI}/w/${encodeURIComponent(r.title.replace(/ /g, "_"))}`;
    if (!BOOL("snippets")) return base;
    const snip = String(r.snippet ?? "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"');
    return `${base}\n    ${snip}`;
  });
  await emit(lines.join("\n"));
}

async function cmdBatch() {
  const titles = positional.slice(1).map((t) => t.replace(/\s+/g, "_"));
  if (!titles.length) fail("missing page titles");
  const chunks: string[][] = [];
  for (let i = 0; i < titles.length; i += 50) chunks.push(titles.slice(i, i + 50));

  const blocks: string[] = [];
  for (const chunk of chunks) {
    const j = await getJson(
      apiUrl({
        action: "query",
        prop: "revisions",
        rvslots: "main",
        rvprop: "content",
        titles: chunk.join("|"),
        redirects: "1",
      }),
    );
    if (j.error) fail(`${j.error.code}: ${j.error.info}`);
    for (const p of j.query?.pages ?? []) {
      const head = `===== ${p.title} (${WIKI}/w/${encodeURIComponent(p.title.replace(/ /g, "_"))}) =====`;
      if (p.missing || !p.revisions) {
        blocks.push(`${head}\n[missing]`);
        continue;
      }
      const content = p.revisions[0]?.slots?.main?.content ?? "";
      blocks.push(`${head}\n${BOOL("plain") ? plain(content) : content}`);
    }
  }
  await emit(blocks.join("\n\n"));
}

// ---------------------------------------------------------------- mcmeta

const GH_API = "https://api.github.com/repos/misode/mcmeta";
const RAW = "https://raw.githubusercontent.com/misode/mcmeta";
const BRANCHES = [
  "main", "data", "data-json", "registries", "summary", "assets", "assets-json", "assets-tiny", "atlas", "diff",
];

async function branchSha(branch: string): Promise<string> {
  const j = await getJson(`${GH_API}/commits/${branch}`, 1800);
  if (!j?.sha) fail(`cannot resolve branch ${branch}`);
  return j.sha;
}

async function cmdMcmeta() {
  const refFlag = STR("ref", "summary");
  let ref = refFlag;
  const version = STR("version");
  const pin = STR("pin");

  if (version) ref = `${version}-${ref}`;

  let path = positional.slice(1).join("/") || ".";

  let target: string;
  let ttl = 3600;
  if (pin) {
    target = pin;
    ttl = 604800;
  } else if (/^[0-9a-f]{40}$/.test(ref)) {
    target = ref;
    ttl = 604800;
  } else if (BRANCHES.includes(ref)) {
    target = await branchSha(ref);
    ttl = 3600;
  } else {
    target = ref; // tag
    ttl = 604800;
  }

  if (BOOL("list")) {
    let j: any;
    try {
      j = await getJson(`${GH_API}/contents/${path}?ref=${target}`, ttl);
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 404) {
        fail(
          `not found: ${path} (ref ${ref})\n` +
            `hint: choose the branch with --ref (${BRANCHES.join(", ")});\n` +
            `      each branch has its own root dir, e.g. --ref data data/minecraft/recipe`,
        );
      }
      fail(e.message);
    }
    if (j?.message) fail(String(j.message));
    const rows = (Array.isArray(j) ? j : [j]).map(
      (e: any) => `${e.type === "dir" ? "d" : "f"}\t${String(e.size ?? 0).padStart(9)}\t${e.name}`,
    );
    return emit(rows.join("\n"));
  }

  let text: string;
  try {
    text = await request(`${RAW}/${target}/${path}`, { ttl });
  } catch (err) {
    const e = err as Error & { status?: number };
    if (e.status === 404) {
      fail(
        `not found: ${path} (ref ${ref})\n` +
          `hint: the branch root is part of the path — e.g. --ref data data/minecraft/recipe/...\n` +
          `      list a directory first with: mcmeta --list <dir> --ref ${ref === "summary" ? "data" : ref}`,
      );
    }
    throw err;
  }
  if (/\.(json|mcmeta)$/.test(path)) {
    try {
      return emit(JSON.stringify(JSON.parse(text), null, BOOL("raw") ? 0 : 2));
    } catch { /* not json, fall through */ }
  }
  await emit(text);
}

async function cmdVersion() {
  const v = (await request(`${RAW}/summary/version.txt`, { ttl: 1800 })).trim();
  const lines = [`version ${v}`, `repo    ${GH_API.replace("api.github.com/repos/", "github.com/")}`];
  for (const b of ["data", "registries", "summary"]) {
    lines.push(`${b.padEnd(11)}${await branchSha(b)}`);
  }
  await emit(lines.join("\n"));
}

// ---------------------------------------------------------------- html

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of Bun.stdin.stream()) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}

function toText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6]|section|article|td|th|blockquote|pre)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toMarkdown(html: string): string {
  let s = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
  // keep table cells on one line so markdown rows stay intact
  s = s.replace(/<(td|th)([^>]*)>([\s\S]*?)<\/\1>/gi, (_, tag, attrs, content) => {
    return `<${tag}${attrs}>${content.replace(/\s+/g, " ").trim()}</${tag}>`;
  });
  s = s.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, row) => `<tr>${row.replace(/>\s+</g, "><")}</tr>`);
  s = s
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n${"#".repeat(+n)} ${toText(t)}\n`)
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, c) => `\n\`\`\`\n${decodeEntities(c.replace(/<[^>]+>/g, ""))}\n\`\`\`\n`)
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => `\`${decodeEntities(c.replace(/<[^>]+>/g, ""))}\``)
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `**${toText(c)}**`)
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `*${toText(c)}*`)
    .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => {
      const label = toText(t);
      return label ? `[${label}](${href})` : href;
    })
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(td|th)>/gi, " | ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(s)
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractHtml(
  html: string,
  opts: { selector: string; mode: string; limit?: number; sep?: string; attr?: string | null; unique?: boolean },
): Promise<string> {
  const { selector, attr } = opts;
  const limit = opts.limit ?? Number.POSITIVE_INFINITY;

  if (attr) {
    const values: string[] = [];
    await new HTMLRewriter()
      .on(selector, {
        element(el) {
          const v = el.getAttribute(attr);
          if (v != null) values.push(v);
        },
      })
      .transform(new Response(html))
      .text();
    const out = opts.unique ? [...new Set(values)] : values;
    return out.slice(0, limit).join("\n");
  }

  const tag = `wf-${Math.random().toString(36).slice(2, 10)}`;
  const S = `@@${tag}:S@@`;
  const E = `@@${tag}:E@@`;

  const marked = await new HTMLRewriter()
    .on(selector, {
      element(el) {
        el.before(S);
        el.after(E);
      },
    })
    .transform(new Response(html))
    .text();

  const matches: string[] = [];
  const re = new RegExp(`${S}([\\s\\S]*?)${E}`, "g");
  for (let m = re.exec(marked); m; m = re.exec(marked)) {
    matches.push(m[1]);
    if (matches.length >= limit) break;
  }

  if (!matches.length) {
    process.stderr.write(`no match for selector: ${selector}\n`);
    return "";
  }

  const sep = opts.sep ?? "\n\n---\n\n";
  const rendered = matches.map((m) =>
    opts.mode === "html" ? m.trim() : opts.mode === "md" ? toMarkdown(m) : toText(m),
  );
  return rendered.join(sep);
}

function htmlOpts() {
  return {
    selector: STR("select", "body"),
    mode: STR("mode", "text"),
    limit: NUM("limit", Number.POSITIVE_INFINITY),
    sep: STR("sep", "\n\n---\n\n").replace(/\\n/g, "\n").replace(/\\t/g, "\t"),
    attr: flags.attr ? STR("attr") : null,
    unique: BOOL("unique"),
  };
}

async function cmdHtml() {
  const src = positional[1];
  if (!src) fail("missing <file|url|->");

  let html: string;
  if (src === "-") html = await readStdin();
  else if (/^https?:\/\//.test(src)) html = await request(src, { headers: { accept: "text/html" } });
  else html = await readFile(src, "utf8");

  await emit(await extractHtml(html, htmlOpts()));
}

// ---------------------------------------------------------------- get

function navigate(value: any, path: string): any {
  for (const token of path.split(".")) {
    if (token === "") continue;
    if (value == null) return undefined;
    value = Array.isArray(value) && /^\d+$/.test(token) ? value[Number(token)] : value[token];
  }
  return value;
}

async function cmdGet() {
  const url = positional[1];
  if (!url) fail("missing url");
  const body = await request(url);

  if (flags.key) {
    const v = navigate(JSON.parse(body), STR("key"));
    if (v === undefined) fail(`key not found: ${STR("key")}`);
    return emit(typeof v === "string" ? v : JSON.stringify(v, null, 2));
  }
  if (BOOL("json")) {
    try {
      return emit(JSON.stringify(JSON.parse(body), null, 2));
    } catch { /* not json */ }
  }
  await emit(body);
}

// ---------------------------------------------------------------- main

function help() {
  process.stdout.write(
    `web-fetch — cached, filtered fetching\n\n` +
      `  wiki <title>        wikitext (--html --section N --sections --plain)\n` +
      `  search <query>      wiki search (--limit N --snippets)\n` +
      `  batch <title...>    wikitext of many pages, one request\n` +
      `  mcmeta <path>       vanilla data (--ref data|registries|summary, --version V, --pin SHA, --list)\n` +
      `  version             current mcmeta version + branch heads\n` +
      `  get <url>           raw fetch (--json, --key a.b.0.c)\n` +
      `  html <file|url|->   extract (--select CSS --mode text|html|md --attr NAME --limit N --sep S)\n\n` +
      `global: --ttl S --refresh --no-cache --timeout MS --out FILE --max-bytes N --no-truncate --quiet\n`,
  );
}

async function main() {
  const cmd = positional[0];
  switch (cmd) {
    case "wiki": return cmdWiki();
    case "search": return cmdSearch();
    case "batch": return cmdBatch();
    case "mcmeta": return cmdMcmeta();
    case "version": return cmdVersion();
    case "get": return cmdGet();
    case "html": return cmdHtml();
    case undefined:
    case "help":
    case "--help": return help();
    default: return fail(`unknown command: ${cmd}`);
  }
}

main().catch((err) => fail((err as Error).message));
