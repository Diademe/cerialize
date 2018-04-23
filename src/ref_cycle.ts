import { MetaData } from "./meta_data";
//throw an exeption if dic doesn't have key
function lousyGet(dic: any, key: any) {
    var res = dic.get(key);
    if (res == undefined) {
        throw new Error(`The dictionnary doesn't have the key ${key}`);
    }
    else
        return res;
}

export class TowWayDic {
    private type2string: Map<string, string>;
    private string2type: Map<string, any>;
    private init() {
        this.type2string = new Map<string, string>();
        this.string2type = new Map<string, any>();
    }
    public constructor() {
        this.init();
    }
    public set(t: any, s: string) {
        this.type2string.set(Object.getPrototypeOf(t).name, s);
        this.string2type.set(s, t);
    }
    private static typeToString(instance: any) {
        return Object.getPrototypeOf(Object.getPrototypeOf(instance).constructor).name;
    }
    public getString(instance: any) {
        return lousyGet(this.type2string, TowWayDic.typeToString(instance));
    }
    public hasString(instance: any) {
        return this.type2string.has(TowWayDic.typeToString(instance));
    }
    public getType(s: string) {
        return lousyGet(this.string2type, s);
    }
    public hasType(s: string) {
        return this.string2type.has(s);
    }
    public clean() {
        this.init();
    }
}


//cycle references
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
    public clean() { //allow garbage collection of the objects
        this.ref2obj = this.obj2ref = null;
    }
}

var cycle = new Cycle();

export function referenceHandeling(json: any, tmp: any) {
    if (MetaData.RefCycleDetection == false)
        return false;
    if (json.hasOwnProperty("$ref")) {
        if (!cycle.ref2obj.has(json["$ref"])) {
            throw new Error('Reference found befor its definiton');
        }
        tmp.a = cycle.ref2obj.get(json["$ref"]);
        return true;
    }
    else if (json.hasOwnProperty("$id")) {
        cycle.ref2obj.set(json["$id"], tmp.a);
    }
    return false;
}

export function cycleBreaking(json: any, instance: any) {
    if (MetaData.RefCycleDetection === false)
        return false;
    if (cycle.obj2ref.has(instance)) {
        let id = cycle.obj2ref.get(instance);
        json["$ref"] = id;
        return true;
    }
    else {
        let id = cycle.setObject(instance);
        json["$id"] = id;
        return false;
    }
}

export function refClean() {
    cycle = new Cycle();
}
