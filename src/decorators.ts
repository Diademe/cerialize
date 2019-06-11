import {
    ClassMetaData,
    PropMetaData,
    PropMetaDataFlag
} from "./meta_data";
import {
    ArrayHandling,
    ASerializableTypeOrArrayInternal,
    IConstructable,
    ISerializer,
    isItAnArrayInternal,
    IsReference,
    SerializeFn
} from "./types";
import {
    isPrimitiveAnonymousType,
    setBitConditionally
} from "./utils";

/** set a bitmask B. during compilation, if B & x, then the member will be serialized */
export function serializeBitMask(bitMask: number): any {
    return (target: any, actualKeyName: string): any => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.bitMaskSerialize = bitMask;
    };
}

export function serializeUsing(serializer: SerializeFn, keyName?: string) {
    return (target: IConstructable, actualKeyName: string): void => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = serializer as any;
        metadata.flags |= PropMetaDataFlag.SerializeUsing;
    };
}

export function serializeAs(type: ASerializableTypeOrArrayInternal<any>, keyName?: string) {
    return (target: IConstructable, actualKeyName: string): void => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = type;
        metadata.flags |= PropMetaDataFlag.SerializeObject;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.SerializePrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function serializeAsArray<T>(
    type: ASerializableTypeOrArrayInternal<T>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return (target: any, actualKeyName: string): any  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedKeyType = type;
        metadata.serializedType = constructor as any || (() => Array);
        metadata.flags |= PropMetaDataFlag.SerializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.SerializePrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function serializeAsObjectMap<T>( type: ASerializableTypeOrArrayInternal<T>, keyName?: string) {
    return (target: any, actualKeyName: string): any  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = type;
        metadata.flags |= PropMetaDataFlag.SerializeObjectMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.SerializePrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function serializeAsSet<T>(
    type: ASerializableTypeOrArrayInternal<T>,
    constructor?: () => IConstructable,
    keyName?: string) {
    return (target: any, actualKeyName: string): any  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedKeyType = type;
        metadata.serializedType = constructor as any || (() => Set);
        metadata.flags |= PropMetaDataFlag.SerializeSet;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.SerializePrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function serializeAsMap(
    keyType: ASerializableTypeOrArrayInternal<any>,
    valueType: ASerializableTypeOrArrayInternal<any>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey = keyName ? keyName : actualKeyName;
        metadata.serializedType = constructor ? constructor as any : () => Map;
        metadata.serializedKeyType = keyType;
        metadata.serializedValueType = valueType;
        metadata.flags |= PropMetaDataFlag.SerializeMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.SerializePrimitive,
            isItAnArrayInternal(valueType) ? false : isPrimitiveAnonymousType(valueType)
        );
    };
}

export function serializeAsJson(
    keyNameOrTransformKeys?: boolean | string,
    transformKeys = true
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.serializedKey =
            typeof keyNameOrTransformKeys === "string"
                ? keyNameOrTransformKeys
                : actualKeyName;
        metadata.flags |= PropMetaDataFlag.SerializeJSON;
        const shouldTransformKeys =
            typeof keyNameOrTransformKeys === "boolean"
                ? keyNameOrTransformKeys
                : transformKeys;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.SerializeJSONTransformKeys,
            shouldTransformKeys
        );
    };
}

export function deserializeUsing(serializer: SerializeFn, keyName?: string) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = serializer as any;
        metadata.flags |= PropMetaDataFlag.DeserializeUsing;
    };
}

export function deserializeAs(type: ASerializableTypeOrArrayInternal<any>, keyName?: string) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = type;
        metadata.flags |= PropMetaDataFlag.DeserializeObject;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.DeserializePrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function deserializeAsArray(
    type: ASerializableTypeOrArrayInternal<any>,
    constructor?: () => IConstructable,
    keyName?: string,
    handling: ArrayHandling = ArrayHandling.Into
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedKeyType = type;
        metadata.deserializedType = constructor as any || (() => Array);
        metadata.arrayHandling = handling;
        metadata.flags |= PropMetaDataFlag.DeserializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.DeserializePrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function deserializeAsSet(
    type: ASerializableTypeOrArrayInternal<any>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedKeyType = type;
        metadata.deserializedType = constructor as any || (() => Set);
        metadata.flags |= PropMetaDataFlag.DeserializeSet;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.DeserializePrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function deserializeAsMap(
    keyType: ASerializableTypeOrArrayInternal<any>,
    valueType: ASerializableTypeOrArrayInternal<any>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = constructor ? constructor as any : () => Map;
        metadata.deserializedKeyType = keyType;
        metadata.deserializedValueType = valueType;
        metadata.flags |= PropMetaDataFlag.DeserializeMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.DeserializePrimitive,
            isItAnArrayInternal(valueType) ? false : isPrimitiveAnonymousType(valueType)
        );
    };
}

export function deserializeAsObjectMap(
    valueType: ASerializableTypeOrArrayInternal<any>,
    keyName?: string
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey = keyName ? keyName : actualKeyName;
        metadata.deserializedType = valueType;
        metadata.flags |= PropMetaDataFlag.DeserializeObjectMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.DeserializePrimitive,
            isItAnArrayInternal(valueType) ? false : isPrimitiveAnonymousType(valueType)
        );
    };
}

export function deserializeAsJson(
    keyNameOrTransformKeys?: boolean | string,
    transformKeys = true
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.deserializedKey =
            typeof keyNameOrTransformKeys === "string"
                ? keyNameOrTransformKeys
                : actualKeyName;
        metadata.flags |= PropMetaDataFlag.DeserializeJSON;
        const shouldTransformKeys =
            typeof keyNameOrTransformKeys === "boolean"
                ? keyNameOrTransformKeys
                : transformKeys;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.DeserializeJSONTransformKeys,
            shouldTransformKeys
        );
    };
}

export function autoserializeUsing(
    serializer: ISerializer<any>,
    keyName?: string
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const key = keyName ? keyName : actualKeyName;
        metadata.serializedKey = key;
        metadata.deserializedKey = key;
        metadata.serializedType = serializer.Serialize as any;
        metadata.deserializedType = serializer.Deserialize as any;
        metadata.flags |= PropMetaDataFlag.AutoUsing;
    };
}

export function autoserializeAs(type: ASerializableTypeOrArrayInternal<any>, keyName?: string) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedType = type;
        metadata.serializedType = type;
        metadata.flags |=
            PropMetaDataFlag.SerializeObject | PropMetaDataFlag.DeserializeObject;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.AutoPrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function autoserializeAsArray(
    type: ASerializableTypeOrArrayInternal<any>,
    constructor?: () => IConstructable,
    keyName?: string,
    handling: ArrayHandling = ArrayHandling.Into
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
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
        metadata.arrayHandling = handling;
        metadata.flags |=
            PropMetaDataFlag.SerializeArray | PropMetaDataFlag.DeserializeArray;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.AutoPrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function autoserializeAsSet(
    type: ASerializableTypeOrArrayInternal<any>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
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
            PropMetaDataFlag.SerializeSet | PropMetaDataFlag.DeserializeSet;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.AutoPrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function autoserializeAsObjectMap(
    type: ASerializableTypeOrArrayInternal<any>,
    keyName?: string
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        const key = keyName ? keyName : actualKeyName;
        metadata.deserializedKey = key;
        metadata.serializedKey = key;
        metadata.deserializedType = type;
        metadata.serializedType = type;
        metadata.flags |=
            PropMetaDataFlag.SerializeObjectMap | PropMetaDataFlag.DeserializeObjectMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.AutoPrimitive,
            isItAnArrayInternal(type) ? false : isPrimitiveAnonymousType(type)
        );
    };
}

export function autoserializeAsMap(
    keyType: ASerializableTypeOrArrayInternal<any>,
    valueType: ASerializableTypeOrArrayInternal<any>,
    constructor?: () => IConstructable,
    keyName?: string
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
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
            PropMetaDataFlag.SerializeMap | PropMetaDataFlag.DeserializeMap;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.AutoPrimitive,
            isItAnArrayInternal(valueType) ? false : isPrimitiveAnonymousType(valueType)
        );
    };
}

export function autoserializeAsJson(
    keyNameOrTransformKeys?: boolean | string,
    transformKeys = true
) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
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
            PropMetaDataFlag.SerializeJSON | PropMetaDataFlag.DeserializeJSON;
        metadata.flags = setBitConditionally(
            metadata.flags,
            PropMetaDataFlag.AutoJSONTransformKeys,
            shouldTransformKeys
        );
    };
}

export function inheritSerialization(parentType: () => IConstructable) {
    return (childType: Function): void => {
        if (parentType() === undefined){
            throw new Error("@inheritSerialization called with undefined argument");
        }
        PropMetaData.inheritMetaData(parentType(), childType);
    };
}

export function emitDefaultValue(DefaultValue: boolean) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.emitDefaultValue = DefaultValue;
    };
}

export function onDeserialized(target: IConstructable, actualKeyName: string): void {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.flags = PropMetaDataFlag.onDeserialized;
}

export function defaultValue(instance: Object) {
    return (target: IConstructable, actualKeyName: string): void  => {
        const metadata = PropMetaData.getMetaData(
            target.constructor,
            actualKeyName
        );
        metadata.defaultValue = instance;
    };
}

/**
 * Class decorator
 * override global setting RefCycleDetection
 */
export function isReference(val: boolean): any {
    return (classType: Function): void => {
        const metadata = ClassMetaData.getMetaData(classType);
        metadata.isReference = val ? IsReference.True : IsReference.False;
    };
}
