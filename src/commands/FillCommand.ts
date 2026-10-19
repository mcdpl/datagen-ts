import { Command } from "../core/models/Command";
import { NbtSerializer } from "../core/serializer/NBTSerializer";
import type { Block } from "../data/utils/holder/Block";

export type CoordinateValue = number | `~${number}` | '~'

export class FillCommand extends Command {
    constructor(
        private x1: CoordinateValue, 
        private y1: CoordinateValue, 
        private z1: CoordinateValue,
        private x2: CoordinateValue, 
        private y2: CoordinateValue, 
        private z2: CoordinateValue,
        private block: Block
    ) { super() };

    public getX1(): CoordinateValue { return this.x1 }
    public getY1(): CoordinateValue { return this.y1 }
    public getZ1(): CoordinateValue { return this.z1 }
    public getX2(): CoordinateValue { return this.x2 }
    public getY2(): CoordinateValue { return this.y2 }
    public getZ2(): CoordinateValue { return this.z2 }
    public getBlock(): Block { return this.block }
    
    public serialize(): string {
        const state: Record<string, any> = this.getBlock().getState();
        
        const entrada: string[] = Object.entries(state).map(([k,v]) => {
            return `${k.toString()}=${NbtSerializer.stringify(v)}`
        })
        const state_s = entrada.join(',');

        const pos1 = `${this.x1} ${this.y1} ${this.z1}`
        const pos2 = `${this.x2} ${this.y2} ${this.z2}`
        return `fill ${pos1} ${pos2} ${this.getBlock().getIdentifier().toString()}[${state_s}]`
    }
    public innerSerialize(): string {
        return this.serialize();
    }
}