const assert = require("assert");
const { parse } = require("node-html-parser");
const fs = require("fs");

const htmlWithMetadata = fs.readFileSync("./test/files/page-with-metadata.html", 'utf8');

describe("hashing", function() {
    describe("#getHash()", function () {
        it("should parse an image from meta[property=og:image]", function () {
            const root = parse(htmlWithMetadata);

        });
    });
});