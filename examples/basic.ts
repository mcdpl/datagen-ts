import { Blocks, DataPack } from "../src";
import { Coordinate } from "../src/core/api/utils/Coordinate";
import { Position } from "../src/core/api/utils/Position";

const pack = new DataPack("test-pack");

const mc = pack.MINECRAFT;
const ns = pack.createNamespace("tpack");

const load = ns.createFunction("load");

load.do(ctx => {
    const world = ctx.getWorld();
    world.setBlock(
        new Position('~', '~', '~'), 
        Blocks.COMMAND_BLOCK
            .copy()
            .setEntityData({
                auto: true,
                Command: "say hello"
            })
        )
})

mc.LOAD.add(load);

pack.build("/home/odaniel/.local/share/PrismLauncher/instances/Fabulously Optimized(1)/minecraft/saves/New World/datapacks/test-pack/");