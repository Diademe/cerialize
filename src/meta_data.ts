// helper class to contain serialization meta data for a property, each property
// in a type tagged with a serialization annotation will contain an array of these
// objects each describing one property

import { PairMap } from "./pair_map";
import { NoOp } from "./string_transforms";
import { ASerializableType, IConstructable, InstantiationMethod } from "./util";

const TypeMap = new Map<any, MetaData[]>();

const TypeMapMap = new PairMap<IConstructable, IConstructable, MetaData[]>();

/** @internal */
export const enum MetaDataFlag {
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
    SerializeMap = 1 << 15,
    DeserializeMap = 1 << 16,
    SerializeSet = 1 << 17,
    DeserializeSet = 1 << 18,

    AutoPrimitive = SerializePrimitive | DeserializePrimitive,
    AutoUsing = SerializeUsing | DeserializeUsing,
    AutoJSONTransformKeys = DeserializeJSONTransformKeys |
        SerializeJSONTransformKeys
}

/** @internal */
export class MetaData {
    public keyName: string; // the key name of the property this meta data describes
    public serializedKey: string; // the target keyname for serializing
    public deserializedKey: string; // the target keyname for deserializing
    public serializedType: ASerializableType<any>; // the type to use when serializing this property
    public deserializedType: ASerializableType<any>; //  the type to use when deserializing this property
    public serializedKeyType: ASerializableType<any>; //  the type to use when deserializing the key of a map
    public deserializedKeyType: ASerializableType<any>; //  the type to use when serializing the key of a map
    public serializedValueType: ASerializableType<any>; //  the type to use when deserializing the value of a map
    public deserializedValueType: ASerializableType<any>; //  the type to use when serializing the value of a map
    public flags: MetaDataFlag;
    public bitMaskSerialize: number;
    public emitDefaultValue: boolean;
    public defaultValue: () => IConstructable;

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
        this.defaultValue = () => null;
    }

    public getSerializedKey(): string {
        if (this.serializedKey === this.keyName) {
            return MetaData.serializeKeyTransform(this.keyName);
        }
        return this.serializedKey ? this.serializedKey : this.keyName;
    }

    public getDeserializedKey(): string {
        if (this.deserializedKey === this.keyName) {
            return MetaData.deserializeKeyTransform(this.keyName);
        }
        return MetaData.deserializeKeyTransform(
            this.deserializedKey ? this.deserializedKey : this.keyName
        );
    }

    // checks for a key name in a meta data array
    public static hasKeyName(metadataArray: MetaData[], key: string): boolean {
        for (const metadata of metadataArray) {
            if (metadata.keyName === key) {
                return true;
            }
        }
        return false;
    }

    // clone a meta data instance, used for inheriting serialization properties
    public static clone(data: MetaData): MetaData {
        const metadata = new MetaData(data.keyName);
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
        return metadata;
    }

    // gets meta data for a key name, creating a new meta data instance
    // if the input array doesn't already define one for the given keyName
    public static getMetaData(target: Function, keyName: string): MetaData {
        let metaDataList = TypeMap.get(target);

        if (metaDataList === void 0) {
            metaDataList = [];
            TypeMap.set(target, metaDataList);
        }

        for (const metadata of metaDataList) {
            if (metadata.keyName === keyName) {
                return metadata;
            }
        }
        metaDataList.push(new MetaData(keyName));
        return metaDataList[metaDataList.length - 1];
    }

    public static getMetaDataMap(key: Function, value: Function, keyName: string): MetaData {
        let metaDataList = TypeMapMap.get(key, value);

        if (metaDataList === void 0) {
            metaDataList = [];
            TypeMapMap.set(key, value, metaDataList);
        }

        for (const metadata of metaDataList) {
            if (metadata.keyName === keyName) {
                return metadata;
            }
        }
        metaDataList.push(new MetaData(keyName));
        return metaDataList[metaDataList.length - 1];
    }

    public static inheritMetaData(
        parentType: IConstructable,
        childType: IConstructable
    ) {
        const parentMetaData: MetaData[] = TypeMap.get(parentType) || [];
        const childMetaData: MetaData[] = TypeMap.get(childType) || [];
        for (const metadata of parentMetaData) {
            const keyName = metadata.keyName;
            if (!MetaData.hasKeyName(childMetaData, keyName)) {
                childMetaData.push(MetaData.clone(metadata));
            }
        }
        TypeMap.set(childType, childMetaData);
    }

    public static getMetaDataForType(type: IConstructable) {
        if (type !== null && type !== void 0) {
            return TypeMap.get(type) || null;
        }
        return null;
    }
    // TODO remove this function
    public static getMetaDataForMap(keyType: IConstructable, valueType: IConstructable) {
        if (keyType !== null && keyType !== void 0 &&
            valueType !== null && valueType !== void 0) {
            return TypeMapMap.get(keyType, valueType) || null;
        }
        return null;
    }

    public static readonly TypeMap = TypeMap;

    public static readonly TypeMapMap = TypeMapMap;

    public static serializeKeyTransform = NoOp;

    public static deserializeKeyTransform = NoOp;

    public static deserializeInstantationMethod = InstantiationMethod.New;

    public static refCycleDetection = false;
}
