import { McFunction } from "../src";

const fn = new McFunction("foo");

fn.addCommand("say foo");
fn.addCommand("say bar");

console.log("Name", fn.getName());
console.log(fn.serialize());