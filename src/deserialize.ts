import { getDefaultValue, MetaData, MetaDataFlag } from "./meta_data";
import { getReference, referenceHandling, setId } from "./ref_cycle";
import { TypeString } from "./runtime_typing";
import {
    getTarget,
    isPrimitiveType
} from "./utils";

import {
    ASerializableType,
    ASerializableTypeOrArray,
    IConstructable,
    IIndexable,
    IJsonArray,
    IJsonObject,
    InstantiationMethod,
    ISerializableType,
    ItIsAnArrayInternal,
    JsonType,
    SerializablePrimitiveType
} from "./types";

const keywords = ["$id", "$type", "$ref"];
function notAKeyword(y: string) {
    return keywords.find((x) => x === y) === undefined;
}

function _DeserializeObjectMap<T>(
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

    const tmp = { a: target as IIndexable<T> };
    if (referenceHandling(data, tmp)) {
        return tmp.a;
    }
    target = tmp.a;

    const keys = Object.keys(data).filter(notAKeyword);
    for (const key of keys) {
        const value = data[key];
        if (value !== undefined) {
            target[MetaData.deserializeKeyTransform(key)] = _Deserialize(
                data[key] as any,
                type,
                target[key],
                instantiationMethod
            ) as T;
        }
    }

    return target;
}

function _DeserializeMap<K, V, C extends Map<K, V>>(
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

    const tmp = { a: target as C };
    if (referenceHandling(data, tmp)) {
        return tmp.a;
    }
    target = tmp.a;

    const keys = Object.keys(data).filter(notAKeyword);
    for (const key of keys) {
        const value = data[key];
        if (value !== undefined) {
            const keyTypeF = keyType as () => Function;
            const isString = keyTypeF() === String;
            const keyName = (isString ?
                MetaData.deserializeKeyTransform(key) :
                _Deserialize<K>(
                    JSON.parse(key),
                    keyType,
                    null,
                    instantiationMethod
                )) as K;
            target.set(keyName, _Deserialize<V>(
                data[key] as any,
                valueType,
                target.get(keyName),
                instantiationMethod
            ));
        }
    }

    return target;
}

export function DeserializeMap<K, V>(
    data: IJsonObject,
    keyType: ASerializableTypeOrArray<K>,
    valueType: ASerializableTypeOrArray<V>,
    target?: Map<K, V>,
    instantiationMethod?: InstantiationMethod
): Map<K, V> {
    if (instantiationMethod === undefined) {
        instantiationMethod = MetaData.deserializeInstantiationMethod;
    }

    return _DeserializeMap(data, keyType, valueType, () => Map as any, null, instantiationMethod);
}

export function DeserializeObjectMap<T>(
    data: IJsonObject,
    valueType: ASerializableTypeOrArray<T>,
    target?: IIndexable<T>,
    instantiationMethod?: InstantiationMethod
): IIndexable<T> {
    if (instantiationMethod === undefined) {
        instantiationMethod = MetaData.deserializeInstantiationMethod;
    }

    return _DeserializeObjectMap(data, valueType, target, instantiationMethod);
}

function _DeserializeArray<T, C extends T[]>(
    data: IJsonArray,
    type: ASerializableTypeOrArray<T>,
    constructor: () => IConstructable,
    target?: C,
    instantiationMethod?: InstantiationMethod
) {
    if (!Array.isArray(data)) {
        throw new Error(
            "Expected input to be an array but received: " + typeof data
        );
    }
    if (!Array.isArray(target)) {
        target = new (constructor() as any)();
    }

    target.length = data.length;
    for (let i = 0; i < data.length; i++) {
        target[i] = _Deserialize(
            data[i] as any,
            type,
            target[i],
            instantiationMethod
        ) as T;
    }

    return target;
}

export function DeserializeArray<T, C extends T[]>(
    data: IJsonArray,
    type: ASerializableTypeOrArray<T>,
    constructor: () => IConstructable = () => Array,
    target?: C,
    instantiationMethod?: InstantiationMethod
) {
    if (instantiationMethod === undefined) {
        instantiationMethod = MetaData.deserializeInstantiationMethod;
    }

    return _DeserializeArray(data, type, constructor, target, instantiationMethod);
}

function _DeserializeSet<K, C extends Set<K>>(
    data: IJsonArray,
    keyType: ASerializableTypeOrArray<K>,
    constructor: () => IConstructable,
    target?: C,
    instantiationMethod?: InstantiationMethod
) {
    if (keyType instanceof ItIsAnArrayInternal) {
        target = _DeserializeArray(
            data as any,
            keyType.type,
            keyType.ctor,
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
            target.add(_Deserialize(
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
        instantiationMethod = MetaData.deserializeInstantiationMethod;
    }

    return _DeserializeSet(data, keyType, constructor, target, instantiationMethod);
}

function DeserializePrimitive(
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

export function DeserializeJSON(
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
            (target as JsonType[])[i] = DeserializeJSON(
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
                    ? MetaData.deserializeKeyTransform(key)
                    : key;
                returnValue[returnValueKey] = DeserializeJSON(
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
function _Deserialize<T extends IIndexable>(
    data: IJsonObject | IJsonArray,
    type: ASerializableTypeOrArray<T>,
    target?: T,
    instantiationMethod?: InstantiationMethod
): T | null {
    if (type instanceof ItIsAnArrayInternal) {
        target = _DeserializeArray(
            data as IJsonArray,
            type.type,
            type.ctor,
            target as any,
            instantiationMethod
        );
    }
    else {
        if (data === null) {
            return undefined;
        }
        const tmp1 = {a: {}};
        if (getReference(data, tmp1)) {
            return tmp1.a as T;
        }
        if (TypeString.getRuntimeTyping() && !isPrimitiveType(type()) && (data as IJsonObject).$type) {
            type = () => TypeString.getTypeFromString(
                (data as IJsonObject).$type
            ) as ISerializableType<T>;
        }

        const metadataList = MetaData.getMetaDataForType(type());

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
        setId(data, target);

        let onDeserialized = "";
        for (const metadata of metadataList) {
            if (metadata.flags === MetaDataFlag.onDeserialized){
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

            if ((flags & MetaDataFlag.DeserializeObjectMap) !== 0) {
                target[keyName] = _DeserializeObjectMap(
                    source,
                    metadata.deserializedType,
                    target[keyName],
                    instantiationMethod
                );
            }
    else if ((flags & MetaDataFlag.DeserializeMap) !== 0) {
                target[keyName] = _DeserializeMap(
                    source,
                    metadata.deserializedKeyType,
                    metadata.deserializedValueType,
                    metadata.deserializedType as (() => MapConstructor),
                    target[keyName],
                    instantiationMethod
                );
            }
    else if ((flags & MetaDataFlag.DeserializeArray) !== 0) {
                target[keyName] = _DeserializeArray(
                    source,
                    metadata.deserializedKeyType,
                    metadata.deserializedType as (() => IConstructable),
                    target[keyName],
                    instantiationMethod
                );
            }
    else if ((flags & MetaDataFlag.DeserializeSet) !== 0) {
                target[keyName] = _DeserializeSet(
                    source,
                    metadata.deserializedKeyType,
                    metadata.deserializedType as (() => IConstructable),
                    target[keyName],
                    instantiationMethod
                );
            }
    else if ((flags & MetaDataFlag.DeserializePrimitive) !== 0) {
                target[keyName] = DeserializePrimitive(
                    source,
                    metadata.deserializedType as (() => SerializablePrimitiveType),
                    target[keyName]
                );
            }
    else if ((flags & MetaDataFlag.DeserializeObject) !== 0) {
                target[keyName] = _Deserialize(
                    source,
                    metadata.deserializedType,
                    target[keyName],
                    instantiationMethod
                );
            }
    else if ((flags & MetaDataFlag.DeserializeJSON) !== 0) {
                target[keyName] = DeserializeJSON(
                    source,
                    (flags & MetaDataFlag.DeserializeJSONTransformKeys) !== 0,
                    instantiationMethod
                );
            }
    else if ((flags & MetaDataFlag.DeserializeUsing) !== 0) {
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
    instantiationMethod?: InstantiationMethod
): T | null {
    if (instantiationMethod === undefined) {
        instantiationMethod = MetaData.deserializeInstantiationMethod;
    }

    return _Deserialize(data, type, target, instantiationMethod);
}

export function DeserializeRaw<T>(
    data: IJsonObject,
    type: ASerializableTypeOrArray<T>,
    target?: T
): T | null {
    return _Deserialize(data, type, target, InstantiationMethod.None);
}

export function DeserializeArrayRaw<T>(
    data: IJsonArray,
    type: ASerializableTypeOrArray<T>,
    target?: T[]
): T[] | null {
    return _DeserializeArray(data, type, () => Array, target, InstantiationMethod.None);
}

export function DeserializeMapRaw<T>(
    data: IIndexable<JsonType>,
    type: ASerializableTypeOrArray<T>,
    target?: IIndexable<T>
): IIndexable<T> | null {
    return _DeserializeObjectMap(data, type, target, InstantiationMethod.None);
}
