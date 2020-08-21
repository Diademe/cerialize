import {
    autoserializeUsing,
    Deserialize,
    Serialize,
} from "../src";
import {
    ISerializer,
} from "../src/types";


describe("Exemples", () => {
    describe("AutoSerializeUsing", () => {
        it("BigInt", () => {
            const infinityTimeTwo: BigInt = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(Number.MAX_SAFE_INTEGER);
            const infinityTimeTowInString: string = "18014398509481982";
            const BigIntSerializer: ISerializer<BigInt> = {
                Serialize: (myBigInt: BigInt) => myBigInt.toString(),
                Deserialize: (myBigIntInJsonForm: string) => BigInt(myBigIntInJsonForm)
            };

            class Test {
                @autoserializeUsing(BigIntSerializer)
                public value: BigInt;
            }

            const s = new Test();
            s.value = infinityTimeTwo;
            const json = Serialize(s, () => Test);
            expect(json.value).toBe(infinityTimeTowInString);
            const obj = Deserialize(json, () => Test);
            expect(obj.value).toBe(BigInt("18014398509481982"));
        });
    });
});
