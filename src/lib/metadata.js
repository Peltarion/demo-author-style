const axios = require("axios");
const { parse } = require("node-html-parser");

function findNodesWithAttributeValue(root, selector, attribute, value) {
    const nodes = root.querySelectorAll(selector);
    const result = [];
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.attributes[attribute] === value) {
            result.push(n);
        }
    }
    return result;
}

class OGMetadataApi {
    async fetchMetadata(url) {
        const response = await axios.get(url);

        if (response.data) {
            const json = {
                "image": null,
                "title": null,
                "url": url
            };
            const root = parse(response.data);
            const ogImageNodes = findNodesWithAttributeValue(root, "head meta", "property", "og:image");
            json.title = root.querySelector("head title").text;
            if (ogImageNodes.length > 0) {
                json.image = ogImageNodes[0].attributes.content;
            }
            return json;
        }
    }
}

module.exports = OGMetadataApi;