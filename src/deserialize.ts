import {
    ClassMetaData,
    getDefaultValue,
    PropMetaData,
    PropMetaDataFlag
} from "./meta_data";
import { getRefHandler } from "./ref";
import { TypeString } from "./runtime_typing";
import {
    getTarget,
    isPrimitiveType
} from "./utils";

import {
    ArrayHandling,
    ASerializableTypeOrArray,
    IConstructable,
    IIndexable,
    IJsonArray,
    IJsonObject,
    InstantiationMethod,
    ISerializableType,
    IsReference,
    ItIsAnArrayInternal,
    JsonType,
    SerializablePrimitiveType
} from "./types";

const keywords = ["$type"];
function notAKeyword(y: string) {
    return Array.from(getRefHandler().keyWord).concat(keywords).find((x) => x === y) === undefined;
}

export function DeserializeObjectMapInternal<T>(
    data: IJsonObject,
    type: ASerializableTypeOrArray<T>,
    target?: IIndexable<T>,
    instantiationMethod?: InstantiationMethod
): IIndexable<T> {
    if (typeof data !== "object") {
        throw new Error(
            "Expected input to be of type `object` but received: " + typeof data
        );
    }

    if (target === null || target === undefined) {
        target = {};
    }

    if (data === null || data === undefined) {
        return null;
    }

    const isReference = ClassMetaData.getMetaData(target.constructor).isReference;
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
                data[key] as any,
                type,
                target[key],
                instantiationMethod
            ) as T;
        }
    }

    return target;
}

export function DeserializeMapInternal<K, V, C extends Map<K, V>>(
    data: IJsonObject,
    keyType: ASerializableTypeOrArray<K>,
    valueType: ASerializableTypeOrArray<V>,
    constructor: () => C,
    target?: C,
    instantiationMethod?: InstantiationMethod
): Map<K, V> {
    if (typeof data !== "object") {
        throw new Error(
            "Expected input to be of type `object` but received: " + typeof data
        );
    }

    if (target === null || target === undefined) {
        target = new (constructor() as any)();
    }

    if (data === null || data === undefined) {
        return null;
    }

    // if we detect references, then if the reference is defined, return the corresponding object
    const isReference = ClassMetaData.getMetaData(target.constructor).isReference;
    if (
        ClassMetaData.refCycleDetection && isReference !== IsReference.False ||
        isReference === IsReference.True
        ) {
        const refObject = getRefHandler().deserializationGetObject(data);
        if (refObject !== undefined) {
            return refObject;
        }
        getRefHandler().deserializationRegisterObject(data, target);
    }

    const keys = Object.keys(data).filter(notAKeyword);
    for (const key of keys) {
        const value = data[key];
        if (value !== undefined) {
            const keyTypeF = keyType as () => Function;
            const isString = keyTypeF() === String;
            const keyName = (isString ?
                PropMetaData.deserializeKeyTransform(key) :
                DeserializeInternal<K>(
                    JSON.parse(key),
                    keyType,
                    null,
                    instantiationMethod
                )) as K;
            target.set(keyName, DeserializeInternal<V>(
                data[key] as any,
                valueType,
                target.get(keyName),
                instantiationMethod
            ));
        }
    }

    return target;
}

export function DeserializeArrayInternal<T, C extends T[]>(
    data: IJsonArray,
    type: ASerializableTypeOrArray<T>,
    constructor: () => IConstructable,
    handling: ArrayHandling,
    target?: C,
    instantiationMethod?: InstantiationMethod,
) {
    if (!Array.isArray(data)) {
        throw new Error(
            "Expected input to be an array but received: " + typeof data
        );
    }
    if (!Array.isArray(target)) {
        target = new (constructor() as any)();
    }
    let offset;
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
        target[offset + i] = DeserializeInternal(
            data[i] as any,
            type,
            target[offset + i],
            instantiationMethod
        ) as T;
    }

    return target;
}

export function DeserializeSetInternal<K, C extends Set<K>>(
    data: IJsonArray,
    keyType: ASerializableTypeOrArray<K>,
    constructor: () => IConstructable,
    target?: C,
    instantiationMethod?: InstantiationMethod
) {
    if (keyType instanceof ItIsAnArrayInternal) {
        target = DeserializeArrayInternal(
            data as any,
            keyType.type,
            keyType.ctor,
            keyType.handling,
            target as any,
            instantiationMethod
        );
    }
    else {
        if (!Array.isArray(data)) {
            throw new Error(
                "Expected input to be an array but received: " + typeof data
            );
        }

        if (!(target instanceof Set)){
            target = new (constructor() as any)();
        }

        for (const d of data) {
            target.add(DeserializeInternal(
                d as any,
                keyType,
                null,
                instantiationMethod
            ));
        }
    }

    return target;
}

export function DeserializeSet<T, C extends Set<T>>(
    data: IJsonArray,
    keyType: ASerializableTypeOrArray<T>,
    constructor: () => IConstructable = () => Set,
    target?: C,
    instantiationMethod?: InstantiationMethod
) {
    if (instantiationMethod === undefined) {
        instantiationMethod = PropMetaData.deserializeInstantiationMethod;
    }

    return DeserializeSetInternal(data, keyType, constructor, target, instantiationMethod);
}

export function DeserializePrimitive(
    data: any,
    type: () => SerializablePrimitiveType,
    target?: Date
) {
    if (type() === Date) {
        const deserializedDate = new Date(data as string);
        if (target instanceof Date) {
            target.setTime(deserializedDate.getTime());
        }
    else {
            return deserializedDate;
        }
    }
    else if (type() === RegExp) {
        const fragments = data.match(/\/(.*?)\/([gimy])?$/);
        return new RegExp(fragments[1], fragments[2] || "");
    }
    else if (data === null) {
        return null;
    }
    else {
        return (type() as any)(data);
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
            target = new Array<any>(data.length);
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
export function DeserializeInternal<T extends IIndexable>(
    data: IJsonObject | IJsonArray,
    type: ASerializableTypeOrArray<T>,
    target?: T,
    instantiationMethod?: InstantiationMethod
): T | null {
    if (type instanceof ItIsAnArrayInternal) {
        target = DeserializeArrayInternal(
            data as IJsonArray,
            type.type,
            type.ctor,
            type.handling,
            target as any,
            instantiationMethod
        );
    }
    else {
        if (data === null) {
            return undefined;
        }
        if (TypeString.getRuntimeTyping() && !isPrimitiveType(type()) && (data as IJsonObject).$type) {
            type = () => TypeString.getTypeFromString(
                (data as IJsonObject).$type
            ) as ISerializableType<T>;
        }
        let classType: Function;
        if (type()) {
            classType = type();
        }
        else if (target) {
            classType = target.constructor;
        }
        else {
            throw new Error("Can not infer the type of the class deserialized");
        }
        let isReference = ClassMetaData.getMetaData(classType).isReference;
        if (
            ClassMetaData.refCycleDetection && isReference !== IsReference.False ||
            isReference === IsReference.True
            ) {
            const refObject = getRefHandler().deserializationGetObject(data);
            if (refObject !== undefined) {
                return refObject as T;
            }
        }

        const metadataList = PropMetaData.getMetaDataForType(type());

        if (metadataList === null) {
            if (typeof type() === "function") {
                if (isPrimitiveType(type())) {
                    return DeserializePrimitive(data, type as any, target as any);
                }
                switch (instantiationMethod) {
                    case InstantiationMethod.New:
                        return new (type())();

                    case InstantiationMethod.ObjectCreate:
                        return Object.create(type().prototype);

                    default:
                        return {} as T;
                }
            }
            return null;
        }

        target = getTarget(type() as any, target, instantiationMethod) as T;
        isReference = ClassMetaData.getMetaData(target.constructor).isReference;
        if (
            ClassMetaData.refCycleDetection && isReference !== IsReference.False ||
            isReference === IsReference.True
            ) {
            getRefHandler().deserializationRegisterObject(data, target);
        }

        let onDeserialized = "";
        for (const metadata of metadataList) {
            if (metadata.flags === PropMetaDataFlag.onDeserialized){
                onDeserialized = metadata.keyName;
                continue;
            }

            if (metadata.deserializedKey === null) {
                continue;
            }

            const source: any = (data as IJsonObject)[metadata.getDeserializedKey()];
            const keyName = metadata.keyName;
            const flags = metadata.flags;

            const defVal = getDefaultValue(metadata, source);
            if (metadata.emitDefaultValue === false && (source === undefined || source === defVal)){
                target[keyName] = defVal;
                continue;
            }

            if (source === undefined) {
                continue;
            }

            if ((flags & PropMetaDataFlag.DeserializeObjectMap) !== 0) {
                target[keyName] = DeserializeObjectMapInternal(
                    source,
                    metadata.deserializedType,
                    target[keyName],
                    instantiationMethod
                );
            }
    else if ((flags & PropMetaDataFlag.DeserializeMap) !== 0) {
                target[keyName] = DeserializeMapInternal(
                    source,
                    metadata.deserializedKeyType,
                    metadata.deserializedValueType,
                    metadata.deserializedType as (() => MapConstructor),
                    target[keyName],
                    instantiationMethod
                );
            }
    else if ((flags & PropMetaDataFlag.DeserializeArray) !== 0) {
                target[keyName] = DeserializeArrayInternal(
                    source,
                    metadata.deserializedKeyType,
                    metadata.deserializedType as (() => IConstructable),
                    metadata.arrayHandling,
                    target[keyName],
                    instantiationMethod
                );
            }
    else if ((flags & PropMetaDataFlag.DeserializeSet) !== 0) {
                target[keyName] = DeserializeSetInternal(
                    source,
                    metadata.deserializedKeyType,
                    metadata.deserializedType as (() => IConstructable),
                    target[keyName],
                    instantiationMethod
                );
            }
    else if ((flags & PropMetaDataFlag.DeserializePrimitive) !== 0) {
                target[keyName] = DeserializePrimitive(
                    source,
                    metadata.deserializedType as (() => SerializablePrimitiveType),
                    target[keyName]
                );
            }
    else if ((flags & PropMetaDataFlag.DeserializeObject) !== 0) {
                target[keyName] = DeserializeInternal(
                    source,
                    metadata.deserializedType,
                    target[keyName],
                    instantiationMethod
                );
            }
    else if ((flags & PropMetaDataFlag.DeserializeJSON) !== 0) {
                target[keyName] = DeserializeJSONInternal(
                    source,
                    (flags & PropMetaDataFlag.DeserializeJSONTransformKeys) !== 0,
                    instantiationMethod
                );
            }
    else if ((flags & PropMetaDataFlag.DeserializeUsing) !== 0) {
                target[keyName] = (metadata.deserializedType as any)(
                    source,
                    target[keyName],
                    instantiationMethod
                );
            }
        }

        if (onDeserialized){
            target[onDeserialized]();
        }
    }

    return target as T;
}
