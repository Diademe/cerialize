import { MetaData } from "./meta_data";
import { NoOp } from "./string_transforms";
import {  ASerializableTypeOrArray, IConstructable, InstantiationMethod, ItIsAnArrayInternal } from "./types";

export {
    RuntimeTypingResetDictionary,
    RuntimeTypingSetTypeString,
    RuntimeTypingEnable,
    RuntimeTypingDisable
} from "./runtime_typing";
export * from "./serialize";
export * from "./deserialize";
export * from "./decorators";
export * from "./string_transforms";
export { Indexable, InstantiationMethod } from "./types";
export { parseNumber, stringifyNumber } from "./utils";
export { RefClean } from "./ref_cycle";

export function SetSerializeKeyTransform(fn: (str: string) => string): void {
    MetaData.serializeKeyTransform = typeof fn === "function" ? fn : NoOp;
}

export function SetDeserializeKeyTransform(fn: (str: string) => string): void {
    MetaData.deserializeKeyTransform = typeof fn === "function" ? fn : NoOp;
}

export function SetDefaultInstantiationMethod(
    instantiationMethod: InstantiationMethod
): void {
    MetaData.deserializeInstantiationMethod =
        instantiationMethod === null
            ? InstantiationMethod.New
            : instantiationMethod;
}

// if true it deals with references and cycle references
export function SetRefCycleDetection(b: boolean) {
    MetaData.refCycleDetection = b;
}

export function itIsAnArray(
    type: ASerializableTypeOrArray<any>,
    ctor?: () => IConstructable
    ): ItIsAnArrayInternal {
    return new ItIsAnArrayInternal(type, ctor);
}
