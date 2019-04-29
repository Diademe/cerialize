import { cycleBreaking } from "./cycle";
import { getRefHandler } from "./ref";
import {
    InstantiationMethod,
    ISerializableType,
    primitive,
    SerializablePrimitiveType
} from "./types";

export function getTarget<T>(
    type: ISerializableType<T>,
    target: T,
    instantiationMethod: InstantiationMethod
): T {
    if (target !== null && target !== void 0) {
        return target;
    }

    if (type !== null) {
        switch (instantiationMethod) {
            case InstantiationMethod.New:
                return new type();

            case InstantiationMethod.ObjectCreate:
                return Object.create(type.prototype);
        }
    }

    return {} as T;
}

export function getConstructor(type: any): new(...args: any[]) => any {
    return Object.getOwnPropertyDescriptor(type, "__originalConstructor__") ?
            (type as any).__originalConstructor__ : type;
}

export function isPrimitiveType(type: Function): boolean {
    return (
        type === String ||
        type === Boolean ||
        type === Number ||
        type === Date ||
        type === RegExp
    );
}

export function isPrimitiveAnonymousType(type: () => Function): boolean {
    try {
        return (
            type() === String ||
            type() === Boolean ||
            type() === Number ||
            type() === Date ||
            type() === RegExp
        );
    }
    catch (error) {
        if (error instanceof ReferenceError) {
            return false;
        }
        else {
            throw error;
        }
    }
}

export function DefaultPrimitiveValue(value: any) {
    if (value instanceof String) {
        return String();
    }
    if (value instanceof Boolean) {
        return Boolean();
    }
    if (value instanceof Number) {
        return Number();
    }
    if (value instanceof Date) {
        return Date();
    }
    return null;
}

export function DowncastPrimitive(value: SerializablePrimitiveType): primitive {
    if (value instanceof String
        || value instanceof Boolean
        || value instanceof Number
        || value instanceof RegExp
        || value instanceof Date) {
        return value.valueOf() as primitive;
    }
    throw new Error("DowncastPrimitive failed on " + value);
}

export function setBitConditionally(
    value: number,
    bits: number,
    condition: boolean
): number {
    if (condition) {
        return value | bits;
    }
    else {
        return value & ~bits;
    }
}

export function parseNumber(key: any, value: any) {
    switch (value) {
        case "NaN":
            return Number.NaN;
        case "Infinity":
            return Number.POSITIVE_INFINITY;
        case "-Infinity":
            return Number.NEGATIVE_INFINITY;
        default:
            return value;
    }
}

export function stringifyNumber(key: string, value: any) {
    if (typeof value === "number") {
        if (Number.isNaN(value) || isNaN(value)) {
            return "NaN";
        }
        else if (!isFinite(value)) {
            return value < 0 ? "-Infinity" : "Infinity";
        }
    }
    return value;
}

let NbDeserialization = 0;
let NbSerialization = 0;

export function serializationContinuation<T>(func: (...args: any[]) => T, ...args: any[]): T {
    let ret: T;
    try {
        NbSerialization++;
        if (getRefHandler().init) {
            getRefHandler().init();
        }
        ret = func.apply(null, args);
        if (getRefHandler().done) {
            getRefHandler().done();
        }
    }
    finally {
        NbSerialization--;
    }
    return ret;
}

export function deserializationContinuation<T>(func: (...args: any[]) => T, ...args: any[]): T {
    let ret: T;
    try {
        NbDeserialization++;
        if (getRefHandler().init) {
            getRefHandler().init();
        }
        ret = func.apply(null, args);
        if (getRefHandler().done) {
            getRefHandler().done();
        }
    }
    finally {
        NbDeserialization--;
    }
    return ret;
}

/**
 * return true if there is we are deserializing
 */
export function DeserializationOccurring() {
    return NbDeserialization > 0;
}

/**
 * return true if there is we are serializing
 */
export function SerializationOccurring() {
    return NbSerialization > 0;
}
