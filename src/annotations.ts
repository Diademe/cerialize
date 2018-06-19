import { MetaData, MetaDataFlag } from "./meta_data";
import {
    ASerializableType,
    IConstructable,
    ISerializer,
    isPrimitiveType,
    primitive,
    SerializeFn,
    setBitConditionally
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

export function serializeAs(type: ASerializableType<any>, keyName?: string) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = type;
        metadata.flags |= MetaDataFlag.SerializeObject;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            isPrimitiveType(type())
        );
    };
}

export function serializeAsArray<T>(
    type: ASerializableType<T>,
    keyName?: string
) {
    return function(target: any, actualKeyName: string): any {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = type;
        metadata.flags |= MetaDataFlag.SerializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            isPrimitiveType(type())
        );
    };
}

export function serializeAsObjectMap<T>(type: ASerializableType<T>, keyName?: string) {
    return function(target: any, actualKeyName: string): any {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = type;
        metadata.flags |= MetaDataFlag.SerializeObjectMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            isPrimitiveType(type())
        );
    };
}

export function serializeAsSet<T>(
    type: ASerializableType<T>,
    constructor?: () => IConstructable,
    keyName?: string) {
    return function(target: any, actualKeyName: string): any {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedKeyType = type;
        metadata.serializedType = constructor as any || (() => Set);
        metadata.flags |= MetaDataFlag.SerializeSet;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            isPrimitiveType(type())
        );
    };
}

export function serializeAsMap(
    keyType: ASerializableType<any>,
    valueType: ASerializableType<any>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = constructor ? constructor as any : () => Map;
        metadata.serializedKeyType = keyType;
        metadata.serializedValueType = valueType;
        metadata.flags |= MetaDataFlag.SerializeMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            isPrimitiveType(valueType())
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

export function deserializeAs(type: ASerializableType<any>, keyName?: string) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = type;
        metadata.flags |= MetaDataFlag.DeserializeObject;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            isPrimitiveType(type())
        );
    };
}

export function deserializeAsArray(
    type: ASerializableType<any>,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = type;
        metadata.flags |= MetaDataFlag.DeserializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            isPrimitiveType(type())
        );
    };
}

export function deserializeAsSet(
    type: ASerializableType<any>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedKeyType = type;
        metadata.deserializedType = constructor as any || (() => Set);
        metadata.flags |= MetaDataFlag.DeserializeSet;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            isPrimitiveType(type())
        );
    };
}

export function deserializeAsMap(
    keyType: ASerializableType<any>,
    valueType: ASerializableType<any>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = constructor ? constructor as any : () => Map;
        metadata.deserializedKeyType = keyType;
        metadata.deserializedValueType = valueType;
        metadata.flags |= MetaDataFlag.DeserializeMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            isPrimitiveType(valueType())
        );
    };
}

export function deserializeAsObjectMap(
    type: ASerializableType<any>,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = type;
        metadata.flags |= MetaDataFlag.DeserializeObjectMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            isPrimitiveType(type())
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

export function autoserializeAs(type: ASerializableType<any>, keyName?: string) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedType = type;
        metadata.serializedType = type;
        metadata.flags |=
            MetaDataFlag.SerializeObject | MetaDataFlag.DeserializeObject;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            isPrimitiveType(type())
        );
    };
}

export function autoserializeAsArray(
    type: ASerializableType<any>,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedType = type;
        metadata.serializedType = type;
        metadata.flags |=
            MetaDataFlag.SerializeArray | MetaDataFlag.DeserializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            isPrimitiveType(type())
        );
    };
}

export function autoserializeAsSet(
    type: ASerializableType<any>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedKeyType = type;
        metadata.serializedKeyType = type;
        metadata.deserializedType = constructor as any || (() => Set);
        metadata.serializedType = constructor as any || (() => Set);
        metadata.flags |=
            MetaDataFlag.SerializeSet | MetaDataFlag.DeserializeSet;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            isPrimitiveType(type())
        );
    };
}

export function autoserializeAsObjectMap(
    type: ASerializableType<any>,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedType = type;
        metadata.serializedType = type;
        metadata.flags |=
            MetaDataFlag.SerializeObjectMap | MetaDataFlag.DeserializeObjectMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            isPrimitiveType(type())
        );
    };
}

export function autoserializeAsMap(
    keyType: ASerializableType<any>,
    valueType: ASerializableType<any>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedType = constructor ? constructor as any : () => Map;
        metadata.serializedType = constructor ? constructor as any : () => Map;
        metadata.serializedKeyType = keyType;
        metadata.serializedValueType = valueType;
        metadata.deserializedKeyType = keyType;
        metadata.deserializedValueType = valueType;
        metadata.flags |=
            MetaDataFlag.SerializeMap | MetaDataFlag.DeserializeMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            isPrimitiveType(keyType())
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
