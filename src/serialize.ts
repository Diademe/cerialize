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
    onSerialized,
    primitive,
    SerializablePrimitiveType,
    Serializer,
} from "./types";
import {
    DowncastPrimitive,
    isPrimitiveType,
} from "./utils";

let serializeBitMaskPrivate = Number.MAX_SAFE_INTEGER;

export function SelectiveSerialization(
    bitMask: number = Number.MAX_SAFE_INTEGER
): void {
    serializeBitMaskPrivate = bitMask;
}

export function SerializeObjectMapInternal<T>(
    source: null,
    type: ASerializableTypeOrArrayInternal<T>
): null;
export function SerializeObjectMapInternal<T>(
    source: IObjectMap<T> & Partial<IConstructable>,
    type: ASerializableTypeOrArrayInternal<T>
): IIndexable<JsonType>;
export function SerializeObjectMapInternal<T>(
    source: IObjectMap<T> & Partial<IConstructable> | null,
    type: ASerializableTypeOrArrayInternal<T>
): IIndexable<JsonType> | null {
    if (source === null) {
        return null;
    }
    const target: IIndexable<JsonType> = {};
    const keys: string[] = Object.keys(source);

    const isReference: IsReference = ClassMetaData.getMetaDataOrDefault(source.constructor).isReference;
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

export function SerializeMapInternal<V>(
    source: null,
    keyType: () => (StringConstructor | NumberConstructor),
    valueType: ASerializableTypeOrArrayInternal<V>
): null;
export function SerializeMapInternal<V>(
    source: Map<string | number, V>,
    keyType: () => (StringConstructor | NumberConstructor),
    valueType: ASerializableTypeOrArrayInternal<V>
): IIndexable<JsonType>;
export function SerializeMapInternal<V>(
    source: Map<string | number, V> | null,
    keyType: () => (StringConstructor | NumberConstructor),
    valueType: ASerializableTypeOrArrayInternal<V>
): IIndexable<JsonType> | null {
    if (source === null) {
        return null;
    }
    const target: IIndexable<JsonType> = {};
    const keys = source.keys();

    const isReference: IsReference = ClassMetaData.getMetaDataOrDefault(source.constructor).isReference;
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
        const value = source.get(key) as V;
        if (value !== undefined) {
            const keyTypeF = keyType();
            function isStringConstructor(val: string | number): val is string {
                return keyTypeF === String;
            }
            const targetKey = keyTypeF(isStringConstructor(key) ? PropMetaData.serializeKeyTransform(key) : key);
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
): null;
export function SerializeArrayInternal<T>(
    source: T[],
    type: ASerializableTypeOrArrayInternal<T>
): IJsonArray;
export function SerializeArrayInternal<T>(
    source: T[] | null,
    type: ASerializableTypeOrArrayInternal<T>
): IJsonArray | null {
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
): null;
export function SerializeSetInternal<T>(
    source: T[],
    type: ASerializableTypeOrArrayInternal<T>
): IJsonArray;
export function SerializeSetInternal<T>(
    source: T[] | null,
    type: ASerializableTypeOrArrayInternal<T>
): IJsonArray | null {
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
    source: unknown,
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
            const keys = Object.keys(source as object);
            for (const key of keys) {
                const value = (source as IIndexable<unknown>)[key];
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

    return source as string | number | boolean;
}
export function SerializeInternal<T>(
    instance: null,
    type: ASerializableTypeOrArrayInternal<T>
): null;
export function SerializeInternal<T>(
    instance: allPrimitives | allObjectPrimitives | T & Partial<IConstructable>,
    type: ASerializableTypeOrArrayInternal<T> | (() => SerializablePrimitiveType)
): string | number | boolean | IJsonObject | IJsonArray;
export function SerializeInternal<T>(
    instance: T & Partial<IConstructable> | allPrimitives | allObjectPrimitives | null,
    type: ASerializableTypeOrArrayInternal<T> | (() => SerializablePrimitiveType)
): JsonType {
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
            if (!instance.constructor) {
                throw new Error("Can not guess the type of the class serialized");
            }
            target.$type = TypeString.getStringFromType(instance.constructor);
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

        const isReference: IsReference = ClassMetaData.getMetaDataOrDefault(instance.constructor).isReference;
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

            const source: unknown = (instance as T)[metadata.keyName as keyof T];

            if (source === undefined) {
                continue;
            }

            const keyName = metadata.getSerializedKey();
            const flags = metadata.flags;

            if ((flags & PropMetaDataFlag.SerializeMap) !== 0) {
                const val: IIndexable<JsonType> = SerializeMapInternal(
                    source as Map<string | number, unknown>,
                    metadata.serializedKeyType as () => (StringConstructor | NumberConstructor),
                    metadata.serializedValueType as ASerializableTypeOrArrayInternal<unknown>
                );
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializeObjectMap) !== 0) {
                const val: IIndexable<JsonType> = SerializeObjectMapInternal(
                    source as IObjectMap<unknown>,
                    metadata.serializedType
                );
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializeSet) !== 0) {
                const val: IJsonArray = SerializeSetInternal(
                    source as unknown[],
                    metadata.serializedKeyType
                );
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializeArray) !== 0) {
                const val: IJsonArray = SerializeArrayInternal(
                    source as unknown[],
                    metadata.serializedKeyType
                );
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializePrimitive) !== 0) {
                const val: string | number | boolean | IJsonObject | IJsonArray = SerializePrimitiveInternal(
                    source as allPrimitives | Date | RegExp | String | Number | Boolean,
                    metadata.serializedType as () => SerializablePrimitiveType
                );
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
            else if ((flags & PropMetaDataFlag.SerializeObject) !== 0) {
                const val: string | number | boolean | IJsonObject | IJsonArray = SerializeInternal(
                    source as allPrimitives | allObjectPrimitives | T & Partial<IConstructable>,
                    metadata.serializedType as ASerializableTypeOrArrayInternal<unknown> | (() => SerializablePrimitiveType)
                );
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
                const val: JsonType = (metadata.serializedType as unknown as Serializer<unknown>)(source);
                if (isDefaultValue(metadata, source)) {
                    continue;
                }
                target[keyName] = val;
            }
        }

        const callback = (type() as onSerialized<T>).onSerialized;
        if (typeof callback === "function") {
            const value = callback(target, instance as T);
            if (value !== undefined && value !== null) {
                return value;
            }
        }
        return target;
    }
}
