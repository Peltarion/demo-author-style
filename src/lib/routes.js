const express = require("express");
const router = express.Router();
const authors = require("./content");

module.exports = (platformApi, metadataApi) => {

    router.post("/classify", async (req, res) => {
        try {
            const result = await platformApi.classifyText(req.body.text);
            return res.json(result);
        } catch (e) {
            if (e.response) {
                res.sendStatus(e.response.status);
                return;
            }
            console.error(e);
            res.sendStatus(500);
        }
    });

    router.get("/metadata", async (req, res) => {
        const author = req.query.author;
        const authorData = authors[author];
        if (!authorData) {
            res.sendStatus(404);
            return;
        }
        try {
            let result = await metadataApi.fetchMetadata(authorData.url);
            res.json({
                url: authorData.url,
                title: result.title,
                image: result.image,
                source: authorData.source
            });
        } catch (e) {
            if (e.response) {
                res.sendStatus(e.response.status);
                return;
            }
            console.error(e);
            res.sendStatus(500);
        }
    });

    return router;
};