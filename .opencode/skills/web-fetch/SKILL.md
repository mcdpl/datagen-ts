---
name: Web Fetch
description: Fetch and read web content through a cached, filtered CLI. Use for Minecraft Wiki pages, misode/mcmeta vanilla datapack data, arbitrary JSON APIs, and extracting specific parts of local .html files instead of reading them raw.
---

# Web Fetch

`scripts/fetch.ts` — Bun, zero dependencies, disk cache with ETag revalidation,
CSS extraction via Bun's built-in `HTMLRewriter`.

```bash
F=".opencode/skills/web-fetch/scripts/fetch.ts"   # from the repo root
bun "$F" <command> [args] [flags]
```

Paths here are relative to this skill's directory; from elsewhere use the base
directory shown when the skill loads.

## Rules

1. **Never read a whole page.** Fetch, then narrow with `--section`, `--select`, `--key`, `--limit`.
2. **Prefer wikitext over HTML** for wiki pages: ~5–10x smaller and semantically explicit. Use `--html` only for rendered tables.
3. **Warm cache costs ~20ms** (`[cache]` on stderr). Re-run freely; `--refresh` only when you need the newest revision.
4. **Big output goes to a file**: `--out /tmp/page.txt`, then `grep`/`read` slices. Never dump 50KB into the conversation.
5. **For datapack data, prefer `mcmeta` over the wiki** — it is the real vanilla JSON, versioned, exact.

## Commands

| Command | Purpose |
| --- | --- |
| `wiki <title>` | wikitext of a page |
| `search <query>` | find page titles (`--limit`, `--snippets`) |
| `batch <title...>` | wikitext of up to 50 pages in one request |
| `mcmeta <path>` | vanilla data from `misode/mcmeta` (`--ref`, `--version`, `--pin`, `--list`) |
| `version` | current mcmeta version + branch heads |
| `get <url>` | raw fetch (`--json`, `--key a.b.0.c`) |
| `html <file\|url\|->` | extract from HTML (`--select`, `--mode text\|html\|md`, `--attr`, `--limit`, `--sep`) |

Global: `--ttl S`, `--refresh`, `--no-cache`, `--timeout MS`, `--out FILE`, `--max-bytes N`, `--no-truncate`, `--quiet`.

## Recipes

```bash
# page outline, then one section
bun "$F" wiki "Data pack" --sections
bun "$F" wiki "Data pack" --section 3

# readable prose (lossy: drops templates, unwraps links, keeps tables)
bun "$F" wiki "Loot table" --plain --out /tmp/loot.txt

# rendered table as markdown
bun "$F" wiki "Data pack" --html --select "table.wikitable" --mode md --limit 1

# many pages, one round trip
bun "$F" batch "Data pack" "Loot table" "Pack format" --plain

# registry ids (array per registry: item, block, recipe, loot_table, ...)
bun "$F" mcmeta registries/data.json --out /tmp/registries.json
bun "$F" mcmeta blocks/data.json --out /tmp/blocks.json

# one vanilla file
bun "$F" mcmeta --ref data data/minecraft/recipe/acacia_boat.json
bun "$F" mcmeta --ref data --list data/minecraft/loot_table/blocks | head -20

# pin a version or commit for reproducibility
bun "$F" mcmeta --version 26.4-snapshot-4 --ref data data/minecraft/tags/item/planks.json

# API JSON, one field
bun "$F" get "https://minecraft.wiki/rest.php/v1/page/Recipe" --key latest.id

# local .html file (also accepts a URL or "-" for stdin)
bun "$F" html pagina.html --select "main table" --mode text
bun "$F" html pagina.html --select "a[href]" --attr href --unique
cat fixture.html | bun "$F" html - --select ".price"
```

## Pitfalls

- `--plain` is approximate: nested templates are stripped iteratively, so some sentences lose inline snippets. Use `--html --select` when exactness matters.
- `HTMLRewriter` supports a CSS subset: tag, `.class`, `#id`, `[attr]`, descendant/child, `:not`, `:nth-child`. No `:has()`, no `::text`. Since it is streaming, only the **outermost** match of nested elements is extracted.
- `mcmeta` branches each have their own root: `--ref data data/minecraft/...`, `--ref summary version.txt`, `--ref registries data.json`. A wrong combination returns 404; the CLI prints a hint.
- `26.4-snapshot-4` style versions are real tags (`<version>-<branch>`), not branches.
- JS-rendered pages return an empty shell — this tool does not run a browser.
- Wiki text is CC BY-NC-SA 3.0: quote and attribute, do not bulk-copy into the repo.

## References

- `references/minecraft-sources.md` — wiki API endpoints, mcmeta layout, path cheat sheet.
