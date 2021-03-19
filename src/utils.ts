import {
    getRefHandler,
} from "./ref";
import {
    InstantiationMethod,
    primitive,
    SerializablePrimitiveType,
} from "./types";

export function getTarget<T>(
    type: new(...args: any[]) => T,
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
                return Object.create(type.prototype) as T;
        }
    }

    return {} as T;
}

export function isPrimitiveType(type: Function): type is SerializablePrimitiveType {
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

export function DowncastPrimitive(value: Date | RegExp | String | Number | Boolean): primitive {
    if (value instanceof String
        || value instanceof Boolean
        || value instanceof Number
        || value instanceof RegExp
        || value instanceof Date) {
        return value.valueOf() as primitive;
    }
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
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

export function parseNumber<T>(key: string, value: T | string): number | string | T {
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

export function stringifyNumber<T>(key: string, value: T): string | T {
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

export function serializationContinuation<T>(func: (...argsFunc: any[]) => T, ...args: any[]): T {
    let ret: T;
    try {
        NbSerialization++;
        const handler = getRefHandler();
        if (handler.init) {
            handler.init();
        }
        ret = func(...args);
        if (handler.done) {
            handler.done();
        }
    }
    finally {
        NbSerialization--;
    }
    return ret;
}

export function deserializationContinuation<T>(func: (...argsFunc: any[]) => T, ...args: any[]): T {
    let ret: T;
    try {
        NbDeserialization++;
        const handler = getRefHandler();
        if (handler.init) {
            handler.init();
        }
        ret = func(...args);
        if (handler.done) {
            handler.done();
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
export function DeserializationOccurring(): boolean {
    return NbDeserialization > 0;
}

/**
 * return true if there is we are serializing
 */
export function SerializationOccurring(): boolean {
    return NbSerialization > 0;
}
