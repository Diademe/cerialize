import { MetaData } from "./meta_data";
import { NoOp } from "./string_transforms";
import {  ASerializableTypeOrArray, IConstructable, InstantiationMethod, ItIsAnArrayInternal } from "./types";

export {
    RuntimeTypingResetDictionary,
    RuntimeTypingSetTypeString,
    RuntimeTypingEnable,
    RuntimeTypingDisable,
    typeString
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

/**
 * Enable references and cyclic references detection
 */
export function RefCycleDetectionEnable() {
    MetaData.refCycleDetection = true;
}

/**
 * Enable references and cyclic references detection
 */
export function RefCycleDetectionDisable() {
    MetaData.refCycleDetection = false;
}

export function itIsAnArray(
    type: ASerializableTypeOrArray<any>,
    ctor?: () => IConstructable
    ): ItIsAnArrayInternal {
    return new ItIsAnArrayInternal(type, ctor);
}
