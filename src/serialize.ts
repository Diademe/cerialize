import { MetaData, MetaDataFlag } from "./meta_data";
import { cycleBreaking } from "./ref_cycle";
import { TypeString } from "./runtime_typing";
import {
    ASerializableType,
    DowncastPrimitive,
    Indexable,
    isPrimitiveType,
    JsonObject,
    JsonType,
    primitive,
    SerializablePrimitiveType,
    SerializableType
} from "./util";

let serializeBitMaskPrivate = Number.MAX_SAFE_INTEGER;

export function SelectiveSerialization(
    bitMask: number = Number.MAX_SAFE_INTEGER
) {
    serializeBitMaskPrivate = bitMask;
}

export function SerializeObjectMap<T>(
    source: T,
    type: ASerializableType<T>
): Indexable<JsonType> {
    if (source === null || source === void 0) {
        return null;
    }
    const target: Indexable<JsonType> = {};
    const keys = Object.keys(source);

    if (cycleBreaking(target, source)) {
        return target;
    }

    if (TypeString.getRuntimeTyping() && !isPrimitiveType(type())) {
        target.$type = TypeString.getStringFromType(source.constructor);
    }

    for (const key of keys) {
        const value = (source as any)[key];
        if (value !== void 0) {
            target[MetaData.serializeKeyTransform(key)] = Serialize(
                value,
                type
            );
        }
    }

    return target;
}

export function SerializeMap<K, V>(
    source: Map<K, V>,
    keyType: ASerializableType<K>,
    valueType: ASerializableType<V>,
): Indexable<JsonType> {
    if (source === null || source === void 0) {
        return null;
    }
    const target: Indexable<JsonType> = {};
    const keys = source.keys();

    if (cycleBreaking(target, source)) {
        return target;
    }

    if (TypeString.getRuntimeTyping()) {
        target.$type = TypeString.getStringFromType(source.constructor);
    }

    for (const key of keys) {
        const value = source.get(key);
        if (value !== void 0) {
            const keyTypeF = keyType() as Function;
            const isString = keyTypeF === String;
            const targetKey =
                isString ?
                MetaData.serializeKeyTransform(key as any) :
                key;
            const targetValue = Serialize(
                    value,
                    valueType
                );
            target[targetKey as any] = targetValue;
        }
    }

    return target;
}

export function SerializeArray<T>(
    source: T[],
    type: ASerializableType<T>
): JsonType[] {
    if (source === null || source === void 0) {
        return null;
    }
    const retn = new Array<JsonType>(source.length);
    for (let i = 0; i < source.length; i++) {
        retn[i] = Serialize(source[i], type);
    }
    return retn;
}

export function SerializeSet<T>(
    source: T[],
    type: ASerializableType<T>
): JsonType[] {
    return SerializeArray(Array.from(source.values()), type);
}

export function SerializePrimitive<T>(
    source: SerializablePrimitiveType,
    type: () => SerializablePrimitiveType
): JsonType {
    if (source === null || source === void 0) {
        return null;
    }

    const primitiveSource: primitive =
        source instanceof Object ? DowncastPrimitive(source) : source as primitive;

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

export function SerializeJSON(source: any, transformKeys = true): JsonType {
    if (source === null || source === void 0) {
        return null;
    }

    if (Array.isArray(source)) {
        const array = new Array<any>(source.length);
        for (let i = 0; i < source.length; i++) {
            array[i] = SerializeJSON(source[i], transformKeys);
        }
        return array;
    }

    const type = typeof source;

    if (type === "object") {
        if (source instanceof Date || source instanceof RegExp) {
            return source.toString();
        } else {
            const retn: Indexable<JsonType> = {};
            const keys = Object.keys(source);
            for (const key of keys) {
                const value = source[key];
                if (value !== void 0) {
                    const retnKey = transformKeys
                        ? MetaData.serializeKeyTransform(key)
                        : key;
                    retn[retnKey] = SerializeJSON(value, transformKeys);
                }
            }
            return retn;
        }
    } else if (type === "function") {
        return null;
    }

    return source;
}

export function Serialize<T>(
    instance: T,
    type: ASerializableType<T>
): JsonObject | null {
    if (instance === void 0 || instance === null) {
        return null;
    }

    const target: Indexable<JsonType> = {};

    if (TypeString.getRuntimeTyping() && !isPrimitiveType(type())) {
        target.$type = TypeString.getStringFromType(instance.constructor);
        type = () => (instance.constructor as SerializableType<T>);
    }

    const metadataList = MetaData.getMetaDataForType(type());

    // todo -- maybe move this to a Generic deserialize
    if (metadataList === null) {
        if (isPrimitiveType(type())) {
            return SerializePrimitive(instance as any, type as any) as any;
        } else {
            return target;
        }
    }

    if (cycleBreaking(target, instance)) {
        return target;
    }

    for (const metadata of metadataList) {
        if (!(metadata.bitMaskSerialize & serializeBitMaskPrivate)) {
            continue;
        }

        if (metadata.serializedKey === null) {
            continue;
        }

        const source = (instance as any)[metadata.keyName];

        if (source === void 0) {
            continue;
        }

        const keyName = metadata.getSerializedKey();
        const flags = metadata.flags;

        if ((flags & MetaDataFlag.SerializeMap) !== 0) {
            const val = SerializeMap(source,
                metadata.serializedKeyType,
                metadata.serializedValueType,
            );
            if (defaultValue(metadata, val)) {
                continue;
            }
            target[keyName] = val;
        } else if ((flags & MetaDataFlag.SerializeObjectMap) !== 0) {
            const val = SerializeObjectMap(source, metadata.serializedType);
            if (defaultValue(metadata, val)) {
                continue;
            }
            target[keyName] = val;
        } else if ((flags & MetaDataFlag.SerializeSet) !== 0) {
            const val = SerializeSet(source, metadata.serializedKeyType);
            if (defaultValue(metadata, val)) {
                continue;
            }
            target[keyName] = val;
        } else if ((flags & MetaDataFlag.SerializeArray) !== 0) {
            const val = SerializeArray(source, metadata.serializedKeyType);
            if (defaultValue(metadata, val)) {
                continue;
            }
            target[keyName] = val;
        } else if ((flags & MetaDataFlag.SerializePrimitive) !== 0) {
            const val = SerializePrimitive(
                source,
                metadata.serializedType as () => SerializablePrimitiveType
            );
            if (defaultValue(metadata, val)) {
                continue;
            }
            target[keyName] = val;
        } else if ((flags & MetaDataFlag.SerializeObject) !== 0) {
            const val = Serialize(source, metadata.serializedType);
            if (defaultValue(metadata, val)) {
                continue;
            }
            target[keyName] = val;
        } else if ((flags & MetaDataFlag.SerializeJSON) !== 0) {
            const val = SerializeJSON(
                source,
                (flags & MetaDataFlag.SerializeJSONTransformKeys) !== 0
            );
            if (defaultValue(metadata, val)) {
                continue;
            }
            target[keyName] = val;
        } else if ((flags & MetaDataFlag.SerializeUsing) !== 0) {
            const val = (metadata.serializedType as any)(source);
            if (defaultValue(metadata, val)) {
                continue;
            }
            target[keyName] = val;
        }
    }

    if (typeof type().onSerialized === "function") {
        const value = type().onSerialized(target, instance);
        if (value !== void 0) {
            return value as JsonObject;
        }
    }

    return target;
}

function defaultValue(metadata: MetaData, val: any) {
    if (metadata.emitDefaultValue === false) {
        if (val === null){
            return true;
        } else if (metadata.defaultValue !== undefined) {
            if (val instanceof Object){
                val = val.valueOf();
            }
            return val === metadata.defaultValue;
        } else {
            // tslint:disable-next-line:triple-equals
            return new (metadata.serializedType())().valueOf() === val;
        }
    }
    return false;
}
