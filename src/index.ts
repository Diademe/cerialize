import { MetaData } from "./meta_data";
import { NoOp } from "./string_transforms";
import { InstantiationMethod } from "./util";

export {
    RuntimeTypingResetDictionary,
    RuntimeTypingSetTypeString,
    RuntimeTypingSetEnable
} from "./runtime_typing";
export * from "./serialize";
export * from "./deserialize";
export * from "./annotations";
export * from "./string_transforms";
export { InstantiationMethod, parseNumber, stringifyNumber } from "./util";
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
