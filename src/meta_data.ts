// helper class to contain serialization meta data for a property, each property
// in a type tagged with a serialization annotation will contain an array of these
// objects each describing one property
import {
    NoOp,
} from "./string_transforms";
import {
    allObjectPrimitives,
    allPrimitives,
    ArrayHandling,
    ASerializableType,
    ASerializableTypeOrArrayInternal,
    IConstructable,
    InstantiationMethod,
    IsReference,
    noDefaultValueSymbole,
} from "./types";
import {
    isPrimitiveAnonymousType,
} from "./utils";


class TypeMap<K, V> extends Map<K, V>{
    public get(key: K): V | undefined {
        return super.get(key);
    }
    public set(key: K, value: V): this {
        return super.set(key, value);
    }
}

const TypeMapProp = new TypeMap<any, PropMetaData[]>();

const TypeMapClass = new TypeMap<any, ClassMetaData>();

/** @internal */
export const enum PropMetaDataFlag {
    DeserializePrimitive = 1 << 1,
    SerializePrimitive = 1 << 2,
    DeserializeArray = 1 << 3,
    SerializeArray = 1 << 4,
    DeserializeObjectMap = 1 << 5,
    SerializeObjectMap = 1 << 6,
    DeserializeJSON = 1 << 7,
    SerializeJSON = 1 << 8,
    DeserializeJSONTransformKeys = 1 << 9,
    SerializeJSONTransformKeys = 1 << 10,
    DeserializeUsing = 1 << 11,
    SerializeUsing = 1 << 12,
    DeserializeObject = 1 << 13,
    SerializeObject = 1 << 14,
    DeserializeMap = 1 << 15,
    SerializeMap = 1 << 16,
    SerializeSet = 1 << 17,
    DeserializeSet = 1 << 18,
    onDeserialized = 1 << 19,

    AutoPrimitive = SerializePrimitive | DeserializePrimitive,
    AutoUsing = SerializeUsing | DeserializeUsing,
    AutoJSONTransformKeys = DeserializeJSONTransformKeys |
    SerializeJSONTransformKeys,
    Collection =
      DeserializeArray
    | SerializeArray
    | DeserializeObjectMap
    | SerializeObjectMap
    | DeserializeMap
    | SerializeMap
    | SerializeSet
    | DeserializeSet,
    PlainObject = DeserializeObject | SerializeObject
}

/** @internal */
export class PropMetaData {
    public static serializeKeyTransform = NoOp;

    public static deserializeKeyTransform = NoOp;

    public static deserializeInstantiationMethod = InstantiationMethod.New;

    // checks for a key name in a meta data array
    public static hasKeyName(metadataArray: PropMetaData[], key: string): boolean {
        for (const metadata of metadataArray) {
            if (metadata.keyName === key) {
                return true;
            }
        }
        return false;
    }

    public static isMap(flags: PropMetaDataFlag, target: unknown): target is Map<any, any> {
        return (flags & PropMetaDataFlag.DeserializeMap) !== 0;
    }

    // clone a meta data instance, used for inheriting serialization properties
    public static clone(data: PropMetaData): PropMetaData {
        const metadata = new PropMetaData(data.keyName);
        metadata.deserializedKey = data.deserializedKey;
        metadata.serializedKey = data.serializedKey;
        metadata.serializedType = data.serializedType;
        metadata.deserializedType = data.deserializedType;
        metadata.serializedKeyType = data.serializedKeyType;
        metadata.deserializedKeyType = data.deserializedKeyType;
        metadata.serializedValueType = data.serializedValueType;
        metadata.deserializedValueType = data.deserializedValueType;
        metadata.flags = data.flags;
        metadata.bitMaskSerialize = data.bitMaskSerialize;
        metadata.emitDefaultValue = data.emitDefaultValue;
        metadata.defaultValue = data.defaultValue;
        metadata.arrayHandling = data.arrayHandling;
        return metadata;
    }

    // gets meta data for a key name, creating a new meta data instance
    // if the input array doesn't already define one for the given keyName
    public static getMetaData(target: Function, keyName: string): PropMetaData {
        let metaDataList = TypeMapProp.get(target);

        if (metaDataList === undefined) {
            metaDataList = [];
            TypeMapProp.set(target, metaDataList);
        }

        for (const metadata of metaDataList) {
            if (metadata.keyName === keyName) {
                return metadata;
            }
        }
        metaDataList.push(new PropMetaData(keyName));
        return metaDataList[metaDataList.length - 1];
    }

    public static inheritMetaData(
        parentType: IConstructable,
        childType: IConstructable
    ): void {
        let childMetaData: PropMetaData[] = TypeMapProp.get(childType) || [];
        const parentMetaDataCloned: PropMetaData[] =
            (TypeMapProp.get(parentType) || [])
                // prevent duplicate
                .filter((elt) => !PropMetaData.hasKeyName(childMetaData, elt.keyName))
                // clone parent
                .map((elt) => PropMetaData.clone(elt));
        childMetaData = parentMetaDataCloned.concat(childMetaData);
        TypeMapProp.set(childType, childMetaData);
    }

    public static getMetaDataForType(type: IConstructable): PropMetaData[] | null {
        if (type !== null && type !== undefined) {
            return TypeMapProp.get(type) ?? null;
        }
        return null;
    }

    public keyName: string; // the key name of the property this meta data describes
    public serializedKey: string; // the target keyName for serializing
    public deserializedKey: string; // the target keyName for deserializing
    public serializedType: ASerializableTypeOrArrayInternal<any>; // the type to use when serializing this property
    public deserializedType: ASerializableTypeOrArrayInternal<any>; //  the type to use when deserializing this property
    // the type to use when deserializing the key of a map
    public serializedKeyType: ASerializableTypeOrArrayInternal<any>;
    // the type to use when serializing the key of a map
    public deserializedKeyType: ASerializableTypeOrArrayInternal<any>;
    // the type to use when deserializing the value of a map
    public serializedValueType: ASerializableTypeOrArrayInternal<any> | undefined;
    // the type to use when serializing the value of a map
    public deserializedValueType: ASerializableTypeOrArrayInternal<any> | undefined;
    public flags: PropMetaDataFlag;
    public bitMaskSerialize: number;
    public emitDefaultValue: boolean;
    public defaultValue: Object | symbol;
    // if keyName refer to an array, define how do we deserialize the array
    public arrayHandling: ArrayHandling;

    constructor(keyName: string) {
        this.keyName = keyName;
        this.serializedKey = "";
        this.deserializedKey = "";
        this.deserializedType = () => Function;
        this.serializedType = () => Function;
        this.serializedKeyType = () => Function;
        this.deserializedKeyType = () => Function;
        this.flags = 0;
        this.bitMaskSerialize = Number.MAX_SAFE_INTEGER;
        this.emitDefaultValue = true;
        this.defaultValue = noDefaultValueSymbole;
        this.arrayHandling = ArrayHandling.Into;
    }

    public getSerializedKey(): string {
        if (this.serializedKey === this.keyName) {
            return PropMetaData.serializeKeyTransform(this.keyName);
        }
        return this.serializedKey ? this.serializedKey : this.keyName;
    }

    public getDeserializedKey(): string {
        if (this.deserializedKey === this.keyName) {
            return PropMetaData.deserializeKeyTransform(this.keyName);
        }
        return PropMetaData.deserializeKeyTransform(
            this.deserializedKey ? this.deserializedKey : this.keyName
        );
    }
}

export function isDefaultValue<T>(metadata: PropMetaData, val: T): boolean {
    if (metadata.emitDefaultValue === false) {
        const defVal = getDefaultValue(metadata, val);
        return defVal === val;
    }
    return false;
}

/** @internal */
export class ClassMetaData {
    public static refCycleDetection = false;

    public static getMetaDataOrDefault(target: Function | undefined): ClassMetaData {
        if (target === undefined) {
            return new ClassMetaData();
        }
        else {
            let classMetaData = TypeMapClass.get(target);
            if (classMetaData === undefined) {
                classMetaData = new ClassMetaData();
                TypeMapClass.set(target, classMetaData);
            }
            return classMetaData;
        }
    }

    public isReference: IsReference = IsReference.Default;
}

export function getDefaultValue<T>(metadata: PropMetaData, val: T | allObjectPrimitives): unknown {
    if (metadata.emitDefaultValue === false) {
        if (metadata.defaultValue !== noDefaultValueSymbole) { // custom default value
            return metadata.defaultValue;
        }
        // default value for primitive type wrapped or not
        else if (isPrimitiveAnonymousType(metadata.serializedType as ASerializableType<T | allObjectPrimitives>) ||
            (val !== undefined && val !== null && val !== Object(val))) {
            return new ((metadata.serializedType as ASerializableType<allPrimitives>)())().valueOf();
        }
        else { // default value for Object, Date, Regex
            return null;
        }
    }
    else {
        return undefined;
    }
}
