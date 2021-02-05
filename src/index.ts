import {
    cleanCycleBreaking,
} from "./cycle";
import {
    DeserializeArrayInternal,
    DeserializeInternal,
    DeserializeJSONInternal,
    DeserializeMapInternal,
    DeserializeObjectMapInternal,
} from "./deserialize";
import {
    ClassMetaData,
    PropMetaData,
} from "./meta_data";
import {
    getRefHandler,
} from "./ref";
import {
    SerializeArrayInternal,
    SerializeInternal,
    SerializeJSONInternal,
    SerializeMapInternal,
    SerializeObjectMapInternal,
    SerializePrimitiveInternal,
    SerializeSetInternal,
} from "./serialize";
import {
    NoOp,
} from "./string_transforms";
import {
    ArrayHandling,
    ASerializableType,
    ASerializableTypeOrArrayInternal,
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
    serializationContinuation,
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
    JsonType,
    IJsonObject,
    IJsonArray
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

export function itIsAnArray<
    Value = any,
    T extends Value[] = Value[],
    C extends new () => T = new () => T>(
        arrayElementType: ASerializableTypeOrArrayInternal<Value>,
        arrayConstructor?: () => C
    ): ItIsAnArrayInternal {
    return new ItIsAnArrayInternal<Value, T, C>(arrayElementType, arrayConstructor);
}

/*
Serialization
*/
export function Serialize<T>(source: T, type: ItIsAnArrayInternal): JsonType[];
export function Serialize<T>(source: T, type: ASerializableType<T>): IJsonObject;
export function Serialize<T>(
    source: T,
    type: ASerializableTypeOrArrayInternal<T>
): null | JsonType[] | IJsonObject {
    return serializationContinuation(SerializeInternal, source, type as any);
}

export function SerializeJSON(sourceJSON: any, transformKeys = true): JsonType {
    return serializationContinuation(SerializeJSONInternal, sourceJSON, transformKeys);
}

// () => SerializablePrimitiveType  ==> ASerializablePrimitiveType
// todo ASerializablePrimitiveTypeOrArrayInternal for type
/**
 * Serialize a primitive variable or an array of primitives variables
 * with itIsAnArray :
 *      SerializePrimitive([1], itIsAnArray(() => Number)))
 * @param primitiveSource primitive variable for serialization
 * @param type type of primitive (e.g. () => Number)
 */
export function SerializePrimitive<T>(
    primitiveSource: SerializablePrimitiveType,
    type: () => SerializablePrimitiveType
): JsonType {
    return serializationContinuation(SerializePrimitiveInternal, primitiveSource, type);
}

export function SerializeSet<T>(
    setSource: T[],
    setElementType: ASerializableTypeOrArrayInternal<T>
): JsonType[] {
    return serializationContinuation(SerializeSetInternal, setSource, setElementType);
}

// todo split signature as in SerializeAs
export function SerializeArray<T>(
    sourceArray: T[],
    arrayElementType: ASerializableTypeOrArrayInternal<T>
): JsonType[] {
    return serializationContinuation(SerializeArrayInternal, sourceArray, arrayElementType);
}

export function SerializeMap<K, V>(
    sourceMap: Map<K, V>,
    keyType: ASerializableTypeOrArrayInternal<K>,
    valueType: ASerializableTypeOrArrayInternal<V>,
): IIndexable<JsonType> {
    return serializationContinuation(SerializeMapInternal, sourceMap, keyType, valueType);
}

export function SerializeObjectMap<T>(
    objectMapSource: T,
    valueType: ASerializableTypeOrArrayInternal<T>
): IIndexable<JsonType> {
    return serializationContinuation(SerializeObjectMapInternal, objectMapSource, valueType);
}

/*
Deserialization
*/
export function DeserializeObjectMap<T>(
    data: IJsonObject,
    valueType: ASerializableTypeOrArrayInternal<T>,
    targetObjectMap?: IIndexable<T>,
    instantiationMethod: InstantiationMethod = PropMetaData.deserializeInstantiationMethod
): IIndexable<T> {
    return deserializationContinuation<IIndexable<T>>(
        DeserializeObjectMapInternal,
        data, valueType, targetObjectMap, instantiationMethod);
}

export function DeserializeMap<K, V>(
    data: IJsonObject,
    keyType: ASerializableTypeOrArrayInternal<K>,
    valueType: ASerializableTypeOrArrayInternal<V>,
    targetMap?: Map<K, V>,
    instantiationMethod: InstantiationMethod = PropMetaData.deserializeInstantiationMethod
): Map<K, V> {
    return deserializationContinuation<Map<K, V>>(
        DeserializeMapInternal,
        data, keyType, valueType, () => Map as any, targetMap, instantiationMethod);
}

export function DeserializeArray<T, C extends T[]>(
    data: IJsonArray,
    arrayType: ASerializableTypeOrArrayInternal<T>,
    handling: ArrayHandling = ArrayHandling.Into,
    targetArray?: C,
    instantiationMethod: InstantiationMethod = PropMetaData.deserializeInstantiationMethod
) {
    return deserializationContinuation<C>(
        DeserializeArrayInternal,
        data, arrayType, () => Array, handling, targetArray, instantiationMethod);
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
    type: ASerializableTypeOrArrayInternal<T>,
    target?: T,
    instantiationMethod: InstantiationMethod = PropMetaData.deserializeInstantiationMethod
): T | null {
    return deserializationContinuation(
        DeserializeInternal,
        data, type, target, instantiationMethod);
}
