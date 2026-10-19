import { Command } from "../core/models/Command";
import { NbtSerializer } from "../core/serializer/NBTSerializer";
import type { Block } from "../data/utils/holder/Block";
import type { CoordinateValue } from "./FillCommand";

export class SetBlockCommand extends Command {
    constructor(
        private x: CoordinateValue, 
        private y: CoordinateValue, 
        private z: CoordinateValue,
        private block: Block
    ) { super() };

    public getX(): CoordinateValue { return this.x }
    public getY(): CoordinateValue { return this.y }
    public getZ(): CoordinateValue { return this.z }
    public getBlock(): Block { return this.block }
    
    public serialize(): string {
        const state: Record<string, any> = this.getBlock().getState();
        
        const entrada: string[] = Object.entries(state).map(([k,v]) => {
            return `${k.toString()}=${NbtSerializer.stringify(v)}`
        })
        const state_s = entrada.join(',');

        return `setblock ${this.getX()} ${this.getY()} ${this.getZ()} ${this.getBlock().getIdentifier().toString()}[${state_s}]`
    }
    public innerSerialize(): string {
        return this.serialize();
    }
}