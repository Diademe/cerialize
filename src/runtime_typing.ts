// throw an exception if dic doesn't have key
function lousyGet<V>(dic: Map<object | string, V>, key: object | string) {
    const res = dic.get(key);
    if (res === undefined) {
        throw new Error(`The dictionary doesn't have the key ${key.toString()}`);
    }
    else {
        return res;
    }
}

export class TypeStringDictionary {
    private type2string!: Map<Function, string>;
    private string2type!: Map<string, Function>;
    private runtimeTyping: boolean = false;

    public constructor() {
        this.init();
    }
    public setTypeString(t: Function, s: string): void {
        this.type2string.set(t, s);
        this.string2type.set(s, t);
    }
    public getStringFromType(constructor: Function): string {
        return lousyGet(this.type2string, constructor);
    }
    public hasStringFromType(constructor: Function): boolean {
        return this.type2string.has(constructor);
    }
    public getTypeFromString(s: string): Function {
        return lousyGet(this.string2type, s);
    }
    public hasTypeFromString(s: string): boolean {
        return this.string2type.has(s);
    }
    public resetDictionary(): void {
        this.init();
    }
    public setRuntimeTyping(rtt: boolean): void {
        this.runtimeTyping = rtt;
    }
    public getRuntimeTyping(): boolean {
        return this.runtimeTyping;
    }

    private init(): void {
        this.type2string = new Map<Function, string>();
        this.string2type = new Map<string, Function>();
    }
}
export const TypeString: TypeStringDictionary = new TypeStringDictionary();

export function RuntimeTypingResetDictionary(): void {
    TypeString.resetDictionary();
}

export function RuntimeTypingSetTypeString(t: Function, s: string): void {
    TypeString.setTypeString(t, s);
}

export function RuntimeTypingEnable(): void {
    TypeString.setRuntimeTyping(true);
}

export function RuntimeTypingDisable(): void {
    TypeString.setRuntimeTyping(false);
}

export function typeString(type: string) {
    return (classType: Function): void => {
        TypeString.setTypeString(classType, type);
    };
}
