import { IRefHandler, JsonType } from "./types";

// cycle references
class Cycle {
    public ref2obj: Map<number, any>;
    public obj2ref: Map<any, number>;
    private refIndex: number;
    public constructor() {
        this.refIndex = 1;
        this.ref2obj = new Map<number, any>();
        this.obj2ref = new Map<any, number>();
    }
    public setObject(obj: any): string {
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

    public clean() {
        this.cycle = new Cycle();
    }

    public deserializationGetObject(json: JsonType): any {
        if (json.hasOwnProperty("$ref")) {
            const ref = parseInt((json as any).$ref, 10);
            if (!this.cycle.ref2obj.has(ref)) {
                throw new Error("Reference found before its definition");
            }
            return this.cycle.ref2obj.get(ref);
        }
        return undefined;
    }

    public deserializationRegisterObject(json: JsonType, obj: any): void {
        if (json.hasOwnProperty("$id")) {
            this.cycle.ref2obj.set(parseInt((json as any).$id, 10), obj);
        }
    }

    public serializationSetID(json: JsonType, obj: any): void {
        (json as any).$id = this.cycle.setObject(obj);
    }

    public serializationSetRef(json: JsonType, obj: any): void {
        (json as any).$ref = this.cycle.obj2ref.get(obj).toString();
    }
}

let refHandlerStore: IRefHandler = new RefHandler();

export function getRefHandler(): IRefHandler {
    return refHandlerStore;
}

export function setRefHandler(refHandler: IRefHandler): void {
    refHandlerStore = refHandler;
}
