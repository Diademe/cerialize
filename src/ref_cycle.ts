import { MetaData } from "./meta_data";

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
    public clean() {
        // allow garbage collection of the objects
        this.ref2obj = this.obj2ref = null;
    }
}

let cycle = new Cycle();

export function referenceHandling(json: any, tmp: any) {
    if (MetaData.refCycleDetection === false) {
        return false;
    }
    if (json.hasOwnProperty("$ref")) {
        const ref = parseInt(json.$ref, 10);
        if (!cycle.ref2obj.has(ref)) {
            throw new Error("Reference found before its definition");
        }
        tmp.a = cycle.ref2obj.get(ref);
        return true;
    } else if (json.hasOwnProperty("$id")) {
        cycle.ref2obj.set(parseInt(json.$id, 10), tmp.a);
    }
    return false;
}

export function cycleBreaking(json: any, instance: any) {
    if (MetaData.refCycleDetection === false) {
        return false;
    }
    if (cycle.obj2ref.has(instance)) {
        const id = cycle.obj2ref.get(instance).toString();
        json.$ref = id;
        return true;
    } else {
        const id = cycle.setObject(instance);
        json.$id = id;
        return false;
    }
}

export function RefClean() {
    cycle = new Cycle();
}
