//
//  config.js:  global configuration settings for online.interlisp.org web portal
//
//  2021-11-16 Frank Halasz
//

var path = require('path');

var isDev = (process.env.DEV_OR_PROD && (process.env.DEV_OR_PROD.toLowerCase() == "dev"));
exports.isDev = isDev;

var httpPort =  isDev ? 8080 : 80;
exports.httpPort = httpPort;

var httpsPort =  isDev ? 8081 : 443;
exports.httpsPort = httpsPort;

var httpBaseUrl = `http://online.interlisp.org${isDev ? ":" + httpPort : ""}`;
var httpsBaseUrl = `https://online.interlisp.org${isDev ? ":" + httpsPort : ""}`;
exports.httpBaseUrl = httpBaseUrl;
exports.httpsBaseUrl = httpsBaseUrl;


var userdbName = `oio_users${isDev ? "-dev" : ""}`;
exports.userdbName = userdbName;

var dockerPortMin = isDev ? 4999 : 2999;
exports.dockerPortMin = dockerPortMin;
var dockerPortMax = dockerPortMin + 2000;
exports.dockerPortMax = dockerPortMax;

var dockerImage = isDev ? 'oio-dev' : 'oio-prod';
exports.dockerImage = dockerImage;

var dockerScriptsDir = "/app/medley/online/bin";
exports.dockerScriptsDir = dockerScriptsDir;

var tlsCertDir = "/etc/letsencrypt/live/online.interlisp.org/";
exports.tlsCertDir = tlsCertDir;
var tlsArchiveCertDir = "/etc/letsencrypt/archive/online.interlisp.org/";
exports.tlsArchiveCertDir = tlsArchiveCertDir;
var tlsKeyFilename = "privkey.pem";
var tlsCertFilename = "cert.pem";
var tlsChainFilename =  "chain.pem";
var tlsFullChainFilename =  "fullchain.pem";
var tlsKeyPath = path.join(tlsCertDir,  tlsKeyFilename);
exports.tlsKeyPath =  tlsKeyPath;
var tlsCertPath  = path.join(tlsCertDir, tlsCertFilename);
exports.tlsCertPath = tlsCertPath;
var tlsChainPath =  path.join(tlsCertDir, tlsChainFilename);
exports.tlsChainPath = tlsChainPath;
var tlsFullChainPath =  path.join(tlsCertDir, tlsFullChainFilename);
exports.tlsFullChainPath = tlsFullChainPath;

var noVncDir = path.join(__dirname, '..', 'novnc');
exports.noVncDir = noVncDir;
var noVncHomePage = path.join(noVncDir, 'vnc.html');
exports.noVncHomePage = noVncHomePage;

var runAsUsername = 'ubuntu';
exports.runAsUsername = runAsUsername;
var runAsGroupname = 'ubuntu';
exports.runAsGroupname = runAsGroupname;

var logPath = path.join(__dirname, '..', isDev ? 'dev.log' : 'production.log');
exports.logPath = logPath;

var viewsPath = path.join(__dirname, '..', 'views');
exports.viewsPath = viewsPath;

var stylesheetsPath = path.join(__dirname, '..', 'stylesheets');
exports.stylesheetsPath = stylesheetsPath;

var sessionSecret = require('./keys').sessionSecret;
exports.sessionSecret = sessionSecret;

var imagesDir = path.join(__dirname, '..', 'images');
exports.imagesDir = imagesDir;
