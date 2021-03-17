import {
    itIsAnArray,
    RefClean,
    RefCycleDetectionDisable,
    RefCycleDetectionEnable,
    Serialize,
    SerializeArray,
    SetSerializeKeyTransform,
} from "../src";
import {
    autoserializeAs,
    autoserializeAsArray,
    autoserializeAsJson,
    autoserializeAsMap,
    autoserializeAsObjectMap,
    autoserializeUsing,
    defaultValue,
    emitDefaultValue,
    inheritSerialization,
    isReference,
    serializeAs,
    serializeAsArray,
    serializeAsJson,
    serializeAsMap,
    serializeAsObjectMap,
    serializeAsSet,
    serializeBitMask,
    serializeUsing,
} from "../src/decorators";
import {
    RuntimeTypingDisable,
    RuntimeTypingEnable,
    RuntimeTypingResetDictionary,
    RuntimeTypingSetTypeString,
} from "../src/runtime_typing";
import {
    SelectiveSerialization,
} from "../src/serialize";
import {
    IIndexable,
    IJsonObject,
} from "../src/types";

describe("Serializing", () => {
    describe("Unannotated", () => {
        it("will not serialize unannotated fields", () => {
            class Test {
                public value: number = 1;
            }

            const x = new Test();
            const json = Serialize(x, () => Test);
            expect(json).toEqual({});
        });
    });

    describe("SerializeAs", () => {
        function runTests(
            blockName: string,
            testSerializeAs: Function
        ) {
            describe(blockName, () => {
                it("serializes basic primitives", () => {
                    class Test {
                        @testSerializeAs(() => String)
                        public value0!: string;
                        @testSerializeAs(() => Boolean)
                        public value1!: boolean;
                        @testSerializeAs(() => Number)
                        public value2!: number;
                    }

                    const s = new Test();
                    s.value0 = "strValue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, () => Test);
                    expect(json.value0).toBe("strValue");
                    expect(json.value1).toBe(true);
                    expect(json.value2).toBe(100);
                });

                it("serializes a Date", () => {
                    class Test {
                        @testSerializeAs(() => Date)
                        public value0!: Date;
                    }

                    const d = new Date();
                    const s = new Test();
                    s.value0 = d;
                    const json = Serialize(s, () => Test);
                    expect(json).toEqual({
                        value0: d.valueOf()
                    });
                });

                it("serializes a RegExp", () => {
                    class Test {
                        @testSerializeAs(() => RegExp)
                        public value0!: RegExp;
                    }

                    const s = new Test();
                    s.value0 = /[123]/g;
                    const json = Serialize(s, () => Test);
                    expect(json).toEqual({
                        value0: "/[123]/g"
                    });
                });

                it("serializes non matching primitive type", () => {
                    class Test {
                        @testSerializeAs(() => Number)
                        public value0!: string;
                        @testSerializeAs(() => String)
                        public value1!: boolean;
                        @testSerializeAs(() => Boolean)
                        public value2!: number;
                    }

                    const s = new Test();
                    s.value0 = "strValue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, () => Test);
                    expect(json.value0).toBe(NaN);
                    expect(json.value1).toBe("true");
                    expect(json.value2).toBe(true);
                });

                it("serializes with different keys", () => {
                    class Test {
                        @testSerializeAs(() => String, "v0")
                        public value0!: string;
                        @testSerializeAs(() => Boolean, "v1")
                        public value1!: boolean;
                        @testSerializeAs(() => Number)
                        public value2!: number;
                    }

                    const s = new Test();
                    s.value0 = "strValue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, () => Test);
                    expect(json.v0).toBe("strValue");
                    expect(json.v1).toBe(true);
                    expect(json.value2).toBe(100);
                });

                it("skips undefined keys", () => {
                    class Test {
                        @testSerializeAs(() => String)
                        public value0!: string | undefined;
                        @testSerializeAs(() => Boolean)
                        public value1!: boolean;
                        @testSerializeAs(() => Number)
                        public value2!: number;
                    }

                    const s = new Test();
                    s.value0 = undefined;
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, () => Test);
                    expect(json.value0).not.toBeDefined();
                    expect(json.value1).toBe(true);
                    expect(json.value2).toBe(100);
                });

                it("does not skip null keys", () => {
                    class Test {
                        @testSerializeAs(() => String)
                        public value0!: string | null;
                        @testSerializeAs(() => Boolean)
                        public value1!: boolean;
                        @testSerializeAs(() => Number)
                        public value2!: number;
                    }

                    const s = new Test();
                    s.value0 = null;
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, () => Test);
                    expect(json.value0).toBeNull();
                    expect(json.value1).toBe(true);
                    expect(json.value2).toBe(100);
                });

                it("serializes nested types", () => {
                    class Test {
                        @testSerializeAs(() => String)
                        public value0!: string | null;
                        @testSerializeAs(() => Boolean)
                        public value1!: boolean;
                        @testSerializeAs(() => Number)
                        public value2!: number;
                    }

                    class Test0 {
                        @testSerializeAs(() => Test)
                        public test!: Test;
                    }

                    const x = new Test0();
                    const s = new Test();
                    x.test = s;
                    s.value0 = null;
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(x, () => Test0);
                    expect(json.test).toEqual({
                        value0: null,
                        value1: true,
                        value2: 100
                    });
                });

                it("serializes doubly nested types", () => {
                    class Test {
                        @testSerializeAs(() => String)
                        public value0!: string | null;
                        @testSerializeAs(() => Boolean)
                        public value1!: boolean;
                        @testSerializeAs(() => Number)
                        public value2!: number;
                    }

                    class Test0 {
                        @testSerializeAs(() => Test)
                        public test!: Test;
                    }

                    class Test1 {
                        @testSerializeAs(() => Test0)
                        public test!: Test0;
                    }

                    const z = new Test1();
                    const x = new Test0();
                    const s = new Test();
                    x.test = s;
                    z.test = x;
                    s.value0 = null;
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(z, () => Test1);
                    expect(json.test).toEqual({
                        test: {
                            value0: null,
                            value1: true,
                            value2: 100
                        }
                    });
                });
            });
        }

        runTests(
            "Normal",
            serializeAs
        );
        runTests(
            "Auto",
            autoserializeAs
        );
    });

    describe("SerializeAsMap", () => {
        it("serializes a map string to array", () => {
            class Test {
                @serializeAsMap(() => String, itIsAnArray(() => Number))
                public values!: Map<string, number[]>;
            }

            const t = new Test();
            t.values = new Map([
                ["v0", [1]],
                ["v1", [2]],
                ["v2", [3]]
            ]);
            const json = Serialize(t, () => Test);
            expect(json.values).toEqual({
                v0: [1],
                v1: [2],
                v2: [3]
            });
        });

        it("serializes a map of primitives", () => {
            class Test {
                @serializeAsMap(() => String, () => Number)
                public values!: Map<string, number>;
            }

            const t = new Test();
            t.values = new Map([
                ["v0", 1],
                ["v1", 2],
                ["v2", 3]
            ]);
            const json = Serialize(t, () => Test);
            expect(json.values).toEqual({
                v0: 1,
                v1: 2,
                v2: 3
            });
        });

        it("serializes a custom Map of primitives 1", () => {
            class Test {
                @serializeAsMap(() => String, () => Number)
                public values!: Map<string, number>;
            }

            const t = new Test();
            t.values = new Map([
                ["v0", 1],
                ["v1", 2],
                ["v2", 3]
            ]);
            const json = Serialize(t, () => Test);
            expect(json.values).toEqual({
                v0: 1,
                v1: 2,
                v2: 3
            });
        });

        it("serializes a custom Map of primitives 2", () => {
            class MyMap extends Map<string, number> {}
            class Test {
                @autoserializeAsMap(() => String, () => Number, () => MyMap)
                public values!: MyMap;
            }

            const t = new Test();
            t.values = new Map([
                ["v0", 1],
                ["v1", 2],
                ["v2", 3]
            ]);
            const json = Serialize(t, () => Test);
            expect(json.values).toEqual({
                v0: 1,
                v1: 2,
                v2: 3
            });
        });

        it("serializes a map of typed objects", () => {
            class TestType {
                @serializeAs(() => Number)
                public value: number;

                constructor(arg: number) {
                    this.value = arg;
                }
            }

            class Test {
                @serializeAsMap(() => String, () => TestType)
                public values!: Map<string, TestType>;
            }

            const t = new Test();
            t.values = new Map ([
                ["v0", new TestType(0)],
                ["v1", new TestType(1)],
                ["v2", new TestType(2)]
            ]);
            const json = Serialize(t, () => Test);
            expect(json.values).toEqual({
                v0: { value: 0 },
                v1: { value: 1 },
                v2: { value: 2 }
            });
        });

        it("serializes a map with a different key name", () => {
            class TestType {
                @serializeAs(() => Number)
                public value: number;

                constructor(arg: number) {
                    this.value = arg;
                }
            }

            class Test {
                @serializeAsMap(() => String, () => TestType, () => Map, "different")
                public values!: Map<string, TestType>;
            }

            const t = new Test();
            t.values = new Map ([
                ["v0", new TestType(0)],
                ["v1", new TestType(1)],
                ["v2", new TestType(2)]
            ]);
            const json = Serialize(t, () => Test);
            expect(json.values).not.toBeDefined();
            expect(json.different).toEqual({
                v0: { value: 0 },
                v1: { value: 1 },
                v2: { value: 2 }
            });
        });

        it("serializes nested maps", () => {
            class TestType {
                @serializeAsMap(() => String, () => Number)
                public value: Map<string, number>;

                constructor(arg: Map<string, number>) {
                    this.value = arg;
                }
            }

            class Test {
                @serializeAsMap(() => String, () => TestType)
                public values!: Map<String, TestType>;
            }

            const t = new Test();
            t.values = new Map([
                ["v0", new TestType(new Map([["v00", 1], ["v01", 2] ]))],
                ["v1", new TestType(new Map([["v10", 2], ["v11", 2] ]))],
                ["v2", new TestType(new Map([["v20", 3], ["v21", 2] ]))]
                ]);
            const json = Serialize(t, () => Test);
            expect(json.values).toEqual({
                v0: { value: { v00: 1, v01: 2 } },
                v1: { value: { v10: 2, v11: 2 } },
                v2: { value: { v20: 3, v21: 2 } }
            });
        });

        it("skips undefined keys", () => {
            class Test {
                @serializeAsMap(() => String, () => Number)
                public values!: Map<string, number | undefined>;
            }

            const t = new Test();
            t.values = new Map([
                ["v0", undefined],
                ["v1", 1],
                ["v2", 2]
            ]);
            const json = Serialize(t, () => Test);
            expect(json).toEqual({
                values: {
                    v1: 1,
                    v2: 2
                }
            });
        });
    });

    describe("SerializeAsObjectMap", () => {
        function runTests(
            blockName: string,
            testSerializeAs: Function,
            testSerializeAsObjectMap: Function
        ) {
            describe(blockName, () => {
                it("serializes a map of primitives", () => {
                    class Test {
                        @testSerializeAsObjectMap(() => Number)
                        public values!: IIndexable<number>;
                    }

                    const t = new Test();
                    t.values = {
                        v0: 1,
                        v1: 2,
                        v2: 3
                    };
                    const json = Serialize(t, () => Test);
                    expect(json.values).toEqual({
                        v0: 1,
                        v1: 2,
                        v2: 3
                    });
                });

                it("serializes a map of typed objects", () => {
                    class TestType {
                        @testSerializeAs(() => Number)
                        public value: number;

                        constructor(arg: number) {
                            this.value = arg;
                        }
                    }

                    class Test {
                        @testSerializeAsObjectMap(() => TestType)
                        public values!: IIndexable<TestType>;
                    }

                    const t = new Test();
                    t.values = {
                        v0: new TestType(0),
                        v1: new TestType(1),
                        v2: new TestType(2)
                    };
                    const json = Serialize(t, () => Test);
                    expect(json.values).toEqual({
                        v0: { value: 0 },
                        v1: { value: 1 },
                        v2: { value: 2 }
                    });
                });

                it("serializes a map with a different key name", () => {
                    class TestType {
                        @testSerializeAs(() => Number)
                        public value: number;

                        constructor(arg: number) {
                            this.value = arg;
                        }
                    }

                    class Test {
                        @testSerializeAsObjectMap(() => TestType, "different")
                        public values!: IIndexable<TestType>;
                    }

                    const t = new Test();
                    t.values = {
                        v0: new TestType(0),
                        v1: new TestType(1),
                        v2: new TestType(2)
                    };
                    const json = Serialize(t, () => Test);
                    expect(json.values).not.toBeDefined();
                    expect(json.different).toEqual({
                        v0: { value: 0 },
                        v1: { value: 1 },
                        v2: { value: 2 }
                    });
                });

                it("serializes nested maps", () => {
                    class TestType {
                        @testSerializeAsObjectMap(() => Number)
                        public value: IIndexable<number>;

                        constructor(arg: IIndexable<number>) {
                            this.value = arg;
                        }
                    }

                    class Test {
                        @testSerializeAsObjectMap(() => TestType)
                        public values!: IIndexable<TestType>;
                    }

                    const t = new Test();
                    t.values = {
                        v0: new TestType({ v00: 1, v01: 2 }),
                        v1: new TestType({ v10: 2, v11: 2 }),
                        v2: new TestType({ v20: 3, v21: 2 })
                    };
                    const json = Serialize(t, () => Test);
                    expect(json.values).toEqual({
                        v0: { value: { v00: 1, v01: 2 } },
                        v1: { value: { v10: 2, v11: 2 } },
                        v2: { value: { v20: 3, v21: 2 } }
                    });
                });
            });

            it("skips undefined keys", () => {
                class Test {
                    @testSerializeAsObjectMap(() => Number)
                    public values!: IIndexable<number | undefined>;
                }

                const t = new Test();
                t.values = {
                    v0: undefined,
                    v1: 1,
                    v2: 2
                };
                const json = Serialize(t, () => Test);
                expect(json).toEqual({
                    values: {
                        v1: 1,
                        v2: 2
                    }
                });
            });
        }

        runTests(
            "Normal",
            serializeAs,
            serializeAsObjectMap
        );
        runTests(
            "Auto",
            autoserializeAs,
            autoserializeAsObjectMap
        );
    });

    describe("SerializeAsArray", () => {
        function runTests(
            blockName: string,
            testSerializeAs: Function,
            testSerializeAsArray: Function,
        ) {
            describe(blockName, () => {
                it("serializes an array of primitives 1", () => {
                    class Test {
                        @testSerializeAsArray(() => Number)
                        public value!: number[];
                    }

                    const t = new Test();
                    t.value = [1, 2, 3];
                    const json = Serialize(t, () => Test);
                    expect(json.value).toEqual([1, 2, 3]);
                });

                it("serializes an array of primitives 2", () => {
                    class Test {
                        @testSerializeAs(itIsAnArray(() => Number))
                        public value!: number[];
                    }

                    const t = new Test();
                    t.value = [1, 2, 3];
                    const json = Serialize(t, () => Test) as IJsonObject;
                    expect(json.value).toEqual([1, 2, 3]);
                });

                it("serializes an array of primitives 3", () => {
                    const json = Serialize([1, 2, 3], itIsAnArray(() => Number));
                    expect(json).toEqual([1, 2, 3]);
                });

                it("serializes an array of typed objects", () => {
                    class TestType {
                        @testSerializeAs(() => String)
                        public strVal: string;

                        constructor(val: string) {
                            this.strVal = val;
                        }
                    }

                    class Test {
                        @testSerializeAsArray(() => TestType)
                        public value!: TestType[];
                    }

                    const t = new Test();
                    t.value = [
                        new TestType("str0"),
                        new TestType("str1"),
                        new TestType("str2")
                    ];
                    const json = Serialize(t, () => Test);
                    expect(json.value).toEqual([
                        { strVal: "str0" },
                        { strVal: "str1" },
                        { strVal: "str2" }
                    ]);
                });

                it("serializes nested arrays 1", () => {
                    class TestTypeL0 {
                        @testSerializeAs(() => String)
                        public strVal: string;

                        constructor(val: string) {
                            this.strVal = val;
                        }
                    }

                    class TestTypeL1 {
                        @testSerializeAsArray(() => TestTypeL0)
                        public l0List: TestTypeL0[];

                        constructor(l0List: TestTypeL0[]) {
                            this.l0List = l0List;
                        }
                    }

                    class Test {
                        @testSerializeAsArray(() => TestTypeL1)
                        public value!: TestTypeL1[];
                    }

                    const t = new Test();
                    t.value = [
                        new TestTypeL1([
                            new TestTypeL0("00"),
                            new TestTypeL0("01")
                        ]),
                        new TestTypeL1([
                            new TestTypeL0("10"),
                            new TestTypeL0("11")
                        ]),
                        new TestTypeL1([
                            new TestTypeL0("20"),
                            new TestTypeL0("21")
                        ])
                    ];
                    const json = Serialize(t, () => Test);
                    expect(json.value).toEqual([
                        { l0List: [{ strVal: "00" }, { strVal: "01" }] },
                        { l0List: [{ strVal: "10" }, { strVal: "11" }] },
                        { l0List: [{ strVal: "20" }, { strVal: "21" }] }
                    ]);
                });

                it("serializes nested arrays 2", () => {
                    const t = [[1, 2], [3, 4]];
                    const json = Serialize(t, itIsAnArray(itIsAnArray(() => Number)));
                    expect(json).toEqual([[1, 2], [3, 4]]);
                });

                it("serializes an array with a different key", () => {
                    class Test {
                        @testSerializeAsArray(() => Number, () => Array, "different")
                        public value!: number[];
                    }

                    const t = new Test();
                    t.value = [1, 2, 3];
                    const json = Serialize(t, () => Test);
                    expect(json.value).toBeUndefined();
                    expect(json.different).toEqual([1, 2, 3]);
                });
            });
        }

        runTests(
            "Normal",
            serializeAs,
            serializeAsArray
        );
        runTests(
            "Auto",
            autoserializeAs,
            autoserializeAsArray
        );
    });

    describe("SerializeAsSet", () => {
        it("serializes a Set of primitives", () => {
            class MySet<T> extends Set<T> {}
            class Test {
                @serializeAsSet(() => Number, () => MySet)
                public value!: MySet<number>;
            }

            const t = new Test();
            t.value = new MySet([1, 2, 3]);
            const json = Serialize(t, () => Test);
            expect(json.value).toEqual([1, 2, 3]);
        });

        it("serializes a Set of primitives", () => {
            class Test {
                @serializeAsSet(() => Number)
                public value!: Set<number>;
            }

            const t = new Test();
            t.value = new Set([1, 2, 3]);
            const json = Serialize(t, () => Test);
            expect(json.value).toEqual([1, 2, 3]);
        });
        it("serializes an array of typed objects", () => {
            class TestType {
                @serializeAs(() => String)
                public strVal: string;

                constructor(val: string) {
                    this.strVal = val;
                }
            }

            class Test {
                @serializeAsSet(() => TestType)
                public value!: Set<TestType>;
            }

            const t = new Test();
            t.value = new Set([
                new TestType("str0"),
                new TestType("str1"),
                new TestType("str2")
            ]);
            const json = Serialize(t, () => Test);
            expect(json.value).toEqual([
                { strVal: "str0" },
                { strVal: "str1" },
                { strVal: "str2" }
            ]);
        });

        it("serializes nested arrays", () => {
            class TestTypeL0 {
                @serializeAs(() => String)
                public strVal: string;

                constructor(val: string) {
                    this.strVal = val;
                }
            }

            class TestTypeL1 {
                @serializeAsSet(() => TestTypeL0)
                public l0List: Set<TestTypeL0>;

                constructor(l0List: Set<TestTypeL0>) {
                    this.l0List = l0List;
                }
            }

            class Test {
                @serializeAsSet(() => TestTypeL1)
                public value!: Set<TestTypeL1>;
            }

            const t = new Test();
            t.value = new Set([
                new TestTypeL1(new Set([
                    new TestTypeL0("00"),
                    new TestTypeL0("01")
                ])),
                new TestTypeL1(new Set([
                    new TestTypeL0("10"),
                    new TestTypeL0("11")
                ])),
                new TestTypeL1(new Set([
                    new TestTypeL0("20"),
                    new TestTypeL0("21")
                ]))
            ]);
            const json = Serialize(t, () => Test);
            expect(json.value).toEqual([
                { l0List: [{ strVal: "00" }, { strVal: "01" }] },
                { l0List: [{ strVal: "10" }, { strVal: "11" }] },
                { l0List: [{ strVal: "20" }, { strVal: "21" }] }
            ]);
        });

        it("serializes an array with a different key", () => {
            class Test {
                @serializeAsSet(() => Number, () => Set, "different")
                public value!: Set<number>;
            }

            const t = new Test();
            t.value = new Set([1, 2, 3]);
            const json = Serialize(t, () => Test);
            expect(json.value).toBeUndefined();
            expect(json.different).toEqual([1, 2, 3]);
        });
    });

    describe("SerializeJSON", () => {
        function runTests(
            blockName: string,
            testSerializeAs: Function,
            testSerializeAsJson: Function
        ) {
            describe(blockName, () => {
                it("serializes a typed map", () => {
                    class Satellite {
                        @testSerializeAs(() => String)
                        public name: string;
                        constructor(nameArg: string) {
                            this.name = nameArg;
                        }
                    }
                    @inheritSerialization(() => Satellite)
                    class Moon extends Satellite {}
                    class MyDico extends Map<string, Satellite> {}
                    class Test0 {
                        @serializeAsMap(() => String, () => Satellite, () => MyDico)
                        public dico1!: MyDico;
                    }
                    const s = new Test0();
                    s.dico1 = new MyDico([["1", new Moon("Europa")], ["2", new Satellite("Adrastea")]]);
                    s.dico1.set("3" , new Moon("Callisto"));
                    RuntimeTypingEnable();
                    RuntimeTypingSetTypeString(Moon, "my Moon type");
                    RuntimeTypingSetTypeString(Satellite, "my Satellite type");
                    RuntimeTypingSetTypeString(Test0, "my Test0 type");
                    RuntimeTypingSetTypeString(MyDico, "my MyDico type");
                    const json = Serialize(s, () => Test0);
                    RuntimeTypingDisable();
                    RuntimeTypingResetDictionary();
                    expect((json.dico1 as IJsonObject)["1"]).toEqual({$type: "my Moon type", name: "Europa"});
                    expect((json.dico1 as IJsonObject)["2"]).toEqual({$type: "my Satellite type", name: "Adrastea"});
                    expect((json.dico1 as IJsonObject)["3"]).toEqual({$type: "my Moon type", name: "Callisto"});
                    expect((json.dico1 as IJsonObject).$type).toBe("my MyDico type");
                });

                it("serializes a primitive as json", () => {
                    class Test {
                        @testSerializeAsJson()
                        public value0!: string;
                        @testSerializeAsJson()
                        public value1!: boolean;
                        @testSerializeAsJson()
                        public value2!: number;
                    }

                    const s = new Test();
                    s.value0 = "strValue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, () => Test);
                    expect(json.value0).toBe("strValue");
                    expect(json.value1).toBe(true);
                    expect(json.value2).toBe(100);
                });

                it("serializes an array of primitives as json", () => {
                    class Test {
                        @testSerializeAsJson()
                        public value0!: string[];
                        @testSerializeAsJson()
                        public value1!: boolean[];
                        @testSerializeAsJson()
                        public value2!: number;
                    }

                    const s = new Test();
                    s.value0 = ["strValue", "00"];
                    s.value1 = [false, true];
                    s.value2 = 100;
                    const json = Serialize(s, () => Test);
                    expect(json.value0).toEqual(["strValue", "00"]);
                    expect(json.value1).toEqual([false, true]);
                    expect(json.value2).toBe(100);
                });

                it("skips undefined keys", () => {
                    class Test {
                        @testSerializeAsJson()
                        public value!: IIndexable<number | undefined>;
                    }

                    const s = new Test();
                    s.value = { v0: 1, v1: undefined, v2: 2 };
                    const json = Serialize(s, () => Test);
                    expect(json).toEqual({
                        value: {
                            v0: 1,
                            v2: 2
                        }
                    });
                });

                it("serializes an array of non primitives as json", () => {
                    class TestL0 {
                        public value0!: string;
                        public value1!: boolean;
                        public value2!: number;
                    }

                    class Test {
                        @testSerializeAsJson()
                        public values!: TestL0[];
                    }

                    const s = new Test();
                    const l0 = new TestL0();
                    const l1 = new TestL0();
                    s.values = [l0, l1];
                    l0.value0 = "strValue";
                    l0.value1 = true;
                    l0.value2 = 100;
                    l1.value0 = "strValue2";
                    l1.value1 = true;
                    l1.value2 = 101;
                    const json = Serialize(s, () => Test);
                    expect(json).toEqual({
                        values: [
                            {
                                value0: "strValue",
                                value1: true,
                                value2: 100
                            },
                            {
                                value0: "strValue2",
                                value1: true,
                                value2: 101
                            }
                        ]
                    });
                });

                it("serializes a map of primitives as json", () => {
                    class TestL0 {
                        public value0!: string;
                        public value1!: boolean;
                        public value2!: number;
                    }

                    class Test {
                        @testSerializeAsJson()
                        public value0!: TestL0;
                    }

                    const s = new Test();
                    const l0 = new TestL0();
                    s.value0 = l0;
                    l0.value0 = "strValue";
                    l0.value1 = true;
                    l0.value2 = 100;
                    const json = Serialize(s, () => Test);
                    expect(json).toEqual({
                        value0: {
                            value0: "strValue",
                            value1: true,
                            value2: 100
                        }
                    });
                });

                it("serializes a map of non primitives as json", () => {
                    class TestL0 {
                        public value0!: string;
                        public value1!: boolean;
                        public value2!: number;
                    }

                    class Test {
                        @testSerializeAsJson()
                        public values!: IIndexable<TestL0>;
                    }

                    const s = new Test();
                    const l0 = new TestL0();
                    const l1 = new TestL0();
                    s.values = { key0: l0, key1: l1 };
                    l0.value0 = "strValue";
                    l0.value1 = true;
                    l0.value2 = 100;
                    l1.value0 = "strValue2";
                    l1.value1 = true;
                    l1.value2 = 101;
                    const json = Serialize(s, () => Test);
                    expect(json).toEqual({
                        values: {
                            key0: {
                                value0: "strValue",
                                value1: true,
                                value2: 100
                            },
                            key1: {
                                value0: "strValue2",
                                value1: true,
                                value2: 101
                            }
                        }
                    });
                });

                it("serializes an array of non primitives as json", () => {
                    class TestL0 {
                        public value0!: string;
                        public value1!: boolean;
                        public value2!: number;
                    }

                    class Test {
                        @testSerializeAsJson()
                        public values!: TestL0[];
                    }

                    const s = new Test();
                    const l0 = new TestL0();
                    const l1 = new TestL0();
                    s.values = [l0, l1];
                    l0.value0 = "strValue";
                    l0.value1 = true;
                    l0.value2 = 100;
                    l1.value0 = "strValue2";
                    l1.value1 = true;
                    l1.value2 = 101;
                    const json = Serialize(s, () => Test);
                    expect(json).toEqual({
                        values: [
                            {
                                value0: "strValue",
                                value1: true,
                                value2: 100
                            },
                            {
                                value0: "strValue2",
                                value1: true,
                                value2: 101
                            }
                        ]
                    });
                });

                it("does not serialize functions", () => {
                    class Test {
                        @testSerializeAsJson()
                        public value0!: () => void;
                    }

                    const s = new Test();
                    s.value0 = () => {};
                    const json = Serialize(s, () => Test);
                    expect(json).toEqual({
                        value0: null
                    });
                });

                it("serializes json with a different key", () => {
                    class Test {
                        @testSerializeAsJson("different")
                        public value0!: string;
                    }

                    const s = new Test();
                    s.value0 = "strValue";
                    const json = Serialize(s, () => Test);
                    expect(json).toEqual({
                        different: "strValue"
                    });
                });

                it("ignores nested serialization annotations", () => {
                    class Sub {
                        @testSerializeAs(() => Number)
                        public n: string = "100";
                    }

                    class Test {
                        @testSerializeAsJson()
                        public value0!: Sub;
                    }

                    const s = new Test();
                    s.value0 = new Sub();
                    const json = Serialize(s, () => Test);
                    expect(json).toEqual({
                        value0: { n: "100" }
                    });
                });

                it("applies key transforms by default", () => {
                    SetSerializeKeyTransform((value) => {
                        return value.toUpperCase();
                    });

                    class Test {
                        @testSerializeAsJson()
                        public value0!: string;
                        @testSerializeAsJson()
                        public value1!: boolean;
                        @testSerializeAsJson()
                        public value2!: number;
                    }

                    const s = new Test();
                    s.value0 = "strValue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, () => Test);
                    SetSerializeKeyTransform(null);
                    expect(json).toEqual({
                        VALUE0: "strValue",
                        VALUE1: true,
                        VALUE2: 100
                    });
                });

                it("applies key transforms when set to true", () => {
                    SetSerializeKeyTransform((value) => {
                        return value.toUpperCase();
                    });

                    class Test {
                        @testSerializeAsJson(true)
                        public value0!: string;
                        @testSerializeAsJson(true)
                        public value1!: boolean;
                        @testSerializeAsJson(true)
                        public value2!: number;
                    }

                    const s = new Test();
                    s.value0 = "strValue";
                    s.value1 = true;
                    s.value2 = 100;
                    const json = Serialize(s, () => Test);
                    SetSerializeKeyTransform(null);
                    expect(json).toEqual({
                        VALUE0: "strValue",
                        VALUE1: true,
                        VALUE2: 100
                    });
                });

                it("does not apply key transforms when set to false", () => {
                    SetSerializeKeyTransform((value) => {
                        return value.toUpperCase();
                    });

                    class Test {
                        @testSerializeAsJson(false)
                        public value0 = { v0: "yes", v1: "no" };
                        @testSerializeAsJson(false)
                        public value1: boolean = true;
                        @testSerializeAsJson(true)
                        public value2: number = 100;
                    }

                    const s = new Test();
                    const json = Serialize(s, () => Test);
                    SetSerializeKeyTransform(null);
                    expect(json).toEqual({
                        VALUE0: { v0: "yes", v1: "no" },
                        VALUE1: true,
                        VALUE2: 100
                    });
                });

            });
        }

        runTests(
            "Normal",
            serializeAs,
            serializeAsJson
        );
        runTests(
            "Auto",
            autoserializeAs,
            autoserializeAsJson
        );
    });

    describe("SerializeUsing", () => {
       it("uses the provided function", () => {
            function x() {
                return "yes";
            }

            class Test {
                @serializeUsing(x)
                public value: number = 1;
                @autoserializeUsing({ Serialize: x, Deserialize: x })
                public value1: number = 1;
            }

            const s = new Test();
            const json = Serialize(s, () => Test);
            expect(json).toEqual({
                value: "yes",
                value1: "yes"
            });
        });
    });

    describe("onSerialized", () => {
        it("invokes the handler if provided", () => {
            class Test {
                public static onSerialized(
                    jsonObject: IJsonObject,
                    instance: Test
                ): void {
                    jsonObject.newValue = "yes";
                    expect(instance instanceof Test).toBeTruthy();
                }

                @serializeAs(() => Number)
                public value: number = 1;

            }

            const s = new Test();
            const json = Serialize(s, () => Test);
            expect(json).toEqual({
                newValue: "yes",
                value: 1
            });
        });

        it("accepts the return value of onSerialized if provided", () => {
            class Test {
                public static onSerialized(jsonObject: IJsonObject, instance: Test) {
                    return { v: "hello" };
                }
                @serializeAs(() => Number)
                public value: number = 1;
            }

            const s = new Test();
            const json = Serialize(s, () => Test);
            expect(json).toEqual({
                v: "hello"
            });
        });
    });

    describe("isReference", () => {
        it("ReferenceCycle = true, is reference = false", () => {
            @isReference(false)
            class Test {
                @serializeAs(() => Test)
                public next: Test | undefined;
            }
            const s = new Test();
            s.next = new Test();
            s.next.next = new Test();
            s.next.next.next = undefined;

            RefCycleDetectionEnable();
            const json = Serialize(s, () => Test);
            RefClean();
            RefCycleDetectionDisable();
            expect(json).toEqual({
                next: {
                    next: {
                        next: undefined
                    }
                }
            });

        });

        it("ReferenceCycle = false, is reference = true", () => {
            @isReference(true)
            class Test {
                @serializeAs(() => Test)
                public next: Test | undefined;
            }
            const s = new Test();
            s.next = new Test();
            s.next.next = new Test();
            s.next.next.next = undefined;

            const json = Serialize(s, () => Test);
            RefClean();
            expect(json).toEqual({
                $id: "1",
                next: {
                    $id: "2",
                    next: {
                        $id: "3",
                        next: undefined
                    }
                }
            });
        });

    });

    describe("ReferenceCycle", () => {
        it("Cycle length 3", () => {
            class Test {
                @serializeAs(() => Test)
                public next: Test | undefined;
            }

            const s = new Test();
            s.next = new Test();
            s.next.next = new Test();
            s.next.next.next = s;
            RefCycleDetectionEnable();
            const json = Serialize(s, () => Test);
            RefClean();
            RefCycleDetectionDisable();
            expect(json).toEqual({
                $id: "1",
                next: {
                    $id: "2",
                    next: {
                        $id: "3",
                        next: {
                            $ref: "1"
                        }
                    }
                }
            });
        });

        it("Cycle length 0", () => {
            class Test {
                @serializeAs(() => Test)
                public next: Test | undefined;
            }

            const s = new Test();
            s.next = s;
            RefCycleDetectionEnable();
            const json = Serialize(s, () => Test);
            RefClean();
            RefCycleDetectionDisable();
            expect(json).toEqual({
                $id: "1",
                next: {
                    $ref: "1"
                }
            });
        });
    });

    describe("Selective serialization", () => {
        it("Bitmask", () => {
            class Test {
                @serializeBitMask(1)
                @serializeAs(() => Number)
                public v1: number = 1;
                @serializeBitMask(3)
                @serializeAs(() => Number)
                public v2: number = 2;
                @serializeAs(() => Number)
                @serializeBitMask(2)
                public v3: number = 3;
            }

            const s = new Test();
            SelectiveSerialization(1);
            const json1 = Serialize(s, () => Test);
            expect(json1).toEqual({
                v1: 1,
                v2: 2
            });
            SelectiveSerialization(2);
            const json2 = Serialize(s, () => Test);
            expect(json2).toEqual({
                v2: 2,
                v3: 3
            });
            SelectiveSerialization(3);
            const json3 = Serialize(s, () => Test);
            expect(json3).toEqual({
                v1: 1,
                v2: 2,
                v3: 3
            });
            SelectiveSerialization();
        });
    });

    describe("RuntimeTyping serialization", () => {

        it("Array 1", () => {
            class Test0 {
                @serializeAs(() => Number)
                public valueA: number = 0;
            }
            @inheritSerialization(() => Test0)
            class Test1 extends Test0 {
                @serializeAs(() => Number)
                public valueB: number = 1;
            }
            @inheritSerialization(() => Test1)
            class Test2 extends Test1 {
                @serializeAs(() => Number)
                public valueC: number = 2;
            }
            @inheritSerialization(() => Test1)
            class Test3 extends Test1 {
                @serializeAs(() => Number)
                public valueD: number = 3;
            }

            const s = Array<Test0>();
            s.push(new Test0(), new Test1(), new Test2(), new Test3());
            RuntimeTypingEnable();
            RuntimeTypingSetTypeString(Test0, "my Test0 type");
            RuntimeTypingSetTypeString(Test1, "my Test1 type");
            RuntimeTypingSetTypeString(Test2, "my Test2 type");
            RuntimeTypingSetTypeString(Test3, "my Test3 type");
            const json = SerializeArray(s, () => Test0);
            RuntimeTypingDisable();
            RuntimeTypingResetDictionary();
            expect(json).toEqual([
                { $type: "my Test0 type", valueA: 0 },
                { $type: "my Test1 type", valueA: 0, valueB: 1 },
                { $type: "my Test2 type", valueA: 0, valueB: 1, valueC: 2 },
                { $type: "my Test3 type", valueA: 0, valueB: 1, valueD: 3 }
            ]);
        });

        it("Array 2", () => {
            class Test {
                @serializeAs(() => Number)
                public value: number = 0;
            }

            class MyArray extends Array {}

            const s = new MyArray();
            s.push(new Test(), new Test(), new Test(), new Test());
            RuntimeTypingEnable();
            RuntimeTypingSetTypeString(Test, "my Test type");
            const json = Serialize(s, itIsAnArray(() => Test));
            RuntimeTypingDisable();
            RuntimeTypingResetDictionary();
            expect(json).toEqual([
                { $type: "my Test type", value: 0 },
                { $type: "my Test type", value: 0 },
                { $type: "my Test type", value: 0 },
                { $type: "my Test type", value: 0 },
            ]);
        });

        it("Object", () => {
            class Test0 {
                @serializeAs(() => Boolean)
                public valueA: boolean = true;
            }
            class Test1 {
                @serializeAs(() => Boolean)
                public valueB: boolean = true;
            }
            @inheritSerialization(() => Test1)
            class Test2 extends Test1 {}
            class Test3 {
                @serializeAs(() => Object)
                public m1!: Test0;
                @serializeAs(() => Test2)
                public m2!: Test1;
            }

            const s = new Test3();
            s.m1 = new Test0();
            s.m2 = new Test2();
            RuntimeTypingEnable();
            RuntimeTypingSetTypeString(Test0, "my Test0 type");
            RuntimeTypingSetTypeString(Test1, "my Test1 type");
            RuntimeTypingSetTypeString(Test2, "my Test2 type");
            RuntimeTypingSetTypeString(Test3, "my Test3 type");
            const json = Serialize(s, () => Test3);
            RuntimeTypingDisable();
            RuntimeTypingResetDictionary();
            expect(json).toEqual({
                $type: "my Test3 type",
                m1: { $type: "my Test0 type", valueA: true },
                m2: { $type: "my Test2 type", valueB: true }
            });
        });
    });

    describe("Accessor", () => {
        it("accessor get & set", () => {
            class Flag {
                public bp: number;
                constructor(n: number) {
                    this.bp = n;
                }
                @serializeAs(() => Number, "bPrime")
                public get b() {
                    return this.bp + 1;
                }
            }

            const d = new Flag(2);
            const json = Serialize(d, () => Flag);
            expect(json).toEqual({ bPrime: 3 });
        });
    });

    describe("Emit Default", () => {
        it("Boolean", () => {
            class Test {
                @serializeAs(() => Boolean)
                @emitDefaultValue(false)
                public valueFalse: boolean = false;

                @emitDefaultValue(false)
                @serializeAs(() => Boolean)
                public valueTrue: boolean = true;
            }

            const t = new Test();
            const json = Serialize(t, () => Test);
            expect(json).toEqual({ valueTrue: true });
        });

        it("Number", () => {
            class Test {
                @emitDefaultValue(false)
                @serializeAs(() => Number)
                public valueDefault: number = 0;

                @emitDefaultValue(false)
                @serializeAs(() => Number)
                public valueNotDefault: number = 1;
            }

            const t = new Test();
            const json = Serialize(t, () => Test);
            expect(json).toEqual({ valueNotDefault: 1 });
        });

        it("Object", () => {
            const elephant = {
                name: "babar"
            };
            const snake = {
                hasTail: true
            };
            class Test {
                @emitDefaultValue(false)
                @autoserializeAs(() => Object)
                @defaultValue(elephant)
                public shouldNotBeSerialized!: Object; // default value

                @emitDefaultValue(false)
                @autoserializeAsJson()
                @defaultValue(elephant)
                public shouldBeSerialized!: Object; // not default value
            }

            const test = new Test();
            test.shouldNotBeSerialized = elephant;
            test.shouldBeSerialized = snake;

            const json = Serialize(test, () => Test);
            expect(json).toEqual({ shouldBeSerialized: { hasTail: true } });
        });
    });

    describe("Default Value", () => {
        it("Boolean", () => {
            class Test {
                @emitDefaultValue(false)
                @serializeAs(() => Boolean)
                public valueDefault: boolean = false;

                @emitDefaultValue(false)
                @serializeAs(() => Boolean)
                @defaultValue(true)
                public valueFalse: Boolean = false;

                @serializeAs(() => Boolean)
                @defaultValue(true)
                @emitDefaultValue(false)
                public valueTrue: boolean = true;
            }

            const t = new Test();
            // tslint:disable-next-line:no-construct
            t.valueFalse = new Boolean(false);
            const json = Serialize(t, () => Test);
            expect(json).toEqual({ valueFalse: false });
        });

        it("Number", () => {
            class Test {
                @emitDefaultValue(false)
                @serializeAs(() => Number)
                public valueDefault: number = 0;

                @emitDefaultValue(false)
                @serializeAs(() => Number)
                @defaultValue(2)
                public valueNotDefault1: number = 1;

                @emitDefaultValue(false)
                @serializeAs(() => Number)
                @defaultValue(2)
                public valueNotDefault2: number = 2;
            }

            const t = new Test();
            const json = Serialize(t, () => Test);
            expect(json).toEqual({ valueNotDefault1: 1 });
        });
    });
});
