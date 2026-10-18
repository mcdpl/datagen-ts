import { ObjectProvider } from "./models/ObjectProvider";
import type { BooleanProvider, IdentifierProvider } from "./TargetSelector";

export class AdvancementsProvider extends ObjectProvider <
    IdentifierProvider,
    BooleanProvider | Record<string, BooleanProvider>
> {}