import { ObjectProvider } from "./models/ObjectProvider";
import type { NumberOrRangeProvider, StringProvider } from "./TargetSelector";

export class TargetScoresProvider extends ObjectProvider<
    StringProvider,
    NumberOrRangeProvider
> {
}