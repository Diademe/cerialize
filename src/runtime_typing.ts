import { IConstructable } from "./util";

//throw an exeption if dic doesn't have key
function lousyGet(dic:any, key:any) {
    var res = dic.get(key);
    if (res == undefined) {
        throw new Error(`The dictionnary doesn't have the key ${key}`);
    }
    else
        return res;
}

export class TypeStringDictionary {
    private type2string: Map<IConstructable, string>;
    private string2type: Map<string, IConstructable>;
    private init(): void{
        this.type2string = new Map<IConstructable, string>();
        this.string2type = new Map<string, IConstructable>();
    }
    public constructor() {
        this.init();
    }
    public setTypeString(t: IConstructable, s: string) : void {
        this.type2string.set(t, s);
        this.string2type.set(s, t);
    }
    public getStringFromType(instance: IConstructable) :string {
        return lousyGet(this.type2string, instance);
    }
    public hasStringFromType(instance: IConstructable) : boolean {
        return this.type2string.has(instance);
    }
    public getTypeFromString(s: string) :IConstructable {
        return lousyGet(this.string2type, s);
    }
    public hasTypeFromString(s: string) : boolean{
        return this.string2type.has(s);
    }
    public resetDictionnary(): void{
        this.init();
    }
    public runtimeTyping = false;
}
var TypesString: TypeStringDictionary = new TypeStringDictionary();
export default TypesString;