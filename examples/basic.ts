import { DataPack } from "../src";

const pack = new DataPack("test-pack");

const ns = pack.createNamespace("tpack");

const load = ns.createFunction("load");

pack.build("/home/odaniel/.local/share/PrismLauncher/instances/Fabulously Optimized(1)/minecraft/saves/New World/datapacks/test-pack/");