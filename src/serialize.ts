import {
    cycleBreaking,
} from "./cycle";
import {
    ClassMetaData,
    isDefaultValue,
    PropMetaData,
    PropMetaDataFlag,
} from "./meta_data";
import {
    getRefHandler,
} from "./ref";
import {
    TypeString,
} from "./runtime_typing";
import {
    allObjectPrimitives,
    allPrimitives,
    ASerializableTypeOrArrayInternal,
    IConstructable,
    IIndexable,
    IJsonArray,
    IJsonObject,
    IObjectMap,
    ISerializableType,
    isItAnArrayInternal,
    IsReference,
    JsonType,
    primitive,
    SerializablePrimitiveType,
} from "./types";
import {
    DowncastPrimitive,
    isPrimitiveType,
} from "./utils";

let serializeBitMaskPrivate = Number.MAX_SAFE_INTEGER;

export function SelectiveSerialization(
    bitMask: number = Number.MAX_SAFE_INTEGER
) {
    serializeBitMaskPrivate = bitMask;
}

export function SerializeObjectMapInternal<T>(
    source: null,
    type: ASerializableTypeOrArrayInternal<T>
): null;
export function SerializeObjectMapInternal<T>(
    source: IObjectMap<T> & IConstructable,
    type: ASerializableTypeOrArrayInternal<T>
): IIndexable<JsonType>;
export function SerializeObjectMapInternal<T>(
    source: IObjectMap<T> & IConstructable | null,
    type: ASerializableTypeOrArrayInternal<T>
): IIndexable<JsonType> | null {
    if (source === null) {
        return null;
    }
    const target: IIndexable<JsonType> = {};
    const keys: string[] = Object.keys(source);

    const isReference = ClassMetaData.getMetaData(source.constructor).isReference;
    if (
        ClassMetaData.refCycleDetection && isReference !== IsReference.False ||
        isReference === IsReference.True
    ) {
        if (cycleBreaking.seen(source)) {
            getRefHandler().serializationSetRef(target, source);
            return target;
        }
        else {
            getRefHandler().serializationSetID(target, source);
        }
    }

    if (isItAnArrayInternal(type)) {
        if (TypeString.getRuntimeTyping()) {
            target.$type = TypeString.getStringFromType(source.constructor);
        }
    }
    else {
        if (TypeString.getRuntimeTyping() && !isPrimitiveType(type())) {
            target.$type = TypeString.getStringFromType(source.constructor);
        }

        for (const key of keys) {
            const value: T = source[key];
            if (value !== undefined) {
                target[PropMetaData.serializeKeyTransform(key)] = SerializeInternal(
                    value,
                    type
                );
            }
        }
    }

    return target;
}

export function SerializeMapInternal<K extends string | number, V>(
    source: null,
    keyType: () => StringConstructor | NumberConstructor,
    valueType: ASerializableTypeOrArrayInternal<V>,
): null;
export function SerializeMapInternal<K extends string | number, V>(
    source: Map<K, V>,
    keyType: () => StringConstructor | NumberConstructor,
    valueType: ASerializableTypeOrArrayInternal<V>,
): IIndexable<JsonType>;
export function SerializeMapInternal<K extends string | number, V>(
    source: Map<K, V> | null,
    keyType: () => StringConstructor | NumberConstructor,
    valueType: ASerializableTypeOrArrayInternal<V>,
): IIndexable<JsonType> | null {
    if (source === null) {
        return null;
    }
    const target: IIndexable<JsonType> = {};
    const keys = source.keys();

    const isReference = ClassMetaData.getMetaData(source.constructor).isReference;
    if (
        ClassMetaData.refCycleDetection && isReference !== IsReference.False ||
        isReference === IsReference.True
    ) {
        if (cycleBreaking.seen(source)) {
            getRefHandler().serializationSetRef(target, source);
            return target;
        }
        else {
            getRefHandler().serializationSetID(target, source);
        }
    }

    if (TypeString.getRuntimeTyping()) {
        target.$type = TypeString.getStringFromType(source.constructor);
    }

    for (const key of keys) {
        const value = source.get(key)!;
        if (value !== undefined) {
            let targetKey: string | number;
            const keyTypeF = keyType();
            function isStringConstructor(value: string | number): value is string {
                return keyTypeF === String;
            }
            targetKey = keyTypeF(isStringConstructor(key) ? PropMetaData.serializeKeyTransform(key) : key);
            const targetValue = SerializeInternal(
                value,
                valueType
            );
            target[targetKey] = targetValue;
        }
    }

    return target;
}


export function SerializeArrayInternal<T>(
    source: null,
    type: ASerializableTypeOrArrayInternal<T>
): null
export function SerializeArrayInternal<T>(
    source: T[],
    type: ASerializableTypeOrArrayInternal<T>
): JsonType[]
export function SerializeArrayInternal<T>(
    source: T[] | null,
    type: ASerializableTypeOrArrayInternal<T>
): JsonType[] | null {
    if (source === null) {
        return null;
    }
    const returnValue = new Array<JsonType>(source.length);
    for (let i = 0; i < source.length; i++) {
        returnValue[i] = SerializeInternal(source[i], type as any);
    }
    return returnValue;
}

export function SerializeSetInternal<T>(
    source: null,
    type: ASerializableTypeOrArrayInternal<T>
): null
export function SerializeSetInternal<T>(
    source: T[],
    type: ASerializableTypeOrArrayInternal<T>
): JsonType[]
export function SerializeSetInternal<T>(
    source: T[] | null,
    type: ASerializableTypeOrArrayInternal<T>
): JsonType[] | null {
    if (source === null) {
        return null;
    }
    return SerializeArrayInternal(Array.from(source.values()), type);
}

export function SerializePrimitiveInternal(
    source: null,
    type: () => SerializablePrimitiveType
): null;
export function SerializePrimitiveInternal(
    source: allPrimitives | Date | RegExp | String | Number | Boolean,
    type: () => SerializablePrimitiveType
): string | number | boolean | IJsonObject | IJsonArray;
export function SerializePrimitiveInternal(
    source: allPrimitives | Date | RegExp | String | Number | Boolean | null,
    type: () => SerializablePrimitiveType
): JsonType {
    if (source === null) {
        return null;
    }

    function isObjectPrimitive(
        value: string | number | boolean | Date | RegExp | String | Number | Boolean
    ): value is Date | RegExp | String | Number | Boolean {
           return source instanceof Object;
    }
    const primitiveSource: string | number | boolean = 
        isObjectPrimitive(source) ? DowncastPrimitive(source) : source as primitive;

    if (type() === String) {
        return String(primitiveSource);
    }

    if (type() === Boolean) {
        return Boolean(primitiveSource);
    }

    if (type() === Number) {
        const val = Number(primitiveSource);
        return isNaN(val as any) && !Number.isNaN(val as any) ?
            null : val;
    }

    if (type() === Date) {
        return primitiveSource.valueOf();
    }

    if (type() === RegExp) {
        return primitiveSource.toString();
    }

    return primitiveSource.toString();
}

export function SerializeJSONInternal(
    source: any,
    transformKeys = true
): JsonType {
    if (source === null) {
        return null;
    }

    if (Array.isArray(source)) {
        const array: IJsonArray = new Array(source.length);
        for (let i = 0; i < source.length; i++) {
            array[i] = SerializeJSONInternal(source[i], transformKeys);
        }
        return array;
    }

    const type = typeof source;

    if (type === "object") {
        if (source instanceof Date || source instanceof RegExp) {
            return source.toString();
        }
        else {
            const returnValue: IIndexable<JsonType> = {};
            const keys = Object.keys(source);
            for (const key of keys) {
                const value = source[key];
                if (value !== undefined) {
                    const returnValueKey = transformKeys
                        ? PropMetaData.serializeKeyTransform(key)
                        : key;
                    returnValue[returnValueKey] = SerializeJSONInternal(value, transformKeys);
                }
            }
            return returnValue;
        }
    }
    else if (type === "function") {
        return null;
    }

    return source;
}
export function SerializeInternal<T>(
    instance: null,
    type: ASerializableTypeOrArrayInternal<T>
): null;
export function SerializeInternal<T>(
    instance: allPrimitives | allObjectPrimitives,
    type: () => SerializablePrimitiveType
): string | number | boolean | IJsonObject | IJsonArray;
export function SerializeInternal<T>(
    instance: T & Partial<IConstructable>,
    type: ASerializableTypeOrArrayInternal<T>
): IJsonObject | JsonType[];
export function SerializeInternal<T>(
    instance: T & Partial<IConstructable> | allPrimitives | allObjectPrimitives | null,
    type: ASerializableTypeOrArrayInternal<T> | (() => SerializablePrimitiveType)
): null | JsonType[] | string | number | boolean | IJsonObject | IJsonArray {
    if (instance === undefined || instance === null) {
        return null;
    }

    const target: IIndexable<JsonType> = {};

    if (isItAnArrayInternal(type)) {
        const a = SerializeArrayInternal(instance as any, type.type);
        return a;
    }
    else {
        if (TypeString.getRuntimeTyping() && !isPrimitiveType(type())) {
            target.$type = TypeString.getStringFromType(instance.constructor!);
            type = () => (instance.constructor as ISerializableType<T>);
        }

        const metadataList = PropMetaData.getMetaDataForType(type());

        if (metadataList === null) {
            if (isPrimitiveType(type())) {
                return SerializePrimitiveInternal(
                    instance as allPrimitives | Date | RegExp | String | Number | Boolean,
                    type as () => SerializablePrimitiveType
                );
            }
            else {
                return target;
            }
        }
        const isReference = ClassMetaData.getMetaData(instance.constructor!).isReference;
        if (
            ClassMetaData.refCycleDetection && isReference !== IsReference.False ||
            isReference === IsReference.True
        ) {
            if (cycleBreaking.seen(instance as T & Partial<IConstructable>)) {
                getRefHandler().serializationSetRef(target, instance);
                return target;
            }
            else {
                getRefHandler().serializationSetID(target, instance);
            }
        }

        for (const metadata of metadataList) {
            if (!(metadata.bitMaskSerialize & serializeBitMaskPrivate)) {
                continue;
            }

            if (metadata.serializedKey === null) {
                continue;
            }

            const source = (instance as any)[metadata.keyName];

            if (source === undefined) {
                continue;
            }

            const keyName = metadata.getSerializedKey();
            const flags = metadata.flags;

            if ((flags & PropMetaDataFlag.SerializeMap) !== 0) {
                const val = SerializeMapInternal(
                    source,
                    metadata.serializedKeyType as () => StringConstructor | NumberConstructor,
                    metadata.serializedValueType!,
                );
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializeObjectMap) !== 0) {
                const val = SerializeObjectMapInternal(source, metadata.serializedType);
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializeSet) !== 0) {
                const val = SerializeSetInternal(source, metadata.serializedKeyType);
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializeArray) !== 0) {
                const val = SerializeArrayInternal(source, metadata.serializedKeyType);
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializePrimitive) !== 0) {
                const val = SerializePrimitiveInternal(
                    source,
                    metadata.serializedType as () => SerializablePrimitiveType
                );
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializeObject) !== 0) {
                const val = SerializeInternal(source, metadata.serializedType as any);
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializeJSON) !== 0) {
                const val = SerializeJSONInternal(
                    source,
                    (flags & PropMetaDataFlag.SerializeJSONTransformKeys) !== 0
                );
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializeUsing) !== 0) {
                const val = (metadata.serializedType as any)(source);
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
        }

        if (typeof (type() as ISerializableType<T>).onSerialized === "function") {
            const value = (type() as ISerializableType<T>).onSerialized!(target, instance as T);
            if (value !== undefined) {
                return value as IJsonObject;
            }
        }
        return target;
    }
}
