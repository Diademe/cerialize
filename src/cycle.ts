
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
class StackCycleBreaking {
    private readonly stack: CycleBreaking[] = [];
    public seen(obj: any): boolean {
        return this.stack[this.stack.length - 1].seen(obj);
    }
    public push() {
        this.stack.push(new CycleBreaking());
    }
    public pop() {
        this.stack.pop();
    }
}

export const cycleBreaking = new StackCycleBreaking();
