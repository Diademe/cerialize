import {
    ClassMetaData,
    getDefaultValue,
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
    ArrayHandling,
    ASerializableTypeOrArrayInternal,
    deserializedCallback,
    Deserializer,
    IConstructable,
    IIndexable,
    IJsonArray,
    IJsonObject,
    InstantiationMethod,
    IPlainObject,
    ISerializableType,
    isItAnArrayInternal,
    IsReference,
    JsonType,
    SerializablePrimitiveType,
} from "./types";
import {
    getTarget,
    isPrimitiveType,
} from "./utils";

const keywords = ["$type"];
function notAKeyword(y: string) {
    return Array.from(getRefHandler().keyWord).concat(keywords).find((x) => x === y) === undefined;
}

export function DeserializeObjectMapInternal<T>(
    data: null,
    valueType: ASerializableTypeOrArrayInternal<T>,
    target?: IPlainObject,
    instantiationMethod?: InstantiationMethod
): null;
export function DeserializeObjectMapInternal<T>(
    data: IJsonObject,
    valueType: ASerializableTypeOrArrayInternal<T>,
    target?: IPlainObject,
    instantiationMethod?: InstantiationMethod
): IPlainObject;
export function DeserializeObjectMapInternal<T>(
    data: IJsonObject | IJsonArray | null,
    valueType: ASerializableTypeOrArrayInternal<T>,
    target?: IPlainObject,
    instantiationMethod: InstantiationMethod  = InstantiationMethod.New
): IPlainObject | null {
    if (data === null) {
        return null;
    }

    function isJsonObject(variable: IJsonObject | IJsonArray): variable is IJsonObject {
        return typeof data === "object";
    }
    if (!isJsonObject(data)) {
        throw new Error(
            "Expected input to be of type `object` but received: " + typeof data
        );
    }

    if (target === null || target === undefined) {
        target = {}; // we don't allow to create specify a constructor for the ObjectMap
    }

    const isReference: IsReference = ClassMetaData.getMetaDataOrDefault(target.constructor).isReference;
    if (
        ClassMetaData.refCycleDetection && isReference !== IsReference.False ||
        isReference === IsReference.True
    ) {
        const refObject = getRefHandler().deserializationGetObject(data);
        if (refObject !== undefined) {
            return refObject as IIndexable<T>;
        }
    }

    const keys = Object.keys(data).filter(notAKeyword);
    for (const key of keys) {
        const value = data[key];
        if (value !== undefined) {
            target[PropMetaData.deserializeKeyTransform(key)] = DeserializeInternal(
                value as IJsonObject | IJsonArray,
                valueType,
                target[key],
                instantiationMethod
            ) as T;
        }
    }

    return target;
}

export function DeserializeMapInternal<
    K extends StringConstructor | NumberConstructor,
    V,
    T extends Map<string | number, V>, C extends new () => T
> (
    data: null,
    keyType: () => K,
    valueType: ASerializableTypeOrArrayInternal<V>,
    mapConstructor: () => C,
    target?: T,
    instantiationMethod?: InstantiationMethod
): null;
export function DeserializeMapInternal<
    K extends StringConstructor | NumberConstructor,
    V,
    T extends Map<string | number, V>, C extends new () => T
> (
    data: IJsonObject,
    keyType: () => K,
    valueType: ASerializableTypeOrArrayInternal<V>,
    mapConstructor: () => C,
    target?: T,
    instantiationMethod?: InstantiationMethod
): T;
export function DeserializeMapInternal<
    K extends StringConstructor | NumberConstructor,
    V,
    T extends Map<string | number, V>,
    C extends new () => T
> (
    data: IJsonObject | null,
    keyType: () => K,
    valueType: ASerializableTypeOrArrayInternal<V>,
    mapConstructor: () => C,
    target?: T,
    instantiationMethod?: InstantiationMethod
): T | null {
    if (typeof data !== "object") {
        throw new Error(
            "Expected input to be of type `object` but received: " + typeof data
        );
    }

    if (target === null || target === undefined) {
        target = new (mapConstructor())();
    }

    if (data === null) {
        return null;
    }

    // if we detect references, then if the reference is defined, return the corresponding object
    const isReference: IsReference = ClassMetaData.getMetaDataOrDefault(target.constructor).isReference;
    if (
        ClassMetaData.refCycleDetection && isReference !== IsReference.False ||
        isReference === IsReference.True
    ) {
        const refObject = getRefHandler().deserializationGetObject(data);
        if (refObject !== undefined) {
            return refObject as T;
        }
        getRefHandler().deserializationRegisterObject(data, target);
    }

    const keys = Object.keys(data).filter(notAKeyword);
    for (const key of keys) {
        const value = data[key];
        if (value !== undefined) {
            if (isItAnArrayInternal(keyType)) {
                throw new Error("a key can not be an array");
            }
            const keyTypeF = keyType() as StringConstructor | NumberConstructor;
            const isString = keyTypeF === String;
            if (keyTypeF !== String && keyTypeF !== Number) {
                throw new Error("a key must be a primitive type");
            }
            const keyName = keyTypeF(
                isString ?
                PropMetaData.deserializeKeyTransform(key) :
                key
            );
            target.set(keyName, DeserializeInternal<V>(
                data[key] as IJsonObject,
                valueType,
                target.get(keyName),
                instantiationMethod
            ) as V);
        }
    }

    return target;
}
export function DeserializeArrayInternal<
    Value,
    T extends (Value | null)[],
    C extends new () => T>(
        data: null,
        type: ASerializableTypeOrArrayInternal<Value>,
        arrayConstructor: () => C,
        handling: ArrayHandling,
        target?: T,
        instantiationMethod?: InstantiationMethod
): null;
export function DeserializeArrayInternal<
    Value,
    T extends (Value | null)[],
    C extends new () => T>(
        data: IJsonArray,
        type: ASerializableTypeOrArrayInternal<Value>,
        arrayConstructor: () => C,
        handling: ArrayHandling,
        target?: T,
        instantiationMethod?: InstantiationMethod
): T;
export function DeserializeArrayInternal<
    Value,
    T extends (Value | null)[],
    C extends new () => T>(
        data: IJsonArray | null,
        type: ASerializableTypeOrArrayInternal<Value>,
        arrayConstructor: () => C,
        handling: ArrayHandling,
        target?: T,
        instantiationMethod?: InstantiationMethod
): T | null {
    if (data === null) {
        return null;
    }

    if (!Array.isArray(data)) {
        throw new Error(
            "Expected input to be an array but received: " + typeof data
        );
    }
    if (!Array.isArray(target)) {
        target = new (arrayConstructor())();
    }
    let offset: number;
    switch (handling) {
        case ArrayHandling.Into:
            offset = 0;
            target.length = data.length;
            break;
        case ArrayHandling.New:
            offset = 0;
            target.length = 0;
            break;
        case ArrayHandling.ConcatAtTheEnd:
            offset = target.length;
            break;
    }
    for (let i = 0; i < data.length; i++) {
        target[offset + i] = DeserializeInternal<Value>(
            data[i] as IJsonObject | IJsonArray,
            type,
            target[offset + i] as Value,
            instantiationMethod
        ) as Value;
    }

    return target;
}

export function DeserializeSetInternal<
    K,
    T extends Set<K>,
    C extends new () => T>(
    data: null,
    keyType: ASerializableTypeOrArrayInternal<K>,
    setConstructor: () => C,
    target?: T,
    instantiationMethod?: InstantiationMethod
): null;
export function DeserializeSetInternal<
    K,
    T extends Set<K>,
    C extends new () => T>(
    data: IJsonArray,
    keyType: ASerializableTypeOrArrayInternal<K>,
    setConstructor: () => C,
    target?: T,
    instantiationMethod?: InstantiationMethod
): T;
export function DeserializeSetInternal<
    K,
    T extends Set<K>,
    C extends new () => T>(
    data: IJsonArray | null,
    keyType: ASerializableTypeOrArrayInternal<K>,
    setConstructor: () => C,
    target?: T,
    instantiationMethod?: InstantiationMethod
): T | null {
    if (data === null) {
        return null;
    }

    if (!Array.isArray(data)) {
        throw new Error(
            "Expected input to be an array but received: " + typeof data
        );
    }

    if (!(target instanceof Set)) {
        target = new (setConstructor())();
    }

    for (const d of data) {
        target.add(DeserializeInternal(
            d as IJsonObject | IJsonArray,
            keyType,
            undefined,
            instantiationMethod
        ) as K);
    }

    return target;
}

export function DeserializeSet<
    K,
    T extends Set<K>,
    C extends new () => T>(
    data: null,
    keyType: ASerializableTypeOrArrayInternal<K>,
    setConstructor: () => C,
    target?: T,
    instantiationMethod?: InstantiationMethod
): null;
export function DeserializeSet<
    K,
    T extends Set<K>,
    C extends new () => T>(
    data: IJsonArray,
    keyType: ASerializableTypeOrArrayInternal<K>,
    setConstructor: () => C,
    target?: T,
    instantiationMethod?: InstantiationMethod
): T;
export function DeserializeSet<
    K,
    T extends Set<K>,
    C extends new () => T>(
    data: IJsonArray | null,
    keyType: ASerializableTypeOrArrayInternal<K>,
    setConstructor: () => C = (() => Set as unknown as C),
    target?: T,
    instantiationMethod: InstantiationMethod = PropMetaData.deserializeInstantiationMethod
): T | null {
    if (data === null) {
        return null;
    }

    return DeserializeSetInternal(data, keyType, setConstructor, target, instantiationMethod);
}

export function DeserializePrimitive(
    data: null,
    type: () => SerializablePrimitiveType,
    target?: Date
): null;
export function DeserializePrimitive(
    data: allPrimitives | allObjectPrimitives,
    type: () => SerializablePrimitiveType,
    target?: Date
): allPrimitives;
export function DeserializePrimitive(
    data: allPrimitives | allObjectPrimitives | null,
    type: () => SerializablePrimitiveType,
    target?: Date
): allPrimitives | null {
    if (data === null) {
        return null;
    }
    else if (type() === Date) {
        const deserializedDate = new Date(data as string);
        if (target instanceof Date) {
            target.setTime(deserializedDate.getTime());
            return target;
        }
        else {
            return deserializedDate;
        }
    }
    else if (type() === RegExp) {
        const fragments = /\/(.*?)\/([gimy])?$/.exec(data as string) as RegExpExecArray;
        return new RegExp(fragments[1], fragments[2] || "");
    }
    else {
        return (type())(data);
    }
}

export function DeserializeJSONInternal(
    data: JsonType,
    transformKeys = true,
    target?: JsonType
): JsonType {
    target = {};
    if (Array.isArray(data)) {
        if (!Array.isArray(target)) {
            target = new Array(data.length);
        }

        (target as JsonType[]).length = data.length;

        for (let i = 0; i < data.length; i++) {
            (target as JsonType[])[i] = DeserializeJSONInternal(
                data[i],
                transformKeys,
                (target as JsonType[])[i]
            );
        }
        return target;
    }

    const type = typeof data;

    if (type === "object") {
        const returnValue = (target && typeof target === "object"
            ? target
            : {}) as IIndexable<JsonType>;
        const keys = Object.keys(data as object);
        for (const key of keys) {
            const value = (data as IIndexable<JsonType>)[key];
            if (value !== undefined) {
                const returnValueKey = transformKeys
                    ? PropMetaData.deserializeKeyTransform(key)
                    : key;
                returnValue[returnValueKey] = DeserializeJSONInternal(
                    (data as IIndexable<JsonType>)[key],
                    transformKeys
                );
            }
        }
        return returnValue;
    }
    else if (type === "function") {
        throw new Error(
            "Cannot deserialize a function, input is not a valid json object"
        );
    }
    // primitive case
    return data;
}


export function DeserializeInternal<T>(
    data: null,
    type: ASerializableTypeOrArrayInternal<T>,
    target?: T & Partial<IConstructable>,
    instantiationMethod?: InstantiationMethod
): null;
export function DeserializeInternal<T>(
    data: IJsonObject | IJsonArray,
    type: ASerializableTypeOrArrayInternal<T>,
    target?: (T & Partial<IConstructable>) | (T & Partial<IConstructable>)[],
    instantiationMethod?: InstantiationMethod
): T | T[];
export function DeserializeInternal<T>(
    data: allPrimitives | allObjectPrimitives,
    type: () => SerializablePrimitiveType,
    target?: (T & Partial<IConstructable>),
    instantiationMethod?: InstantiationMethod
): Date | RegExp | string | number | boolean;
export function DeserializeInternal<T, K extends keyof T>(
    data: IJsonObject | IJsonArray | allPrimitives | allObjectPrimitives | null,
    type: ASerializableTypeOrArrayInternal<T> | (() => SerializablePrimitiveType),
    target?: (T & Partial<IConstructable>) | (T & Partial<IConstructable>)[],
    instantiationMethod: InstantiationMethod = InstantiationMethod.New
): T | T[] | allPrimitives | null {
    if (data === null) {
        return null;
    }
    if (isItAnArrayInternal(type)) {
        target = DeserializeArrayInternal(
            data as IJsonArray,
            type.type,
            type.ctor,
            type.handling,
            target as T[],
            instantiationMethod
        );
    }
    else {
        if (TypeString.getRuntimeTyping() && !isPrimitiveType(type()) && (data as IJsonObject).$type) {
            type = () => TypeString.getTypeFromString(
                (data as IJsonObject).$type as string
            ) as ISerializableType<T>;
        }
        let classType: Function;
        if (type()) {
            classType = type();
        }
        else if (target?.constructor) {
            classType = target.constructor;
        }
        else {
            throw new Error("Can not guess the type of the class deserialized");
        }
        let isReference: IsReference = ClassMetaData.getMetaDataOrDefault(classType).isReference;
        if (
            ClassMetaData.refCycleDetection && isReference !== IsReference.False ||
            isReference === IsReference.True
        ) {
            const refObject = getRefHandler().deserializationGetObject(data as IJsonObject);
            if (refObject !== undefined) {
                return refObject as T;
            }
        }

        const metadataList = PropMetaData.getMetaDataForType(type());

        if (metadataList === null) {
            if (typeof type() === "function") {
                if (isPrimitiveType(type())) {
                    return DeserializePrimitive(
                        data as allPrimitives | allObjectPrimitives,
                        type as () => SerializablePrimitiveType,
                        target as Date | undefined
                    );
                }
                switch (instantiationMethod) {
                    case InstantiationMethod.New:
                        return new (type() as ISerializableType<T>)();

                    case InstantiationMethod.ObjectCreate:
                        return Object.create(type().prototype) as T;

                    default:
                        return {} as T;
                }
            }
            return null;
        }

        target = getTarget(type() as ISerializableType<T>, target, instantiationMethod) as T;
        isReference = ClassMetaData.getMetaDataOrDefault(classType).isReference;
        if (
            ClassMetaData.refCycleDetection && isReference !== IsReference.False ||
            isReference === IsReference.True
        ) {
            getRefHandler().deserializationRegisterObject(data as IJsonObject, target);
        }

        let onDeserializedCallbackName: K | null = null;
        for (const metadata of metadataList) {
            if (metadata.flags === PropMetaDataFlag.onDeserialized) {
                onDeserializedCallbackName = metadata.keyName as K;
                continue;
            }

            if (metadata.deserializedKey === null) {
                continue;
            }

            const source: unknown = (data as IJsonObject)[metadata.getDeserializedKey()];
            const keyName = metadata.keyName as K;
            const flags = metadata.flags;

            const defVal: unknown = getDefaultValue(metadata, source);
            if (metadata.emitDefaultValue === false && (source === undefined || source === defVal)) {
                target[keyName] = defVal as T[K];
                continue;
            }

            if (source === undefined) {
                continue;
            }

            if ((flags & PropMetaDataFlag.DeserializeObjectMap) !== 0) {
                target[keyName] = DeserializeObjectMapInternal(
                    source as IJsonObject,
                    metadata.deserializedType,
                    target[keyName],
                    instantiationMethod
                ) as T[K];
            }
            else if ((flags & PropMetaDataFlag.DeserializeMap) !== 0) {
                target[keyName] = DeserializeMapInternal(
                    source as IJsonObject,
                    metadata.deserializedKeyType as () => (StringConstructor | NumberConstructor),
                    metadata.deserializedValueType as ASerializableTypeOrArrayInternal<unknown>,
                    metadata.deserializedType as (() => MapConstructor),
                    target[keyName] as unknown as Map<string | number, unknown>,
                    instantiationMethod
                ) as unknown as T[K];
            }
            else if ((flags & PropMetaDataFlag.DeserializeArray) !== 0) {
                target[keyName] = DeserializeArrayInternal(
                    source as IJsonArray,
                    metadata.deserializedKeyType,
                    metadata.deserializedType as (() => ArrayConstructor),
                    metadata.arrayHandling,
                    target[keyName] as unknown as unknown[],
                    instantiationMethod
                ) as unknown as T[K];
            }
            else if ((flags & PropMetaDataFlag.DeserializeSet) !== 0) {
                target[keyName] = DeserializeSetInternal(
                    source as IJsonArray,
                    metadata.deserializedKeyType,
                    metadata.deserializedType as (() => SetConstructor),
                    target[keyName] as unknown as Set<unknown>,
                    instantiationMethod
                ) as unknown as T[K];
            }
            else if ((flags & PropMetaDataFlag.DeserializePrimitive) !== 0) {
                target[keyName] = DeserializePrimitive(
                    source as allPrimitives | allObjectPrimitives,
                    metadata.deserializedType as (() => SerializablePrimitiveType),
                    target[keyName] as unknown as undefined | Date
                ) as unknown as T[K];
            }
            else if ((flags & PropMetaDataFlag.DeserializeObject) !== 0) {
                target[keyName] = DeserializeInternal(
                    source as IJsonObject | IJsonArray,
                    metadata.deserializedType,
                    target[keyName],
                    instantiationMethod
                )as unknown as T[K];
            }
            else if ((flags & PropMetaDataFlag.DeserializeJSON) !== 0) {
                target[keyName] = DeserializeJSONInternal(
                    source as JsonType,
                    (flags & PropMetaDataFlag.DeserializeJSONTransformKeys) !== 0,
                    instantiationMethod
                ) as unknown as T[K];
            }
            else if ((flags & PropMetaDataFlag.DeserializeUsing) !== 0) {
                target[keyName] = (metadata.deserializedType as unknown as Deserializer<T[K]>)(
                    source as JsonType,
                    target[keyName],
                    instantiationMethod
                ) as unknown as T[K];
            }
        }

        if (onDeserializedCallbackName !== null) {
            (target[onDeserializedCallbackName] as unknown as deserializedCallback<T>) (
                data as IJsonObject,
                target,
                instantiationMethod
            );
        }
    }

    return target as T;
}
