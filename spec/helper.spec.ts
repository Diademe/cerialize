import { parseNumber, stringifyNumber } from "../src";

describe("Number", function() {

    describe("parse", function() {
        it("NaN", function() {
            expect(JSON.parse('"NaN"', parseNumber)).toEqual(Number.NaN);
        });

        it("+Infinity", function() {
            expect(JSON.parse('"Infinity"', parseNumber)).toEqual(Number.POSITIVE_INFINITY);
        });

        it("-Infinity", function() {
            expect(JSON.parse('"-Infinity"', parseNumber)).toEqual(Number.NEGATIVE_INFINITY);
        });

        it("other", function() {
            expect(JSON.parse(JSON.stringify({v: 15}), parseNumber)).toEqual({v: 15});
        });
    });

    describe("stringify", function() {
        it("NaN", function() {
            expect(JSON.stringify(Number.NaN, stringifyNumber)).toEqual('"NaN"');
        });

        it("+Infinity", function() {
            expect(JSON.stringify(Number.POSITIVE_INFINITY, stringifyNumber)).toEqual('"Infinity"');
        });

        it("-Infinity", function() {
            expect(JSON.stringify(Number.NEGATIVE_INFINITY, stringifyNumber)).toEqual('"-Infinity"');
        });

        it("other", function() {
            expect(JSON.stringify({v: 15}, stringifyNumber)).toEqual("{\"v\":15}");
        });
    });
});
