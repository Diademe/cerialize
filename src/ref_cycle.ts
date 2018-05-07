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
    public setObject(obj: any): number {
        this.obj2ref.set(obj, this.refIndex);
        return this.refIndex++;
    }
    public clean() {
        // allow garbage collection of the objects
        this.ref2obj = this.obj2ref = null;
    }
}

let cycle = new Cycle();

export function referenceHandeling(json: any, tmp: any) {
    if (MetaData.RefCycleDetection === false) {
        return false;
    }
    if (json.hasOwnProperty("$ref")) {
        if (!cycle.ref2obj.has(json.$ref)) {
            throw new Error("Reference found befor its definiton");
        }
        tmp.a = cycle.ref2obj.get(json.$ref);
        return true;
    } else if (json.hasOwnProperty("$id")) {
        cycle.ref2obj.set(json.$id, tmp.a);
    }
    return false;
}

export function cycleBreaking(json: any, instance: any) {
    if (MetaData.RefCycleDetection === false) {
        return false;
    }
    if (cycle.obj2ref.has(instance)) {
        const id = cycle.obj2ref.get(instance);
        json.$ref = id;
        return true;
    } else {
        const id = cycle.setObject(instance);
        json.$id = id;
        return false;
    }
}

export function refClean() {
    cycle = new Cycle();
}
