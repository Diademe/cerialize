import {
    serializeBitMask,
    autoserializeAs,
    autoserializeAsArray,
    autoserializeAsJson,
    autoserializeAsMap,
    autoserializeUsing,
    serializeAs,
    serializeAsArray,
    serializeAsJson,
    serializeAsMap,
    serializeUsing,
    inheritSerialization
} from "../src/annotations";
import { Serialize, SerializeJSON, SelectiveSerialization, SerializeArray } from "../src/serialize";
import { Indexable, JsonObject } from "../src/util";
import { SetSerializeKeyTransform, SetRefCycleDetection, refClean } from "../src/index";
import TypesString from "../src/runtime_typing";

describe("Serializing", function () {

    describe("Unannotated", function () {

        it("will not serialize unannotated fields", function () {

            class Test {
                value: number = 1;
            }

            const x = new Test();
            const json = Serialize(x, Test);
            expect(json).toEqual({});

        });

    });

    describe("SerializeAs", function () {

        function runTests(blockName: string, serializeAs: any, serializeAsMap: any, serializeAsArray: any, serializeAsJson: any) {

            describe(blockName, function () {

                it("serializes basic primitives", function () {

                    class Test {
                        @serializeAs(String) value0: string;
                        @serializeAs(Boolean) value1: boolean;
                        @serializeAs(Number) value2: number;
                    }

                    var s = new Test();
                    s.value0 = "strvalue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, Test);
                    expect(json["value0"]).toBe("strvalue");
                    expect(json["value1"]).toBe(true);
                    expect(json["value2"]).toBe(100);

                });

                it("serializes a Date", function () {
                    class Test {
                        @serializeAs(Date) value0: Date;
                    }

                    var d = new Date();
                    var s = new Test();
                    s.value0 = d;
                    const json = Serialize(s, Test);
                    expect(json).toEqual({
                        value0: d.toString()
                    });

                });

                it("serializes a RegExp", function () {
                    class Test {
                        @serializeAs(RegExp) value0: RegExp;
                    }

                    var s = new Test();
                    s.value0 = /[123]/g;
                    const json = Serialize(s, Test);
                    expect(json).toEqual({
                        value0: "/[123]/g"
                    });
                });

                it("serializes non matching primitive type", function () {
                    class Test {
                        @serializeAs(Number) value0: string;
                        @serializeAs(String) value1: boolean;
                        @serializeAs(Boolean) value2: number;
                    }

                    var s = new Test();
                    s.value0 = "strvalue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, Test);
                    expect(json["value0"]).toBe(null);
                    expect(json["value1"]).toBe("true");
                    expect(json["value2"]).toBe(true);
                });

                it("serializes with different keys", function () {
                    class Test {
                        @serializeAs(String, "v0") value0: string;
                        @serializeAs(Boolean, "v1") value1: boolean;
                        @serializeAs(Number) value2: number;
                    }

                    var s = new Test();
                    s.value0 = "strvalue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, Test);
                    expect(json["v0"]).toBe("strvalue");
                    expect(json["v1"]).toBe(true);
                    expect(json["value2"]).toBe(100);
                });

                it("skips undefined keys", function () {
                    class Test {
                        @serializeAs(String) value0: string;
                        @serializeAs(Boolean) value1: boolean;
                        @serializeAs(Number) value2: number;
                    }

                    var s = new Test();
                    s.value0 = void 0;
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, Test);
                    expect(json["value0"]).not.toBeDefined();
                    expect(json["value1"]).toBe(true);
                    expect(json["value2"]).toBe(100);
                });

                it("does not skip null keys", function () {
                    class Test {
                        @serializeAs(String) value0: string;
                        @serializeAs(Boolean) value1: boolean;
                        @serializeAs(Number) value2: number;
                    }

                    var s = new Test();
                    s.value0 = null;
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, Test);
                    expect(json["value0"]).toBeNull();
                    expect(json["value1"]).toBe(true);
                    expect(json["value2"]).toBe(100);
                });

                it("serializes nested types", function () {

                    class Test {
                        @serializeAs(String) value0: string;
                        @serializeAs(Boolean) value1: boolean;
                        @serializeAs(Number) value2: number;
                    }

                    class Test0 {
                        @serializeAs(Test) test: Test;
                    }

                    var x = new Test0();
                    var s = new Test();
                    x.test = s;
                    s.value0 = null;
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(x, Test0);
                    expect(json["test"]).toEqual({
                        value0: null,
                        value1: true,
                        value2: 100
                    });
                });

                it("serializes doubly nested types", function () {
                    class Test {
                        @serializeAs(String) value0: string;
                        @serializeAs(Boolean) value1: boolean;
                        @serializeAs(Number) value2: number;
                    }

                    class Test0 {
                        @serializeAs(Test) test: Test;
                    }

                    class Test1 {
                        @serializeAs(Test0) test: Test0;
                    }

                    var z = new Test1();
                    var x = new Test0();
                    var s = new Test();
                    x.test = s;
                    z.test = x;
                    s.value0 = null;
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(z, Test1);
                    expect(json["test"]).toEqual({
                        test: {
                            value0: null,
                            value1: true,
                            value2: 100
                        }
                    });

                });

            });

        }

        runTests("Normal", serializeAs, serializeAsMap, serializeAsArray, serializeAsJson);
        runTests("Auto", autoserializeAs, autoserializeAsMap, autoserializeAsArray, autoserializeAsJson);

    });

    describe("SerializeAsMap", function () {

        function runTests(blockName: string, serializeAs: any, serializeAsMap: any, serializeAsArray: any, serializeAsJson: any) {

            describe(blockName, function () {

                it("serializes a map of primitives", function () {
                    class Test {
                        @serializeAsMap(Number) values: Indexable<number>;
                    }

                    const t = new Test();
                    t.values = {
                        v0: 1,
                        v1: 2,
                        v2: 3
                    };
                    const json = Serialize(t, Test);
                    expect(json["values"]).toEqual({
                        v0: 1, v1: 2, v2: 3
                    });
                });

                it("serializes a map of typed objects", function () {
                    class TestType {
                        @serializeAs(Number) value: number;

                        constructor(arg: number) {
                            this.value = arg;
                        }
                    }

                    class Test {
                        @serializeAsMap(TestType) values: Indexable<TestType>;
                    }

                    const t = new Test();
                    t.values = {
                        v0: new TestType(0),
                        v1: new TestType(1),
                        v2: new TestType(2)
                    };
                    const json = Serialize(t, Test);
                    expect(json["values"]).toEqual({
                        v0: { value: 0 }, v1: { value: 1 }, v2: { value: 2 }
                    });
                });

                it("serializes a map with a different key name", function () {
                    class TestType {
                        @serializeAs(Number) value: number;

                        constructor(arg: number) {
                            this.value = arg;
                        }
                    }

                    class Test {
                        @serializeAsMap(TestType, "different") values: Indexable<TestType>;
                    }

                    const t = new Test();
                    t.values = {
                        v0: new TestType(0),
                        v1: new TestType(1),
                        v2: new TestType(2)
                    };
                    const json = Serialize(t, Test);
                    expect(json["values"]).not.toBeDefined();
                    expect(json["different"]).toEqual({
                        v0: { value: 0 }, v1: { value: 1 }, v2: { value: 2 }
                    });

                });

                it("serializes nested maps", function () {
                    class TestType {
                        @serializeAsMap(Number) value: Indexable<number>;

                        constructor(arg: Indexable<number>) {
                            this.value = arg;
                        }
                    }

                    class Test {
                        @serializeAsMap(TestType) values: Indexable<TestType>;
                    }

                    const t = new Test();
                    t.values = {
                        v0: new TestType({ v00: 1, v01: 2 }),
                        v1: new TestType({ v10: 2, v11: 2 }),
                        v2: new TestType({ v20: 3, v21: 2 })
                    };
                    const json = Serialize(t, Test);
                    expect(json["values"]).toEqual({
                        v0: { value: { v00: 1, v01: 2 } },
                        v1: { value: { v10: 2, v11: 2 } },
                        v2: { value: { v20: 3, v21: 2 } }
                    });
                });

            });

            it("skips undefined keys", function () {

                class Test {
                    @serializeAsMap(Number) values: Indexable<number>;
                }

                const t = new Test();
                t.values = {
                    v0: void 0,
                    v1: 1,
                    v2: 2
                };
                const json = Serialize(t, Test);
                expect(json).toEqual({
                    values: {
                        v1: 1,
                        v2: 2
                    }
                });

            });

        }

        runTests("Normal", serializeAs, serializeAsMap, serializeAsArray, serializeAsJson);
        runTests("Auto", autoserializeAs, autoserializeAsMap, autoserializeAsArray, autoserializeAsJson);

    });

    describe("SerializeAsArray", function () {

        function runTests(blockName: string, serializeAs: any, serializeAsMap: any, serializeAsArray: any, serializeAsJson: any) {

            describe(blockName, function () {

                it("serializes an array of primitives", function () {
                    class Test {
                        @serializeAsArray(Number) value: Array<number>;
                    }

                    const t = new Test();
                    t.value = [1, 2, 3];
                    const json = Serialize(t, Test);
                    expect(json["value"]).toEqual([1, 2, 3]);
                });

                it("serializes an array of typed objects", function () {
                    class TestType {
                        @serializeAs(String) strVal: string;

                        constructor(val: string) {
                            this.strVal = val;
                        }
                    }

                    class Test {
                        @serializeAsArray(TestType) value: Array<TestType>;
                    }

                    const t = new Test();
                    t.value = [
                        new TestType("str0"),
                        new TestType("str1"),
                        new TestType("str2")
                    ];
                    const json = Serialize(t, Test);
                    expect(json["value"]).toEqual([
                        { strVal: "str0" },
                        { strVal: "str1" },
                        { strVal: "str2" }
                    ]);
                });

                it("serializes nested arrays", function () {
                    class TestTypeL0 {
                        @serializeAs(String) strVal: string;

                        constructor(val: string) {
                            this.strVal = val;
                        }

                    }

                    class TestTypeL1 {
                        @serializeAsArray(TestTypeL0) l0List: Array<TestTypeL0>;

                        constructor(l0List: TestTypeL0[]) {
                            this.l0List = l0List;
                        }

                    }

                    class Test {
                        @serializeAsArray(TestTypeL1) value: Array<TestTypeL1>;
                    }

                    const t = new Test();
                    t.value = [
                        new TestTypeL1([new TestTypeL0("00"), new TestTypeL0("01")]),
                        new TestTypeL1([new TestTypeL0("10"), new TestTypeL0("11")]),
                        new TestTypeL1([new TestTypeL0("20"), new TestTypeL0("21")])
                    ];
                    const json = Serialize(t, Test);
                    expect(json["value"]).toEqual([
                        { l0List: [{ strVal: "00" }, { strVal: "01" }] },
                        { l0List: [{ strVal: "10" }, { strVal: "11" }] },
                        { l0List: [{ strVal: "20" }, { strVal: "21" }] }
                    ]);
                });

                it("serializes an array with a different key", function () {
                    class Test {
                        @serializeAsArray(Number, "different") value: Array<number>;
                    }

                    const t = new Test();
                    t.value = [1, 2, 3];
                    const json = Serialize(t, Test);
                    expect(json["value"]).toBeUndefined();
                    expect(json["different"]).toEqual([1, 2, 3]);
                });

            });

        }

        runTests("Normal", serializeAs, serializeAsMap, serializeAsArray, serializeAsJson);
        runTests("Auto", autoserializeAs, autoserializeAsMap, autoserializeAsArray, autoserializeAsJson);

    });

    describe("SerializeJSON", function () {

        function runTests(blockName: string, serializeAs: any, serializeAsMap: any, serializeAsArray: any, serializeAsJson: any) {

            describe(blockName, function () {

                it("serializes a primitive as json", function () {

                    class Test {
                        @serializeAsJson() value0: string;
                        @serializeAsJson() value1: boolean;
                        @serializeAsJson() value2: number;
                    }

                    var s = new Test();
                    s.value0 = "strvalue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, Test);
                    expect(json["value0"]).toBe("strvalue");
                    expect(json["value1"]).toBe(true);
                    expect(json["value2"]).toBe(100);
                });

                it("serializes an array of primitives as json", function () {
                    class Test {
                        @serializeAsJson() value0: string[];
                        @serializeAsJson() value1: boolean[];
                        @serializeAsJson() value2: number;
                    }

                    var s = new Test();
                    s.value0 = ["strvalue", "00"];
                    s.value1 = [false, true];
                    s.value2 = 100;
                    const json = Serialize(s, Test);
                    expect(json["value0"]).toEqual(["strvalue", "00"]);
                    expect(json["value1"]).toEqual([false, true]);
                    expect(json["value2"]).toBe(100);
                });

                it("skips undefined keys", function () {
                    class Test {
                        @serializeAsJson() value: Indexable<number>;
                    }

                    var s = new Test();
                    s.value = { v0: 1, v1: void 0, v2: 2 };
                    const json = Serialize(s, Test);
                    expect(json).toEqual({
                        value: {
                            v0: 1,
                            v2: 2
                        }
                    });
                });

                it("serializes an array of non primitives as json", function () {

                    class TestL0 {
                        value0: string;
                        value1: boolean;
                        value2: number;
                    }

                    class Test {
                        @serializeAsJson() values: TestL0[];
                    }

                    var s = new Test();
                    var l0 = new TestL0();
                    var l1 = new TestL0();
                    s.values = [l0, l1];
                    l0.value0 = "strvalue";
                    l0.value1 = true;
                    l0.value2 = 100;
                    l1.value0 = "strvalue2";
                    l1.value1 = true;
                    l1.value2 = 101;
                    const json = Serialize(s, Test);
                    expect(json).toEqual({
                        values: [{
                            value0: "strvalue",
                            value1: true,
                            value2: 100
                        }, {
                            value0: "strvalue2",
                            value1: true,
                            value2: 101
                        }]
                    });

                });

                it("serializes a map of primitives as json", function () {

                    class TestL0 {
                        value0: string;
                        value1: boolean;
                        value2: number;
                    }

                    class Test {
                        @serializeAsJson() value0: TestL0;
                    }

                    var s = new Test();
                    var l0 = new TestL0();
                    s.value0 = l0;
                    l0.value0 = "strvalue";
                    l0.value1 = true;
                    l0.value2 = 100;
                    const json = Serialize(s, Test);
                    expect(json).toEqual({
                        value0: {
                            value0: "strvalue",
                            value1: true,
                            value2: 100
                        }
                    });

                });

                it("serializes a map of non primitives as json", function () {

                    class TestL0 {
                        value0: string;
                        value1: boolean;
                        value2: number;
                    }

                    class Test {
                        @serializeAsJson() values: Indexable<TestL0>;
                    }

                    var s = new Test();
                    var l0 = new TestL0();
                    var l1 = new TestL0();
                    s.values = { key0: l0, key1: l1 };
                    l0.value0 = "strvalue";
                    l0.value1 = true;
                    l0.value2 = 100;
                    l1.value0 = "strvalue2";
                    l1.value1 = true;
                    l1.value2 = 101;
                    const json = Serialize(s, Test);
                    expect(json).toEqual({
                        values: {
                            key0: {
                                value0: "strvalue",
                                value1: true,
                                value2: 100
                            },
                            key1: {
                                value0: "strvalue2",
                                value1: true,
                                value2: 101
                            }
                        }
                    });

                });

                it("serializes an array of non primitives as json", function () {

                    class TestL0 {
                        value0: string;
                        value1: boolean;
                        value2: number;
                    }

                    class Test {
                        @serializeAsJson() values: TestL0[];
                    }

                    var s = new Test();
                    var l0 = new TestL0();
                    var l1 = new TestL0();
                    s.values = [l0, l1];
                    l0.value0 = "strvalue";
                    l0.value1 = true;
                    l0.value2 = 100;
                    l1.value0 = "strvalue2";
                    l1.value1 = true;
                    l1.value2 = 101;
                    const json = Serialize(s, Test);
                    expect(json).toEqual({
                        values: [{
                            value0: "strvalue",
                            value1: true,
                            value2: 100
                        }, {
                            value0: "strvalue2",
                            value1: true,
                            value2: 101
                        }]
                    });

                });

                it("does not serialize functions", function () {
                    class Test {
                        @serializeAsJson() value0: () => void;
                    }

                    var s = new Test();
                    s.value0 = () => { };
                    const json = Serialize(s, Test);
                    expect(json).toEqual({
                        value0: null
                    });
                });

                it("serializes json with a different key", function () {
                    class Test {
                        @serializeAsJson("different") value0: string;
                    }

                    var s = new Test();
                    s.value0 = "strvalue";
                    const json = Serialize(s, Test);
                    expect(json).toEqual({
                        different: "strvalue"
                    });

                });

                it("ignores nested serialization annotations", function () {
                    class Sub {
                        @serializeAs(Number) n: string = "100";
                    }

                    class Test {
                        @serializeAsJson() value0: Sub;
                    }

                    var s = new Test();
                    s.value0 = new Sub();
                    const json = Serialize(s, Test);
                    expect(json).toEqual({
                        value0: { n: "100" }
                    });
                });

                it("applies key transforms by default", function () {
                    SetSerializeKeyTransform(function (value) {
                        return value.toUpperCase();
                    });

                    class Test {
                        @serializeAsJson() value0: string;
                        @serializeAsJson() value1: boolean;
                        @serializeAsJson() value2: number;
                    }

                    var s = new Test();
                    s.value0 = "strvalue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, Test);
                    SetSerializeKeyTransform(null);
                    expect(json).toEqual({
                        VALUE0: "strvalue",
                        VALUE1: true,
                        VALUE2: 100
                    });
                });

                it("applies key transforms when set to true", function () {

                    SetSerializeKeyTransform(function (value) {
                        return value.toUpperCase();
                    });

                    class Test {
                        @serializeAsJson(true) value0: string;
                        @serializeAsJson(true) value1: boolean;
                        @serializeAsJson(true) value2: number;
                    }

                    var s = new Test();
                    s.value0 = "strvalue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, Test);
                    SetSerializeKeyTransform(null);
                    expect(json).toEqual({
                        VALUE0: "strvalue",
                        VALUE1: true,
                        VALUE2: 100
                    });
                });

                it("does not apply key transforms when set to false", function () {
                    SetSerializeKeyTransform(function (value) {
                        return value.toUpperCase();
                    });

                    class Test {
                        @serializeAsJson(false) value0 = { v0: "yes", v1: "no" };
                        @serializeAsJson(false) value1: boolean = true;
                        @serializeAsJson(true) value2: number = 100;
                    }

                    var s = new Test();
                    const json = Serialize(s, Test);
                    SetSerializeKeyTransform(null);
                    expect(json).toEqual({
                        VALUE0: { v0: "yes", v1: "no" },
                        VALUE1: true,
                        VALUE2: 100
                    });
                });

            });
        }

        runTests("Normal", serializeAs, serializeAsMap, serializeAsArray, serializeAsJson);
        runTests("Auto", autoserializeAs, autoserializeAsMap, autoserializeAsArray, autoserializeAsJson);

    });

    describe("SerializeUsing", function () {

        it("uses the provided function", function () {
            function x(value: any) { return "yes"; }

            class Test {
                @serializeUsing(x) value: number = 1;
                @autoserializeUsing({ Serialize: x, Deserialize: x }) value1: number = 1;
            }

            const s = new Test();
            const json = Serialize(s, Test);
            expect(json).toEqual({
                value: "yes",
                value1: "yes"
            });

        });

    });

    describe("onSerialized", function () {

        it("invokes the handler if provided", function () {
            class Test {

                @serializeAs(Number) value: number = 1;

                static onSerialized(json: JsonObject, instance: Test): void {
                    json["newvalue"] = "yes";
                    expect(instance instanceof Test).toBeTruthy();
                }

            }

            const s = new Test();
            const json = Serialize(s, Test);
            expect(json).toEqual({
                value: 1,
                newvalue: "yes"
            });

        });

        it("accepts the return value of onSerialized if provided", function () {
            class Test {

                @serializeAs(Number) value: number = 1;

                static onSerialized(json: JsonObject, instance: Test) {
                    return { v: "hello" };
                }

            }

            const s = new Test();
            const json = Serialize(s, Test);
            expect(json).toEqual({
                v: "hello"
            });

        });

    });

    describe("ReferanceCycle", function () {

        it("Cycle length 3", function () {
            class Test {
                @serializeAs(Test) next: Test;
            }

            const s = new Test();
            s.next = new Test();
            s.next.next = new Test();
            s.next.next.next = s;
            SetRefCycleDetection(true);
            const json = Serialize(s, Test);
            refClean();
            SetRefCycleDetection(false);
            expect(json).toEqual({
                "$id": 1,
                next: {
                    "$id": 2,
                    next: {
                        "$id": 3,
                        next: {
                            "$ref": 1
                        }
                    }
                }
            });

        });

        it("Cycle length 0", function () {
            class Test {
                @serializeAs(Test) next: Test;
            }

            const s = new Test();
            s.next = s;
            SetRefCycleDetection(true);
            const json = Serialize(s, Test);
            refClean();
            SetRefCycleDetection(false);
            expect(json).toEqual({
                "$id": 1,
                next: {
                    "$ref": 1,
                }
            });

        });

    });

    describe("Selective serialisation", function () {

        it("Bitmask", function () {
            class Test {
                @serializeBitMask(1)
                @serializeAs(Number)
                v1: number = 1;
                @serializeBitMask(3)
                @serializeAs(Number)
                v2: number = 2;
                @serializeAs(Number)
                @serializeBitMask(2)
                v3: number = 3;
            }

            const s = new Test();
            SelectiveSerialization(1)
            const json1 = Serialize(s, Test);
            expect(json1).toEqual({
                v1: 1,
                v2: 2
            });
            SelectiveSerialization(2)
            const json2 = Serialize(s, Test);
            expect(json2).toEqual({
                v2: 2,
                v3: 3
            });
            SelectiveSerialization(3)
            const json3 = Serialize(s, Test);
            expect(json3).toEqual({
                v1: 1,
                v2: 2,
                v3: 3
            });

        });

    });

    describe("RuntimeTyping serialisation", function () {

        it("Array", function () {
            class Test0 {
                @serializeAs(Number)
                valueA: Number = 0;
            }
            class Test1 extends Test0 {
                @serializeAs(Number)
                valueB: Number = 1;
            }
            class Test2 extends Test1 {
                @serializeAs(Number)
                valueC: Number = 2;
            }
            class Test3 extends Test1 {
                @serializeAs(Number)
                valueD: Number = 3;
            }

            const s = Array<Test0>();
            s.push(new Test0(), new Test1(), new Test2(), new Test3())
            TypesString.runtimeTyping = true;
            TypesString.setTypeString(Test0, "my Test0 type");
            TypesString.setTypeString(Test1, "my Test1 type");
            TypesString.setTypeString(Test2, "my Test2 type");
            TypesString.setTypeString(Test3, "my Test3 type");
            const json = SerializeArray(s, Test0);
            TypesString.runtimeTyping = false;
            TypesString.resetDictionnary();
            expect(json).toEqual([
                { "$type": "my Test0 type", "valueA": 0 },
                { "$type": "my Test1 type", "valueB": 1 },
                { "$type": "my Test2 type", "valueC": 2 },
                { "$type": "my Test3 type", "valueD": 3 }
            ]);

        });

        it("Object", function () {
            class Test0 {
                @serializeAs(Boolean)
                valueA: boolean = true;
            }
            class Test1 {
                @serializeAs(Boolean)
                valueB: boolean = true;
            }
            @inheritSerialization(Test1)
            class Test2 extends Test1 {
            }
            class Test3 {
                @serializeAs(Object)
                m1: Test0;
                @serializeAs(Test2)
                m2: Test1;
            }

            const s = new Test3();
            s.m1 = new Test0();
            s.m2 = new Test2();
            TypesString.runtimeTyping = true;
            TypesString.setTypeString(Test0, "my Test0 type");
            TypesString.setTypeString(Test1, "my Test1 type");
            TypesString.setTypeString(Test2, "my Test2 type");
            TypesString.setTypeString(Test3, "my Test3 type");
            const json = Serialize(s, Test3);
            TypesString.runtimeTyping = false;
            TypesString.resetDictionnary();
            expect(json).toEqual({
                "$type": "my Test3 type",
                m1: { "$type": "my Test0 type", valueA: true },
                m2: { "$type": "my Test2 type", valueB: true }
            });

        });

    });

    describe("Accessor", function () {

        it("accessor get & set", function () {
            class Drapeau {
                b_: number;
                constructor(n: number) {
                    this.b_ = n;
                }
                @serializeAs(Number, "bprime")
                public get b() {
                    return this.b_ + 1;
                }
            }

            const d = new Drapeau(2);
            const json = Serialize(d, Drapeau);
            expect(json).toEqual({ "bprime" : 3 });

        });

    });

});