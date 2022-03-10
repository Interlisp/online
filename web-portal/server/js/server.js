#!/usr/bin/env node
/*******************************************************************************
 * 
 *   server.js:  Start up http(s) server(s) for online.interlisp.org web portal. 
 *               This is the module that starts up the whole portal by loading
 *               the express app (app.js) and initiating the server listens.
 *               Called by something like "node ./server.js".
 * 
 *   2021-11-18 Frank Halasz
 * 
 * 
 *   Copyright: 2021-2022 by Interlisp.org 
 * 
 *
 ******************************************************************************/
var config = require('./config');
var app = require('./app');
//var debug = require('debug')(config.isDev ? 'oio-dev:server' : 'oio:server');
if (config.supportHttps) var https = require('https');
var http = require('http');
var fs = require('fs');

/**
 * Get port from environment and store in Express.
 */

var httpPort = normalizePort(process.env.HTTP_PORT || config.httpPort || '80');
app.set('http_port', httpPort);
app.set('port', httpPort);
if(config.supportHttps) {
  var httpsPort = normalizePort(process.env.HTTPS_PORT || config.httpsPort || '443');
  app.set('https_port', httpsPort);
  app.set('port', httpsPort);
}

/**
 * Create HTTP & HTTPS server.
 */
 
if(config.supportHttps) {
  var sslOpts = 
    {
      key: fs.readFileSync(config.tlsKeyPath),
      cert: fs.readFileSync(config.tlsCertPath),
      ca: fs.readFileSync(config.tlsChainPath)
    };
  var httpsServer = https.createServer(sslOpts, app);
  var httpsPromise = new Promise((resolve, reject) => { 
    httpsServer.listen(httpsPort);
    httpsServer.on('error', onError.bind(null, 'https'));
    httpsServer.on('listening', onListening.bind(null, 'https', resolve));
  });
}

var httpServer = http.createServer(app);
var httpPromise = new Promise((resolve, reject) => {
  httpServer.listen(httpPort);
  httpServer.on('error', onError.bind(null, 'http'));
  httpServer.on('listening', onListening.bind(null, 'http', resolve));
});

/* Set uid and gid to ubuntu:ubuntu */
(async function(promiseArray) {
  await Promise.all(promiseArray);
  process.setgid(config.runAsGroupname);
  process.setgroups(['docker']);
  process.setuid(config.runAsUsername);
  process.env.HOME = `/home/${config.runAsUsername}`;
})([httpPromise, (config.supportHttps ? httpsPromise : Promise.resolve(true))]);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(serverType, error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind;
  if(serverType === 'http') {
    bind = typeof port === 'string'
      ? 'Http Pipe ' + httpPort
      : 'Http Port ' + httpPort;
  } else {
    bind = typeof port === 'string'
      ? 'Https Pipe ' + httpsPort
      : 'Https Port ' + httpsPort;
  }

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(serverType, resolve) {
  var addr = (serverType === 'http') ? httpServer.address() : httpsServer.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : `${serverType} port ${addr.port}`;
  console.log('Listening on ' + bind);
  resolve(bind);
}


