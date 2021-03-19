import {
    autoserializeUsing,
    Deserialize,
    deserializeAsMap,
    Serialize,
    serializeAsMap,
} from "../src";
import {
    IJsonObject,
    ISerializer,
    JsonType,
} from "../src/types";


describe("Exemples", () => {
    describe("AutoSerializeUsing", () => {
        it("BigInt", () => {
            const infinityTimeTwo: BigInt = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(Number.MAX_SAFE_INTEGER);
            const infinityTimeTowInString: string = "18014398509481982";
            const BigIntSerializer: ISerializer<BigInt> = {
                Serialize: (myBigInt: BigInt) => myBigInt.toString(),
                Deserialize: (myBigIntInJsonForm: JsonType) => BigInt(myBigIntInJsonForm)
            };

            class Test {
                @autoserializeUsing(BigIntSerializer)
                public value!: BigInt;
            }

            const s = new Test();
            s.value = infinityTimeTwo;
            const json: IJsonObject = Serialize(s, () => Test);
            expect(json.value).toBe(infinityTimeTowInString);
            const obj = Deserialize(json, () => Test);
            expect(obj.value).toBe(BigInt("18014398509481982"));
        });
    });
    it("dictionary with int key serialized as string key", () => {
        class Test {
            @serializeAsMap(() => String, () => String)
            @deserializeAsMap(() => Number, () => String)
            public value!: Map<number, string>;
        }

        const s = new Test();
        s.value = new Map<number, string>();
        s.value.set(1, "a");
        const json = Serialize(s, () => Test);
        expect(typeof Array.from(Object.keys(json.value as IJsonObject))[0]).toBe("string");

        const obj = Deserialize(json, () => Test);
        expect(typeof Array.from(obj.value.keys())[0]).toBe("number");
    });
});
