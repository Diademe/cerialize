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

export enum ArrayHandling {
    Into, /** deserialize into each cell, grow or shrink array to fit serialized array size */
    ConcatAtTheEnd, /** keep previous array, add the deserialized one at the end */
    New /** empty the array before adding element to it */
}

export interface IJsonObject {
    [idx: string]: JsonType | IJsonObject;
    $type?: string;
}

export interface IJsonArray extends Array<JsonType> { }

export interface ISerializer<T> {
    Serialize: Serializer<T>;
    Deserialize: Deserializer<T>;
}

export interface IIndexable<T = any> {
    [idx: string]: T;
}

export interface ISerializableType<T> {
    onSerialized?: (data: IJsonObject, instance: T) => IJsonObject | void;
    onDeserialized?: (
        data: IJsonObject,
        instance: T,
        instantiationMethod?: InstantiationMethod
    ) => T | void;
    new(...args: any[]): T;
}
export type ASerializableType<T> = () => ISerializableType<T>;
export type ASerializableTypeOrArrayInternal<T> = ASerializableType<T> | ItIsAnArrayInternal;
export type Serialized<T> =
    T extends ItIsAnArrayInternal ? JsonType[] :
    IJsonObject;

export class ItIsAnArrayInternal<
    Value = any,
    T extends Value[] = Value[],
    C extends (new () => T) = new () => T> {
    constructor(
        public type: ASerializableTypeOrArrayInternal<Value>,
        public ctor: () => C = (() => Array as any),
        public handling: ArrayHandling = ArrayHandling.Into
    ) { }
}

export function isItAnArrayInternal(arg: unknown): arg is ItIsAnArrayInternal {
    return arg instanceof ItIsAnArrayInternal;
}

export const noDefaultValueSymbole = Symbol("No default value");

export interface IRefHandler {
    /** list of keywords to be ignored during deserialization */
    keyWord: string[];

    /** set an ID for the given object. idempotent
     * @param json the data resulting of the serialization (ie where to store the ref)
     * @param obj the object being serialized
     */
    serializationSetID(json: JsonType, obj: any): void;
    /**
     * @param json where to store the ref
     * @param obj the object from which we get the ref
     */
    serializationSetRef(json: JsonType, obj: any): void;
    /** get the object corresponding to the reference carried by json */
    deserializationGetObject(json: JsonType): any;
    /** associate the ref carried by json to the object obj */
    deserializationRegisterObject(json: JsonType, obj: any): void;
    /** cleanup function. called at the end of serialization. may be used to remove unnecessary ID */
    removeID?(obj: any): void;
    /** called when user want to start over the ref (refHandler may be used from nested serialization) */
    clean?(): void;
    /** called at each call to a (de)serialize function (not a decorator) */
    init?(): void;
    /** called at the end of a (de)serialize function (not a decorator) */
    done?(): void;
}

export enum IsReference {
    Default, /** use global setting */
    True, /** will use reference handling regardless of global setting */
    False /** will not use reference handling regardless of global setting */
}
