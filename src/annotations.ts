import { MetaData, MetaDataFlag } from "./meta_data";
import {
    ASerializableType,
    IConstructable,
    ISerializer,
    isPrimitiveType,
    primitive,
    SerializablePrimitiveType,
    SerializeFn,
    setBitConditionally,
    Type
} from "./util";

// set a bitmask B. during compilation, if B & x, then the member will be serialized
export function serializeBitMask(bitMask: number): any {
    return function(target: any, actualKeyName: string): any {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.bitMaskSerialize = bitMask;
    };
}

export function serializeUsing(serializer: SerializeFn, keyName?: string) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = serializer as any;
        metadata.flags |= MetaDataFlag.SerializeUsing;
    };
}

export function serializeAs<T>(type: Type<T>, keyName?: string) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = functionType;
        metadata.flags |= MetaDataFlag.SerializeObject;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            isPrimitive
        );
    };
}

export function serializeAsArray<T>(
    type: Type<T>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: any, actualKeyName: string): any {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedKeyType = functionType;
        metadata.serializedType = constructor as any || (() => Array);
        metadata.flags |= MetaDataFlag.SerializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            isPrimitive
        );
    };
}

export function serializeAsObjectMap<T>(type: Type<T>, keyName?: string) {
    return function(target: any, actualKeyName: string): any {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = functionType;
        metadata.flags |= MetaDataFlag.SerializeObjectMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            isPrimitive
        );
    };
}

export function serializeAsSet<T>(
    type: Type<T>,
    constructor?: () => IConstructable,
    keyName?: string) {
    return function(target: any, actualKeyName: string): any {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedKeyType = functionType;
        metadata.serializedType = constructor as any || (() => Set);
        metadata.flags |= MetaDataFlag.SerializeSet;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            isPrimitive
        );
    };
}

export function serializeAsMap<K, V>(
    keyType: Type<K>,
    valueType: Type<V>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(valueType);
        const functionKeyType = isPrimitiveType(keyType) ?
            () => (keyType as SerializablePrimitiveType) : keyType as ASerializableType<K>;
        const functionValueType = isPrimitive ?
            () => (valueType as SerializablePrimitiveType) : valueType as ASerializableType<V>;
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = constructor ? constructor as any : () => Map;
        metadata.serializedKeyType = functionKeyType;
        metadata.serializedValueType = functionValueType;
        metadata.flags |= MetaDataFlag.SerializeMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            isPrimitive
        );
    };
}

export function serializeAsJson(
    keyNameOrTransformKeys?: boolean | string,
    transformKeys = true
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey =
            typeof keyNameOrTransformKeys === "string"
                ? keyNameOrTransformKeys
                : actualKeyName;
        metadata.flags |= MetaDataFlag.SerializeJSON;
        const shouldTransformKeys =
            typeof keyNameOrTransformKeys === "boolean"
                ? keyNameOrTransformKeys
                : transformKeys;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializeJSONTransformKeys,
            shouldTransformKeys
        );
    };
}

export function deserializeUsing(serializer: SerializeFn, keyName?: string) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = serializer as any;
        metadata.flags |= MetaDataFlag.DeserializeUsing;
    };
}

export function deserializeAs<T>(type: Type<T>, keyName?: string) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = functionType;
        metadata.flags |= MetaDataFlag.DeserializeObject;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            isPrimitive
        );
    };
}

export function deserializeAsArray<T>(
    type: Type<T>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedKeyType = functionType;
        metadata.deserializedType = constructor as any || (() => Array);
        metadata.flags |= MetaDataFlag.DeserializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            isPrimitive
        );
    };
}

export function deserializeAsSet<T>(
    type: Type<T>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedKeyType = functionType;
        metadata.deserializedType = constructor as any || (() => Set);
        metadata.flags |= MetaDataFlag.DeserializeSet;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            isPrimitive
        );
    };
}

export function deserializeAsMap<K, V>(
    keyType: Type<K>,
    valueType: Type<V>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(valueType);
        const functionKeyType = isPrimitiveType(keyType) ?
            () => (keyType as SerializablePrimitiveType) : keyType as ASerializableType<K>;
        const functionValueType = isPrimitive ?
            () => (valueType as SerializablePrimitiveType) : valueType as ASerializableType<V>;

        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = constructor ? constructor as any : () => Map;
        metadata.deserializedKeyType = functionKeyType;
        metadata.deserializedValueType = functionValueType;
        metadata.flags |= MetaDataFlag.DeserializeMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            isPrimitive
        );
    };
}

export function deserializeAsObjectMap<T>(
    type: Type<T>,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = functionType;
        metadata.flags |= MetaDataFlag.DeserializeObjectMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            isPrimitive
        );
    };
}

export function deserializeAsJson(
    keyNameOrTransformKeys?: boolean | string,
    transformKeys = true
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey =
            typeof keyNameOrTransformKeys === "string"
                ? keyNameOrTransformKeys
                : actualKeyName;
        metadata.flags |= MetaDataFlag.DeserializeJSON;
        const shouldTransformKeys =
            typeof keyNameOrTransformKeys === "boolean"
                ? keyNameOrTransformKeys
                : transformKeys;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializeJSONTransformKeys,
            shouldTransformKeys
        );
    };
}

export function autoserializeUsing(
    serializer: ISerializer<any>,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const key = keyName ? keyName : actualKeyName;
        metadata.serializedKey = key;
        metadata.deserializedKey = key;
        metadata.serializedType = serializer.Serialize as any;
        metadata.deserializedType = serializer.Deserialize as any;
        metadata.flags |= MetaDataFlag.AutoUsing;
    };
}

export function autoserializeAs<T>(type: Type<T>, keyName?: string) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedType = functionType;
        metadata.serializedType = functionType;
        metadata.flags |=
            MetaDataFlag.SerializeObject | MetaDataFlag.DeserializeObject;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            isPrimitive
        );
    };
}

export function autoserializeAsArray<T>(
    type: Type<T>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedKeyType = functionType;
        metadata.serializedKeyType = functionType;
        metadata.deserializedType = constructor as any || (() => Array);
        metadata.serializedType = constructor as any || (() => Array);
        metadata.flags |=
            MetaDataFlag.SerializeArray | MetaDataFlag.DeserializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            isPrimitive
        );
    };
}

export function autoserializeAsSet<T>(
    type: Type<T>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedKeyType = functionType;
        metadata.serializedKeyType = functionType;
        metadata.deserializedType = constructor as any || (() => Set);
        metadata.serializedType = constructor as any || (() => Set);
        metadata.flags |=
            MetaDataFlag.SerializeSet | MetaDataFlag.DeserializeSet;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            isPrimitive
        );
    };
}

export function autoserializeAsObjectMap<T>(
    type: Type<T>,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(type);
        const functionType = isPrimitive ? () => (type as SerializablePrimitiveType) : type as ASerializableType<T>;
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedType = functionType;
        metadata.serializedType = functionType;
        metadata.flags |=
            MetaDataFlag.SerializeObjectMap | MetaDataFlag.DeserializeObjectMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            isPrimitive
        );
    };
}

export function autoserializeAsMap<K, V>(
    keyType: Type<K>,
    valueType: Type<V>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    if (!(typeof keyType === "function") || !(typeof valueType === "function")){
        throw Error("optimization removed:\nkeyType: " +
        (keyType as Function).toString() +
        "\nvalueType: " + (valueType as Function).toString());
    }
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const isPrimitive = isPrimitiveType(valueType);
        const functionKeyType = isPrimitiveType(keyType) ?
            () => (keyType as SerializablePrimitiveType) : keyType as ASerializableType<K>;
        const functionValueType = isPrimitive ?
            () => (valueType as SerializablePrimitiveType) : valueType as ASerializableType<V>;

        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedType = constructor ? constructor as any : () => Map;
        metadata.serializedType = constructor ? constructor as any : () => Map;
        metadata.serializedKeyType = functionKeyType;
        metadata.serializedValueType = functionValueType;
        metadata.deserializedKeyType = functionKeyType;
        metadata.deserializedValueType = functionValueType;
        metadata.flags |=
            MetaDataFlag.SerializeMap | MetaDataFlag.DeserializeMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            isPrimitive
        );
    };
}

export function autoserializeAsJson(
    keyNameOrTransformKeys?: boolean | string,
    transformKeys = true
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const key =
            typeof keyNameOrTransformKeys === "string"
                ? keyNameOrTransformKeys
                : actualKeyName;
        const shouldTransformKeys =
            typeof keyNameOrTransformKeys === "boolean"
                ? keyNameOrTransformKeys
                : transformKeys;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.flags |=
            MetaDataFlag.SerializeJSON | MetaDataFlag.DeserializeJSON;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoJSONTransformKeys,
            shouldTransformKeys
        );
    };
}

export function inheritSerialization(parentType: () => IConstructable) {
    return function(childType: Function) {
        if (parentType() === undefined){
            throw new Error("@inheritSerialization called with undefined argument");
        }
        MetaData.inheritMetaData(parentType(), childType);
    };
}

export function emitDefaultValue(emitDefaultValue: boolean) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.emitDefaultValue = emitDefaultValue;
    };
}

export function onDeserialized(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.flags = MetaDataFlag.onDeserialized;
}

export function defaultValue(instance: primitive) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.defaultValue = instance;
    };
}
