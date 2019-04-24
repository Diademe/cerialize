﻿
class CycleBreaking {
    private readonly seenSet = new WeakSet<any>();
    /**
     * add the object to the seen list
     * @returns true if the object as been seen previously during serialization
     */
    public seen(obj: any): boolean {
        const res = this.seenSet.has(obj);
        if (!res) {
            this.seenSet.add(obj);
        }
        return res;
    }
}

export let cycleBreaking = new CycleBreaking();

export function cleanCycleBreaking() {
    cycleBreaking = new CycleBreaking();
}
