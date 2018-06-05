export class PairMap<K1, K2, V> {
    private m: Map<K1, Map<K2, V>>;

    constructor(...args: any[]) {
        this.m = new Map<K1, Map<K2, V>>(...args);
    }

    public get size(): number{
        return this.m.size;
    }

    public get(key1: K1, key2: K2): V {
        return this.m.get(key1) ? this.m.get(key1).get(key2) : undefined;
    }

    public clear(): void {
        this.m.clear();
    }

    public has(key1: K1, key2: K2): boolean {
        return this.m.has(key1) ? this.m.get(key1).has(key2) : false;
    }

    public set(key1: K1, key2: K2, val: V): PairMap<K1, K2, V> {
        if (!this.m.has(key1)){
            this.m.set(key1, new Map<K2, V>());
        }
        this.m.get(key1).set(key2, val);
        return this;
    }
}
