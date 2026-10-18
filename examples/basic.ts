import { McFunction } from "../src";
import { AdvancementsProvider } from "../src/core/utils/AdvancementsProvider";
import { Identifier } from "../src/core/utils/Identifier";
import { Range } from "../src/core/utils/Range";
import { TargetScoresProvider } from "../src/core/utils/TargetScoresProvider";
import { TargetSelector } from "../src/core/utils/TargetSelector";
import {
    atlas,
    componentToJson,
    componentToSnbt,
    components,
    keybind,
    nbt,
    player,
    score,
    selector as textSelector,
    text,
    translatable,
} from "../src/core/api/text/Component";

const fn = new McFunction("foo");

fn.do(ctx => {
    let world = ctx.getWorld();
    world.say("Hello, world!");
})

console.log(`Function: ${fn.getName()}`);
console.log(fn.serialize());

// --- Target selectors (Java Edition) ---

const scores = new TargetScoresProvider().def(
    ["foo", 10],
    ["bar", Range.of(1, 5)],
);

const advancements = new AdvancementsProvider().def(
    [Identifier.of("minecraft:story/smelt_iron"), true],
    [Identifier.of("minecraft:adventure/kill_all_mobs"), { witch: true }],
);

const selector = new TargetSelector("a", {
    scores,
    advancements,
    tag: "!bot",
    gamemode: "!creative",
    nbt: { OnGround: true },
    limit: 3,
    sort: "nearest",
});

console.log(`Selector:   ${selector}`);
console.log(`Serialize:  ${selector.serialize()}`);
console.log(`Scores obj: ${JSON.stringify(scores.toObject())}`);

// --- Text components (Java Edition 26.3) ---

const greeting = text("Hello")
    .color("gold")
    .bold()
    .insert("hi")
    .append(text(" world").italic().color("#55FFFF"), "!");

const tooltip = text("Hover me")
    .hover({ action: "show_text", value: text("tooltip!").color("aqua") })
    .click({ action: "run_command", command: "say hello" });

const translation = translatable(
    "chat.type.text",
    [text("Steve"), text("oi")],
    "fallback",
);

const points = score("@p", "points");
const names = textSelector("@a[limit=3]", text(", ").color("gray"));
const inventoryKey = keybind("key.inventory");
const itemId = nbt("SelectedItem.id", {
    source: "entity",
    entity: "@s",
    interpret: true,
});

const emerald = atlas("block/emerald_block");
const face = player("Notch", false);

console.log(`Text SNBT:  ${greeting.serialize()}`);
console.log(`Text JSON:  ${greeting.toJson()}`);
console.log(`Hover SNBT: ${tooltip.serialize()}`);
console.log(`Translate:  ${translation.serialize()}`);
console.log(`Score:      ${points.serialize()}`);
console.log(`Selector:   ${names.serialize()}`);
console.log(`Keybind:    ${inventoryKey.serialize()}`);
console.log(`NBT:        ${itemId.serialize()}`);
console.log(`Atlas:      ${emerald.serialize()}`);
console.log(`Player:     ${face.serialize()}`);
console.log(`List JSON:  ${componentToJson(components("A", text("B").bold()))}`);
console.log(`List SNBT:  ${componentToSnbt(components("A", text("B").bold()))}`);
