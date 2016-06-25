var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);

var environment = process.env.NODE_ENV;

var oodi = require('./routes/oodi');
var parse = require('./routes/parse');
var aamudata_api = require('./routes/aamudata')

var app = express();

//Build aamu-data bundle
const webpack = require('webpack');

if(environment == 'production') {
  webpack({
    entry: './aamu-data/index.js',
    output: {
      filename: 'bundle.js',
      path: 'public/build'
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel',
          query: {
            presets: ['es2015', 'react', 'stage-0'],
            plugins: ['syntax-async-functions', 'transform-regenerator']
          }
        }
      ]
    }
  }).run((err, stats) => {
    console.log(err, stats)
  });
} else {
  webpack({
    entry: './aamu-data/index.js',
    output: {
      filename: 'bundle.js',
      path: 'public/build'
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel',
          query: {
            presets: ['es2015', 'react']
          }
        }
      ]
    }
  }).watch({
    aggregateTimeout: 300,
    poll: true
  },(err, stats) => {
    console.log(err, stats)
  });
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  name: 'ooditool-session',
  secret: process.env.EXPRESS_SESSION_SECRET || '123456asdfasdfasdf',
  saveUninitialized: true,
  resave: true,
  store: new FileStore(),
  cookie: { secure: environment == 'production' },
  unset: 'destroy'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/oodi', oodi);
app.use('/parse', parse)
app.use('/aamudata', aamudata_api)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
