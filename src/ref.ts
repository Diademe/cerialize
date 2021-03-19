import {
    IIndexable,
    IJsonObject,
    IRefHandler,
    JsonType,
} from "./types";

// cycle references
class Cycle {
    public ref2obj: Map<number, unknown>;
    public obj2ref: Map<unknown, number>;
    private refIndex: number;
    public constructor() {
        this.refIndex = 1;
        this.ref2obj = new Map<number, unknown>();
        this.obj2ref = new Map<unknown, number>();
    }
    public setObject(obj: unknown): string {
        this.obj2ref.set(obj, this.refIndex);
        return (this.refIndex++).toString();
    }
}

/**
 * Default ref handler
 */
export class RefHandler implements IRefHandler {
    public keyWord = ["$id", "$ref"];

    private cycle: Cycle;

    constructor() {
        this.cycle = new Cycle();
    }

    public clean(): void {
        this.cycle = new Cycle();
    }

    public deserializationGetObject(json: IJsonObject): unknown {
        if (json?.hasOwnProperty("$ref")) {
            const ref = parseInt(json.$ref as string, 10);
            if (!this.cycle.ref2obj.has(ref)) {
                throw new Error("Reference found before its definition");
            }
            return this.cycle.ref2obj.get(ref);
        }
        return undefined;
    }

    public deserializationRegisterObject(json: IJsonObject, obj: unknown): void {
        if (json?.hasOwnProperty("$id")) {
            this.cycle.ref2obj.set(parseInt(json.$id as string, 10), obj);
        }
    }

    public serializationSetID(json: IIndexable<JsonType>, obj: unknown): void {
        json.$id = this.cycle.setObject(obj);
    }

    public serializationSetRef(json: IIndexable<JsonType>, obj: unknown): void {
        json.$ref = (this.cycle.obj2ref.get(obj) as number).toString();
    }
}

let refHandlerStore: IRefHandler = new RefHandler();

export function getRefHandler(): IRefHandler {
    return refHandlerStore;
}

export function setRefHandler(refHandler: IRefHandler): void {
    refHandlerStore = refHandler;
}
