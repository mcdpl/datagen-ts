import type { IInnerSerializable } from "../interfaces/IInnerSerializable";
import type { ISerializable } from "../interfaces/ISerializable";

export abstract class Command implements ISerializable, IInnerSerializable {
    
    /**
     * Transforma um `Command` em um comando string pra mcfunction.
     *
     * @public
     * @abstract
     * @returns {string} linha/trecho do mcfunction
     */
    public abstract serialize(): string;
    
    /**
     * Transforma um `Command` em um comando string pra ser chamado dentro de outro comando.
     *
     * @public
     * @abstract
     * @returns {string} linha/trecho do mcfunction
     */
    public abstract innerSerialize(): string;
}