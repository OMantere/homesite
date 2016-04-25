/**
 * Created by oskari on 25.4.2016.
 */
var ParseServer = require('parse-server').ParseServer;

var environment = process.env.NODE_ENV;

var api = new ParseServer({
    databaseURI: 'mongodb://localhost:27017/data', // Connection string for your MongoDB database
    cloud: './parse/cloudcode.js', // Path to your Cloud Code
    appId: 'yliappilas',
    masterKey: process.env.PARSE_MASTER_KEY, // Keep this key secret!
    serverURL: environment == 'production' ? 'https://localhost:443/parse' : 'http://localhost:3000/parse'
});

module.exports = api