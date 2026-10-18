# Minecraft data sources

Two sources matter: the **wiki** (prose, tables, explanations) and **mcmeta**
(the actual vanilla JSON extracted from the game jar).

## minecraft.wiki (MediaWiki)

Base: `https://minecraft.wiki`

| Need | URL |
| --- | --- |
| raw wikitext, single page | `/w/<Title>?action=raw` |
| page object (title, revision, wikitext) | `/rest.php/v1/page/<Title>` |
| wikitext via API | `/api.php?action=parse&page=<Title>&prop=wikitext&format=json&formatversion=2&redirects=1` |
| rendered HTML of a page | same with `prop=text` |
| rendered HTML of one section | add `&section=N` (0 = lead) |
| section outline | `prop=sections` → `parse.sections[] {index, level, line, toclevel}` |
| search | `/api.php?action=query&list=search&srsearch=<q>&format=json&formatversion=2` |
| many pages at once | `/api.php?action=query&prop=revisions&rvslots=main&rvprop=content&titles=A|B|C` (max 50) |

Notes:

- Titles use underscores: `Data_pack`, not `Data pack`. The CLI converts spaces for you.
- `redirects=1` makes the API resolve `Recipe` → the canonical page.
- `prop=text` already expands templates; `prop=wikitext` leaves `{{...}}` raw.
- Batch responses are sorted by title and may include `normalized`/`redirects`
  maps — match by `page.title`, not by request order.
- Licence: CC BY-NC-SA 3.0. Attribute when reusing.

## misode/mcmeta

Repo: `https://github.com/misode/mcmeta` — vanilla datapack/assets extracted per
version. Each branch is a moving "latest"; each version is a tag named
`<version>-<branch>` (e.g. `26.4-snapshot-4-data`).

| Branch | Contents |
| --- | --- |
| `data` | vanilla datapack: `data/minecraft/{recipe,loot_table,tags,advancement,worldgen,...}` |
| `registries` | `data.json` — one array of ids per registry (item, block, recipe, loot_table, ...) |
| `summary` | compact indexes (`version.txt`, `blocks/`, `commands/`, `item_components/`) |
| `assets` / `assets-json` | textures, models, lang files |
| `atlas` | texture atlas layout |
| `diff` | changes between adjacent versions |

Useful paths inside `data`:

```
data/minecraft/recipe/<id>.json
data/minecraft/loot_table/blocks/<id>.json
data/minecraft/loot_table/entities/<id>.json
data/minecraft/loot_table/chests/<id>.json
data/minecraft/tags/item/<id>.json
data/minecraft/tags/block/<id>.json
data/minecraft/advancement/<path>.json
data/minecraft/worldgen/{dimension,dimension_type,biome,noise_settings,placed_feature}/...
data/minecraft/{damage_type,enchantment,predicate,trim_material,trim_pattern,jukebox_song}/...
```

Pin for reproducibility: resolve the branch head once (`version` command) and
pass the 40-char SHA with `--pin`; content is then immutable.

## Raw URLs

```
https://raw.githubusercontent.com/misode/mcmeta/<ref-or-sha>/<path>
https://api.github.com/repos/misode/mcmeta/contents/<path>?ref=<ref>   # directory listing
```
