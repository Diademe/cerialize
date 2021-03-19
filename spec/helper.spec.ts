import {
    parseNumber,
    stringifyNumber,
} from "../src";

describe("Number", () => {

    describe("parse", () => {
        it("NaN", () => {
            expect(JSON.parse('"NaN"', parseNumber)).toEqual(Number.NaN);
        });

        it("+Infinity", () => {
            expect(JSON.parse('"Infinity"', parseNumber)).toEqual(Number.POSITIVE_INFINITY);
        });

        it("-Infinity", () => {
            expect(JSON.parse('"-Infinity"', parseNumber)).toEqual(Number.NEGATIVE_INFINITY);
        });

        it("other", () => {
            expect(JSON.parse(JSON.stringify({v: 15}), parseNumber)).toEqual({v: 15});
        });
    });

    describe("stringify", () => {
        it("NaN", () => {
            expect(JSON.stringify(Number.NaN, stringifyNumber)).toEqual('"NaN"');
        });

        it("+Infinity", () => {
            expect(JSON.stringify(Number.POSITIVE_INFINITY, stringifyNumber)).toEqual('"Infinity"');
        });

        it("-Infinity", () => {
            expect(JSON.stringify(Number.NEGATIVE_INFINITY, stringifyNumber)).toEqual('"-Infinity"');
        });

        it("other", () => {
            expect(JSON.stringify({v: 15}, stringifyNumber)).toEqual("{\"v\":15}");
        });
    });
});
