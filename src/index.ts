import { cleanCycleBreaking } from "./cycle";
import {
    DeserializeArrayInternal,
    DeserializeInternal,
    DeserializeJSONInternal,
    DeserializeMapInternal,
    DeserializeObjectMapInternal
} from "./deserialize";
import { MetaData } from "./meta_data";
import { getRefHandler, } from "./ref";
import {
    SerializeArrayInternal,
    SerializeInternal,
    SerializeJSONInternal,
    SerializeMapInternal,
    SerializeObjectMapInternal,
    SerializePrimitiveInternal,
    SerializeSetInternal
} from "./serialize";
import { NoOp } from "./string_transforms";
import {
    ArrayHandling,
    ASerializableType,
    ASerializableTypeOrArray,
    IConstructable,
    IIndexable,
    IJsonArray,
    IJsonObject,
    InstantiationMethod,
    ItIsAnArrayInternal,
    JsonType,
    SerializablePrimitiveType
} from "./types";
import {
    cleanupDeserialization,
    cleanupSerialization,
    initDeserialization,
    initSerialization
} from "./utils";

export {
    RuntimeTypingResetDictionary,
    RuntimeTypingSetTypeString,
    RuntimeTypingEnable,
    RuntimeTypingDisable,
    typeString
} from "./runtime_typing";
export { setRefHandler, RefHandler } from "./ref";
export * from "./serialize";
export * from "./deserialize";
export * from "./decorators";
export * from "./string_transforms";
export { IIndexable as Indexable, InstantiationMethod } from "./types";
export {
    DeserializationOccurring,
    parseNumber,
    stringifyNumber,
    SerializationOccurring
} from "./utils";

export function RefClean() {
    if (getRefHandler().clean) {
        getRefHandler().clean();
    }
    cleanCycleBreaking();
}

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

/*
Serialization
*/
export function Serialize<T>(instance: T, type: ItIsAnArrayInternal): JsonType[];
export function Serialize<T>(instance: T, type: ASerializableType<T>): IJsonObject;
export function Serialize<T>(
    instance: T,
    type: ASerializableTypeOrArray<T>
): null | JsonType[] | IJsonObject {
    initSerialization();
    const ret = SerializeInternal(instance, type as any);
    cleanupSerialization();
    return ret;
}

export function SerializeJSON(source: any, transformKeys = true): JsonType {
    initSerialization();
    const ret = SerializeJSONInternal(source, transformKeys);
    cleanupSerialization();
    return ret;
}

export function SerializePrimitive<T>(
    source: SerializablePrimitiveType,
    type: () => SerializablePrimitiveType
): JsonType {
    initSerialization();
    const ret = SerializePrimitiveInternal(source, type);
    cleanupSerialization();
    return ret;
}

export function SerializeSet<T>(
    source: T[],
    type: ASerializableTypeOrArray<T>
): JsonType[] {
    initSerialization();
    const ret = SerializeSetInternal(source, type);
    cleanupSerialization();
    return ret;
}

export function SerializeArray<T>(
    source: T[],
    type: ASerializableTypeOrArray<T>
): JsonType[] {
    initSerialization();
    const ret = SerializeArrayInternal(source, type);
    cleanupSerialization();
    return ret;
}

export function SerializeMap<K, V>(
    source: Map<K, V>,
    keyType: ASerializableTypeOrArray<K>,
    valueType: ASerializableTypeOrArray<V>,
): IIndexable<JsonType> {
    initSerialization();
    const ret = SerializeMapInternal(source, keyType, valueType);
    cleanupSerialization();
    return ret;
}

export function SerializeObjectMap<T>(
    source: T,
    type: ASerializableTypeOrArray<T>
): IIndexable<JsonType> {
    initSerialization();
    const ret = SerializeObjectMapInternal(source, type);
    cleanupSerialization();
    return ret;
}

/*
Deserialization
*/

export function DeserializeRaw<T>(
    data: IJsonObject,
    type: ASerializableTypeOrArray<T>,
    target?: T
): T | null {
    return Deserialize(data as any, type as any, target, InstantiationMethod.None);
}

export function DeserializeArrayRaw<T>(
    data: IJsonArray,
    type: ASerializableTypeOrArray<T>,
    target?: T[],
    handling: ArrayHandling = ArrayHandling.Into
): T[] | null {
    initDeserialization();
    const ret = DeserializeArrayInternal(data, type, () => Array, handling, target, InstantiationMethod.None);
    cleanupDeserialization();
    return ret;
}

export function DeserializeMapRaw<T>(
    data: IIndexable<JsonType>,
    type: ASerializableTypeOrArray<T>,
    target?: IIndexable<T>
): IIndexable<T> | null {
    initDeserialization();
    const ret = DeserializeObjectMapInternal(data, type, target, InstantiationMethod.None);
    cleanupDeserialization();
    return ret;
}

export function DeserializeObjectMap<T>(
    data: IJsonObject,
    type: ASerializableTypeOrArray<T>,
    target?: IIndexable<T>,
    instantiationMethod: InstantiationMethod = MetaData.deserializeInstantiationMethod
): IIndexable<T> {
    initDeserialization();
    const ret = DeserializeObjectMapInternal(data, type, target, instantiationMethod);
    cleanupDeserialization();
    return ret;
}

export function DeserializeMap<K, V>(
    data: IJsonObject,
    keyType: ASerializableTypeOrArray<K>,
    valueType: ASerializableTypeOrArray<V>,
    target?: Map<K, V>,
    instantiationMethod: InstantiationMethod = MetaData.deserializeInstantiationMethod
): Map<K, V> {
    initDeserialization();
    const ret = DeserializeMapInternal(data, keyType, valueType, () => Map as any, null, instantiationMethod);
    cleanupDeserialization();
    return ret;
}

export function DeserializeArray<T, C extends T[]>(
    data: IJsonArray,
    type: ASerializableTypeOrArray<T>,
    constructor: () => IConstructable = () => Array,
    handling: ArrayHandling = ArrayHandling.Into,
    target?: C,
    instantiationMethod: InstantiationMethod = MetaData.deserializeInstantiationMethod
) {
    initDeserialization();
    const ret = DeserializeArrayInternal(data, type, constructor, handling, target, instantiationMethod);
    cleanupDeserialization();
    return ret;
}

export function DeserializeJSON(
    data: JsonType,
    transformKeys = true,
    target?: JsonType
): JsonType {
    initDeserialization();
    const ret = DeserializeJSONInternal(data, transformKeys, target);
    cleanupDeserialization();
    return ret;
}

export function Deserialize<T extends IIndexable>(
    data: IJsonObject,
    type: ASerializableType<T>,
    target?: T,
    instantiationMethod?: InstantiationMethod
): T | null;
export function Deserialize<K, T extends K[]>(
    data: IJsonArray,
    type: ItIsAnArrayInternal,
    target?: T,
    instantiationMethod?: InstantiationMethod
): T | null;
export function Deserialize<T extends IIndexable>(
    data: IJsonObject | IJsonArray,
    type: ASerializableTypeOrArray<T>,
    target?: T,
    instantiationMethod: InstantiationMethod = MetaData.deserializeInstantiationMethod
): T | null {
    initDeserialization();
    const ret = DeserializeInternal(data, type, target, instantiationMethod);
    cleanupDeserialization();
    return ret;
}
