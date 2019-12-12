const axios = require("axios");
const querystring = require("querystring");

class PeltarionApi {
    constructor(config) {
        this._endpoint = config.endpoint;
        this._token = config.token;
    }

    async classifyText(text) {
        const response = await axios.post(
          this._endpoint,
          querystring.encode({sentence: text}),
          {
              headers: {
                  "Authorization": `Bearer ${this._token}`,
                  "User-Agent": "PeltarionPublicDemo/AuthorStyle"
              }
          });
        return response.data;
    }
}

module.exports = PeltarionApi;