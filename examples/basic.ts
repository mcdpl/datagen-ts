import { McFunction } from "../src";
import { AdvancementsProvider } from "../src/core/utils/AdvancementsProvider";
import { Identifier } from "../src/core/utils/Identifier";
import { Range } from "../src/core/utils/Range";
import { TargetScoresProvider } from "../src/core/utils/TargetScoresProvider";
import { TargetSelector } from "../src/core/utils/TargetSelector";

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
