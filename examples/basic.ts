import { McFunction } from "../src/core/McFunction";

const fn = new McFunction("foo");

fn.addCommand("say foo");
fn.addCommand("say bar");

console.log(fn.serialize());