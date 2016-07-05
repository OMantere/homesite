/**
 * Created by oskari on 25.4.2016.
 */
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require('parse-dashboard');
var environment = process.env.NODE_ENV;
var express = require('express');
var router = express.Router();

var pDashboard = new ParseDashboard({
  apps: [
    {
      serverURL: environment == 'production' ? "https://localhost:443/parse/api" : "http://localhost:3000/parse/api",
      appId: "yliappilas",
      appName: "YliAppilas"
    }
  ],
  users: {
    user: 'master',
    pass: process.env.PARSE_DASHBOARD_PASS || 'testipassu'
  }
});

var api = new ParseServer({
    databaseURI: 'mongodb://localhost:27017/data', // Connection string for your MongoDB database
    cloud: './parse/cloudcode.js', // Path to your Cloud Code
    appId: 'yliappilas',
    masterKey: process.env.PARSE_MASTER_KEY || 'villevanhavekkuli', // Keep this key secret!
    clientKey: process.env.PARSE_CLIENT_KEY || 'haloohalooonkosiellävaloo',
    restAPIKey: 'dfsf',
    enableAnonymousUsers: false,
    serverURL: environment == 'production' ? 'https://localhost:443/parse/api' : 'http://localhost:3000/parse/api'
});

router.use('/api', api)
router.use('/dashboard', pDashboard)

module.exports = router;
