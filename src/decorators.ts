import { MetaData, MetaDataFlag } from "./meta_data";
import {
    ASerializableTypeOrArray,
    IConstructable,
    ISerializer,
    ItIsAnArrayInternal,
    primitive,
    SerializeFn,
} from "./types";
import {
    isPrimitiveAnonymousType,
    setBitConditionally
} from "./utils";

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

export function serializeAs(type: ASerializableTypeOrArray<any>, keyName?: string) {
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
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function serializeAsArray<T>(
    type: ASerializableTypeOrArray<T>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return function(target: any, actualKeyName: string): any {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedKeyType = type;
        metadata.serializedType = constructor as any || (() => Array);
        metadata.flags |= MetaDataFlag.SerializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.SerializePrimitive,
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function serializeAsObjectMap<T>(type: ASerializableTypeOrArray<T>, keyName?: string) {
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
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function serializeAsSet<T>(
    type: ASerializableTypeOrArray<T>,
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
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function serializeAsMap(
    keyType: ASerializableTypeOrArray<any>,
    valueType: ASerializableTypeOrArray<any>,
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
            valueType instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(valueType)
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

export function deserializeAs(type: ASerializableTypeOrArray<any>, keyName?: string) {
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
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function deserializeAsArray(
    type: ASerializableTypeOrArray<any>,
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
        metadata.deserializedType = constructor as any || (() => Array);
        metadata.flags |= MetaDataFlag.DeserializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function deserializeAsSet(
    type: ASerializableTypeOrArray<any>,
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
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function deserializeAsMap(
    keyType: ASerializableTypeOrArray<any>,
    valueType: ASerializableTypeOrArray<any>,
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
            valueType instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(valueType)
        );
    };
}

export function deserializeAsObjectMap(
    valueType: ASerializableTypeOrArray<any>,
    keyName?: string
) {
    return function(target: IConstructable, actualKeyName: string): void {
        const metadata = MetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = valueType;
        metadata.flags |= MetaDataFlag.DeserializeObjectMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.DeserializePrimitive,
            valueType instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(valueType)
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

export function autoserializeAs(type: ASerializableTypeOrArray<any>, keyName?: string) {
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
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function autoserializeAsArray(
    type: ASerializableTypeOrArray<any>,
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
        metadata.deserializedType = constructor as any || (() => Array);
        metadata.serializedType = constructor as any || (() => Array);
        metadata.flags |=
            MetaDataFlag.SerializeArray | MetaDataFlag.DeserializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            MetaDataFlag.AutoPrimitive,
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function autoserializeAsSet(
    type: ASerializableTypeOrArray<any>,
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
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function autoserializeAsObjectMap(
    type: ASerializableTypeOrArray<any>,
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
            type instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function autoserializeAsMap(
    keyType: ASerializableTypeOrArray<any>,
    valueType: ASerializableTypeOrArray<any>,
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
            valueType instanceof ItIsAnArrayInternal ? false : isPrimitiveAnonymousType(valueType)
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
