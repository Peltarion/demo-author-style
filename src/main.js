const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const PeltarionApi = require("./lib/peltarion");
const MetadataApi = require("./lib/metadata");
const create_router = require("./lib/routes");

function getConfigFile() {
    if (process.env.SERVER_CONFIG) {
        return process.env.SERVER_CONFIG;
    } else if (process.argv.length >= 3) {
        return process.argv[2];
    }
    return null;
}

function readConfig(configFile) {
    return Object.freeze(JSON.parse(fs.readFileSync(configFile)));
}

function getPort() {
    return parseInt(process.env.SERVER_PORT || "3000");
}

let configFile = getConfigFile();
if (!configFile) {
    console.error(`Usage: ${process.argv[0]} config`);
    process.exit(1);
}

const port = getPort();
console.log(`Using config file ${configFile}`);
const config = readConfig(configFile);

const routes = create_router(new PeltarionApi(config.platformApi), new MetadataApi());
app.use(bodyParser.json());
app.use("/", express.static(config.staticFilesPath));
app.use("/api", routes);
app.use("/result/:author", express.static(config.staticFilesPath + "/index.html")); // for deep linking spa style

app.listen(port, () => console.log(`Server listening on port ${port}!`));