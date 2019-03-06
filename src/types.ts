export type primitive =
    | null
    | string
    | number
    | boolean;

export type JsonType =
    | null
    | string
    | number
    | boolean
    | IJsonObject
    | IJsonArray;

export type Serializer<T> = (target: T) => JsonType;

export type Deserializer<T> = (
    data: JsonType,
    target?: T,
    instantiationMethod?: InstantiationMethod
) => T;

export interface IConstructable {
    constructor: Function;
}

export type SerializeFn = <T>(data: T) => JsonType;

export type SerializablePrimitiveType =
    | DateConstructor
    | NumberConstructor
    | BooleanConstructor
    | RegExpConstructor
    | StringConstructor;

export enum InstantiationMethod {
    None = 0,
    New = 1,
    ObjectCreate = 2
}

export interface IJsonObject {
    [idx: string]: JsonType | IJsonObject;
    $type?: string;
}

export interface IJsonArray extends Array<JsonType> {}

export interface ISerializer<T> {
    Serialize: Serializer<T>;
    Deserialize: Deserializer<T>;
}

export interface IIndexable<T = any | null> {
    [idx: string]: T;
}

export interface ISerializableType<T> {
    onSerialized?: (data: IJsonObject, instance: T) => IJsonObject | void;
    onDeserialized?: (
        data: IJsonObject,
        instance: T,
        instantiationMethod?: InstantiationMethod
    ) => T | void;
    new (...args: any[]): T;
}
export type ASerializableType<T> = () => ISerializableType<T>;
export type ASerializableTypeOrArray<T> = ASerializableType<T> | ItIsAnArrayInternal;
export type Serialized<T> =
    T extends ItIsAnArrayInternal ? JsonType[] :
    IJsonObject;

export class ItIsAnArrayInternal {
    constructor(
        public type: ASerializableTypeOrArray<any>,
        public ctor?: () => IConstructable
        ) {
            this.ctor = ctor || (() => Array);
        }
}

/** @internal */
export const noDefaultValueSymbole = Symbol("No default value");
