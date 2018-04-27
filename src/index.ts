import { MetaData } from "./meta_data";
import { NoOp } from "./string_transforms";
import { InstantiationMethod } from "./util";

export { TypeString } from "./runtime_typing";
export * from "./serialize";
export * from "./deserialize";
export * from "./annotations";
export * from "./string_transforms";
export { InstantiationMethod } from "./util";
export { refClean } from "./ref_cycle";

export function SetSerializeKeyTransform(fn: (str: string) => string): void {
    if (typeof fn === "function") {
        MetaData.serializeKeyTransform = fn;
    }
    else {
        MetaData.serializeKeyTransform = NoOp;
    }
}

export function SetDeserializeKeyTransform(fn: (str: string) => string): void {
    if (typeof fn === "function") {
        MetaData.deserializeKeyTransform = fn;
    }
    else {
        MetaData.deserializeKeyTransform = NoOp;
    }
}

export function SetDefaultInstantiationMethod(instantiationMethod: InstantiationMethod): void {
    if (instantiationMethod === null) {
        MetaData.deserializeInstantationMethod = InstantiationMethod.New;
    } else {
        MetaData.deserializeInstantationMethod = instantiationMethod;
    }
}

//if true it deales with referances and cycle referances 
export function SetRefCycleDetection(b: boolean) {
    MetaData.RefCycleDetection = b; 
}