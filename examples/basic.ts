import { McFunction } from "../src";

const fn = new McFunction("foo");

fn.do(ctx => {
    let world = ctx.getWorld();
    world.say("Hello, world!");
})

console.log(`Function: ${fn.getName()}`);
console.log(fn.serialize());