/*******************************************************************************
 *
 *   config.js: Global configuration settings for online.interlisp.org web portal
 *
 *
 *   2021-11-16 Frank Halasz
 *
 *
 *   Copyright: 2021-2022 by Interlisp.org
 *
 *
 *******************************************************************************/

var path = require('path');
var fs = require('fs');
var keys = require('./keys');

var isDev = (process.env.DEV_OR_PROD && (process.env.DEV_OR_PROD.toLowerCase() == "dev"));
exports.isDev = isDev;

var supportHttps = fs.existsSync("/etc/letsencrypt/live");
exports.supportHttps = supportHttps;

var httpPort = 80;
exports.httpPort = httpPort;

var httpsPort = 443;
exports.httpsPort = httpsPort;

// Acct for the fact that Docker maps
// 8080 -> 80
// 8081 -> 443
// in the dev case
var httpsRedirectPort = isDev ? 8081 : 443;
exports.httpsRedirectPort = httpsRedirectPort;

var userdbName = `oio_users`;
exports.userdbName = userdbName;

var dockerPortMin = isDev ? 4999 : 2999;
exports.dockerPortMin = dockerPortMin;
var dockerPortMax = dockerPortMin + 2000;
exports.dockerPortMax = dockerPortMax;

var dockerRegistry = process.env.DOCKER_REGISTRY || "ghcr.io";
exports.dockerRegistry=dockerRegistry;
var dockerNamespace = process.env.DOCKER_NAMESPACE || "interlisp";
exports.dockerNamespace = dockerNamespace;
var dockerImage = `${dockerRegistry}/${dockerNamespace}/online-darkstar:development`;
exports.dockerImage = dockerImage;

var medleyInstallDir = "/usr/local/interlisp/medley";
exports.medleyInstallDir = medleyInstallDir;
var medleyUserDir = "/home/medley";
exports.medleyUserDir = medleyUserDir;
var dockerScriptsDir = path.join("home/darkstar/scripts");
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

var clientDirRelativeTo_dirname = '../../client';

var noVncDir = path.join(__dirname, clientDirRelativeTo_dirname, 'novnc');
exports.noVncDir = noVncDir;
var noVncHomePage = path.join(noVncDir, 'vnc.html');
exports.noVncHomePage = noVncHomePage;

var runAsUsername = 'oio';
exports.runAsUsername = runAsUsername;
var runAsGroupname = 'oio';
exports.runAsGroupname = runAsGroupname;

var logPath = path.join('/srv/oio/log', 'oio.log');
exports.logPath = logPath;

var viewsPath = path.join(__dirname, clientDirRelativeTo_dirname, 'views');
exports.viewsPath = viewsPath;

var stylesheetsPath = path.join(__dirname, clientDirRelativeTo_dirname, 'stylesheets');
exports.stylesheetsPath = stylesheetsPath;

var polyfillsPath = path.join(__dirname, clientDirRelativeTo_dirname, 'polyfills');
exports.polyfillsPath = polyfillsPath;

var clientJsPath = path.join(__dirname, clientDirRelativeTo_dirname, 'js');
exports.clientJsPath = clientJsPath;

var sessionSecret = keys.sessionSecret;
exports.sessionSecret = sessionSecret;

var gmailPassword = keys.gmailPassword;
exports.gmailPassword = gmailPassword;

var gmailUsername = "fghalasz@interlisp.org";
exports.gmailUsername = gmailUsername;

var gmailFrom = "Interlisp Online <registration@interlisp.org>";
exports.gmailFrom = gmailFrom;

var imagesDir = path.join(__dirname, clientDirRelativeTo_dirname, 'images');
exports.imagesDir = imagesDir;

var noDockerRm = isDev && fs.existsSync("/srv/oio/noDockerRm");
exports.noDockerRm = noDockerRm;

var mongodbURI = `mongodb://%2Fsrv%2Foio-nomount%2Fmongodb%2Fmongodb-27017.sock/${userdbName}`;
exports.mongodbURI = mongodbURI;

var guestUsername = "guest@online.interlisp.org";
exports.guestUsername = guestUsername;

var guestPassword = keys.guestPassword;
exports.guestPassword = guestPassword;

var isGuestUser = function isGuestUser(username) { return (guestUsername == username); };
exports.isGuestUser = isGuestUser;

const badchars = new RegExp("[!#$%&'*+/=?^`{|}~]", "g");
var emailish =
    function(email) {
        if(isGuestUser(email))
            return `guest-${Math.floor(Math.random() * 99999)}`;
        else
            return email.replace(badchars, '-').replace("@", ".-.");
    };
exports.emailish = emailish;

var homeVolume = function(email) { return `${emailish(email)}_home.v2`; };
exports.homeVolume = homeVolume;

var isNCO = function(req) {
    return (req.hostname.toLowerCase().replace(/^www\./,"") == "notecards.online");
};
exports.isNCO = isNCO;

var medleyMemoryArg = "64";
exports.medleyMemoryArg = medleyMemoryArg;

var medleyNetworkHostMode = false;
exports.medleyNetworkHostMode = medleyNetworkHostMode;

var staticHostingPath = "/srv/static";
exports.staticHostingPath = staticHostingPath;

var idleTimeoutSecs = 7200;
var idleTimeoutSecsGuest = 3600;
exports.idleTimeoutSecs = idleTimeoutSecs;
exports.idleTimeoutSecsGuest = idleTimeoutSecsGuest;
