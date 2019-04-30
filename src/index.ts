import { cleanCycleBreaking } from "./cycle";
import {
    DeserializeArrayInternal,
    DeserializeInternal,
    DeserializeJSONInternal,
    DeserializeMapInternal,
    DeserializeObjectMapInternal
} from "./deserialize";
import {
    ClassMetaData,
    PropMetaData
} from "./meta_data";
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
    SerializablePrimitiveType,
} from "./types";
import {
    deserializationContinuation,
    serializationContinuation
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
export {
    IIndexable as Indexable,
    InstantiationMethod,
    ArrayHandling,
    IRefHandler,
    JsonType
} from "./types";
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
    PropMetaData.serializeKeyTransform = typeof fn === "function" ? fn : NoOp;
}

export function SetDeserializeKeyTransform(fn: (str: string) => string): void {
    PropMetaData.deserializeKeyTransform = typeof fn === "function" ? fn : NoOp;
}

export function SetDefaultInstantiationMethod(
    instantiationMethod: InstantiationMethod
): void {
    PropMetaData.deserializeInstantiationMethod =
        instantiationMethod === null
            ? InstantiationMethod.New
            : instantiationMethod;
}

/**
 * Enable references and cyclic references detection
 */
export function RefCycleDetectionEnable() {
    ClassMetaData.refCycleDetection = true;
}

/**
 * Enable references and cyclic references detection
 */
export function RefCycleDetectionDisable() {
    ClassMetaData.refCycleDetection = false;
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
    return serializationContinuation(SerializeInternal, instance, type as any);
}

export function SerializeJSON(source: any, transformKeys = true): JsonType {
    return serializationContinuation(SerializeJSONInternal, source, transformKeys);
}

export function SerializePrimitive<T>(
    source: SerializablePrimitiveType,
    type: () => SerializablePrimitiveType
): JsonType {
    return serializationContinuation(SerializePrimitiveInternal, source, type);
}

export function SerializeSet<T>(
    source: T[],
    type: ASerializableTypeOrArray<T>
): JsonType[] {
    return serializationContinuation(SerializeSetInternal, source, type);
}

export function SerializeArray<T>(
    source: T[],
    type: ASerializableTypeOrArray<T>
): JsonType[] {
    return serializationContinuation(SerializeArrayInternal, source, type);
}

export function SerializeMap<K, V>(
    source: Map<K, V>,
    keyType: ASerializableTypeOrArray<K>,
    valueType: ASerializableTypeOrArray<V>,
): IIndexable<JsonType> {
    return serializationContinuation(SerializeMapInternal, source, keyType, valueType);
}

export function SerializeObjectMap<T>(
    source: T,
    type: ASerializableTypeOrArray<T>
): IIndexable<JsonType> {
    return serializationContinuation(SerializeObjectMapInternal, source, type);
}

/*
Deserialization
*/

export function DeserializeObjectMap<T>(
    data: IJsonObject,
    type: ASerializableTypeOrArray<T>,
    target?: IIndexable<T>,
    instantiationMethod: InstantiationMethod = PropMetaData.deserializeInstantiationMethod
): IIndexable<T> {
    return deserializationContinuation<IIndexable<T>>(
        DeserializeObjectMapInternal,
        data, type, target, instantiationMethod);
}

export function DeserializeMap<K, V>(
    data: IJsonObject,
    keyType: ASerializableTypeOrArray<K>,
    valueType: ASerializableTypeOrArray<V>,
    target?: Map<K, V>,
    instantiationMethod: InstantiationMethod = PropMetaData.deserializeInstantiationMethod
): Map<K, V> {
    return deserializationContinuation<Map<K, V>>(
        DeserializeMapInternal,
        data, keyType, valueType, () => Map as any, target, instantiationMethod);
}

export function DeserializeArray<T, C extends T[]>(
    data: IJsonArray,
    type: ASerializableTypeOrArray<T>,
    constructor: () => IConstructable = () => Array,
    handling: ArrayHandling = ArrayHandling.Into,
    target?: C,
    instantiationMethod: InstantiationMethod = PropMetaData.deserializeInstantiationMethod
) {
    return deserializationContinuation<C>(
        DeserializeArrayInternal,
        data, type, constructor, handling, target, instantiationMethod);
}

export function DeserializeJSON(
    data: JsonType,
    transformKeys = true,
    target?: JsonType
): JsonType {
    return deserializationContinuation<JsonType>(
        DeserializeJSONInternal,
        data, transformKeys, target);
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
    instantiationMethod: InstantiationMethod = PropMetaData.deserializeInstantiationMethod
): T | null {
    return deserializationContinuation(
        DeserializeInternal,
        data, type, target, instantiationMethod);
}
