/*******************************************************************************
 *
 *   medley.js:  Router to handle starting up Interlisp (and xterm) on the
 *               online.interlis.org web portal.  Mainly used to call
 *               docker to startup medley docker containers as needed.
 *
 *
 *   2021-11-22 Frank Halasz
 *
 *
 *   Copyright: 2021-2022 by Interlisp.org
 *
 *
 ******************************************************************************/

const config = require("./config");
const express = require("express");
const docker = require('./docker');
const url = require("url");

//
//  The router
//
const medleyRouter = express.Router();

//
//
//  The actual routes
//
//

// Route to check for existing containers
medleyRouter.get("/checksession", setEmailish, checkForRunningContainer, getSessionTarget, returnCheckSession);

// route to start interlisp
medleyRouter.get("/interlisp", setEmailish, setupTarget.bind(null, "Interlisp", interlispRunCmd), checkForRunningContainer, killIfNeeded, startIfNeeded, goToVnc);

// route to start xterm
medleyRouter.get("/xterm", setEmailish, filterGuest, setupTarget.bind(null, "xterm", xtermRunCmd), checkForRunningContainer, killIfNeeded, startIfNeeded, goToVnc);

//
//  Route to reset home volume to "factory settings"
//
medleyRouter.get('/reset', setEmailish, resetHomeVolume);

//
//
//  Variables and functions to construct docker run commands
//
//

var port = config.dockerPortMin;

const dockerTlsMounts = ( ! config.supportHttps ? "" :
        ` --mount type=bind,src=${config.tlsCertDir},dst=${config.tlsCertDir},readonly`
        + ` --mount type=bind,src=${config.tlsArchiveCertDir},dst=${config.tlsArchiveCertDir},readonly`);

const dockerTlsEnv = ( ! config.supportHttps ? "" :
        ` --env TLS_KEYFILE=${config.tlsKeyPath}`
        + ` --env TLS_CERTFILE=${config.tlsCertPath}`);

const dockerSupportHttpsEnv = ` --env SUPPORT_HTTPS=${config.supportHttps ? "yes" : "no"}`;

function sftpEnvs(req) {
    return ` --env SFTP_PWD=${req.sftpPwd}` + ` --env SFTP_SERVER=${req.query.sftp || "false"}`;
}

function medleyEnvs(req) {
    const u = req.user;
    const nc = (req.query.notecards && (req.query.notecards.toLowerCase() == "true")) ? "true" : "false";
    const rooms = (req.query.rooms && (req.query.rooms.toLowerCase() == "true")) ? "true" : "false";
    const exec = (req.query.exec && (req.query.exec.toLowerCase() == "common")) ? "common" : "inter";
    var start = false;
    try {
         if ((req.query.start != undefined) && (req.query.start != ""))
             start = decodeURIcomponent(req.query.start);
        }
    catch(e) { start = false; }
    return    ` --env MEDLEY_EMAIL='${u.username}'`
            + ` --env MEDLEY_UNAME='${u.uname || "medley" }'`
            + ` --env MEDLEY_FIRSTNAME='${u.firstname || "Medley"}'`
            + ` --env MEDLEY_LASTNAME='${u.lastname || "User"}'`
            + ` --env MEDLEY_INITIALS='${u.initials || "medley"}'`
            + ` --env RUN_NOTECARDS=${nc}`
            + ` --env RUN_ROOMS=${rooms}`
            + ` --env MEDLEY_EXEC=${exec}`
            + ` --env MEDLEY_MEMORY=${config.medleyMemoryArg}`
            + start ? ` --env START_SCRIPT_URL='${start}` : ""
    ;
}

function networkParams(port) {
    var params;
    if (config.medleyNetworkHostMode === true)
        params =` --network host`;
    else
        params =
            ` --network bridge`
            + ` -p ${port}:${port}`
            + ` -p 1${port}:1${port}`
            + ` -p 2${port}:2${port}`
            + ` -p 3${port}:3${port}`
            ;
    return params;
}

function interlispRunCmd(req) {
    const emailish = req.emailish;
    const port = req.oioPort;
    const resume = req.query.resume && ((req.query.resume == "1") || (req.query.resume.toLowerCase() == "true"));
    const custom = (req.query.custom && (req.query.custom.toLowerCase() == "true"));
    const customInit = (req.query.custom_init && (req.query.custom_init.toLowerCase() == "true"));
    const screen_width = req.query.screen_width || 1024;
    const screen_height = req.query.screen_height || 808;
    const isGuest = config.isGuestUser(req.user.username);
    const cmd =
            `run -d ${config.noDockerRm ? "" : "--rm"}`
            + networkParams(port)
            + (config.noDockerRm ? ` --name ${emailish}-${Math.floor(Math.random() * 9999)}` : ` --name ${emailish}`)
            + (isGuest ? "" : ` --mount type=volume,source=${config.homeVolume(req.user.username)},target=/home/medley`)
            + dockerTlsMounts
            + ` --env PORT=${port}`
            + ` --env NCO=${config.isNCO(req) ? "true" : "false"}`
            + ` --env OIO_FB_URL=${url.format({protocol: req.protocol, host: req.hostname})}`
            + medleyEnvs(req)
            + ` --env IDLE_SECS=${isGuest ? config.idleTimeoutSecsGuest : config.idleTimeoutSecs}`
            + sftpEnvs(req)
            + ` --label "OIO_PORT=${port}"`
            + ` --label "OIO_TARGET=${req.oioTarget}"`
            + ` --label "OIO_SFTP=${req.sftpPwd}"`
            + dockerSupportHttpsEnv
            + dockerTlsEnv
            + ` --entrypoint ${config.dockerScriptsDir}/run-online-medley`
            + ` ${config.dockerImage}`
            + (resume ? ` vmem` : (custom ? ` custom` : ` sysout`))
            + (customInit ? ` custom` : ` release`)
            + ` ${screen_width} ${screen_height}`
            ;
    return cmd;
}

function xtermRunCmd(req) {
    const emailish = req.emailish;
    const port = req.oioPort;
    const isGuest = config.isGuestUser(req.user.username);
    const cmd =
        `run -d ${config.noDockerRm ? "" : "--rm"}`
        + networkParams(port)
        + ` --name ${emailish}${config.isDev ? `-${Math.floor(Math.random() * 99999)}` : ``}`
        + ` --mount type=volume,source=${emailish}_home.v2,target=/home/medley`
        + dockerTlsMounts
        + ` --env PORT=${port}`
        + ` --env NCO=${config.isNCO(req) ? "true" : "false"}`
        + medleyEnvs(req)
        + ` --env IDLE_SECS=${isGuest ? config.idleTimeoutSecsGuest : config.idleTimeoutSecs}`
        + sftpEnvs(req)
        + ` --label "OIO_PORT=${port}"`
        + ` --label "OIO_TARGET=${req.oioTarget}"`
        + ` --label "OIO_SFTP=${req.sftpPwd}"`
        + dockerSupportHttpsEnv
        + dockerTlsEnv
        + ` --entrypoint ${config.dockerScriptsDir}/run-xterm`
        + ` ${config.dockerImage}`
        + ` 1024 808`
        ;
    return cmd;
}


//
//  Middleware to perform various docker operations used by routes
//

function checkForRunningContainer(req, res, next) {
    const emailish = req.emailish;
    docker.command(`ps -aqf "name=^${emailish}$"`)
        .then(data => {
            req.isRunning = data.raw ? true : false;
            //console.log(req.isRunning);
            next();
            })
        .catch(err => {
            console.log(err); res.status(500).send(err);
        });
}

function getSessionTarget(req, res, next) {
    if(req.isRunning) {
        docker
            .command(`inspect --format '{{ printf "%q" .Config.Labels.OIO_TARGET }}' ${req.emailish}`)
            .then(data => { req.oioExistingTarget = data.object; next(); })
            .catch(err => { res.status(500).send("Error fetching Config.Labels.OIO_TARGET from docker container:  " + err); } );
    } else {
        req.isRunning = null;
        req.oioExistingTarget = null;
        next();
     }
}

function killIfNeeded(req, res, next) {
    if(req.isRunning && (req.ifRunningDo == "kill")) {
        docker
            .command(`container kill ${req.emailish}`)
            .then(data => { req.isRunning = false; next(); })
            .catch(err => { console.log(err); res.status(500).send(err); } );
    }
    else {
        next();
    }
}

function startIfNeeded(req, res, next) {
    if(! req.isRunning) {
        port = port + 1;
        if (port > config.dockerPortMax) port = config.dockerPortMin;
        req.oioPort = port;
        req.sftpPwd = randomString(8);
        const runCmd = req.oioRunCmd(req);
        if(config.isDev) console.log(runCmd);
	    docker
            .command(runCmd)
            .then(data => { req.oioPort = port; next(); })
            .catch(err => { console.log(err); res.status(500).send(err.stderr); });
    } else {
        docker
            .command(`inspect --format "{{ json .Config.Labels }}" ${req.emailish}`)
            .then(data => {
                req.oioPort = data.object.OIO_PORT;
                req.sftpPwd = data.object.OIO_SFTP;
                next();
            })
            .catch(err => { console.log(err); res.status(500).send(err); } );
    }
}

function resetHomeVolume(req, res) {
    const emailish = req.emailish;
    const run_cmd = `volume rm ${config.homeVolume(req.user.username)}`;
    if(config.isDev) console.log(run_cmd);
    docker
        .command(`container ${config.isDev ? `ls` : `kill ${emailish}`}`)
        .catch((err)=>{ if(config.isDev) { console.log("Expected error after container kill: " + err); } } )
        .finally(() => {
            docker
                .command(run_cmd)
                .then(data => { res.status(200).end(); })
                .catch(err => { console.log(err); res.status(500); res.send(err.stderr); });
            }
        );
}


//
//  Other (non-docker) middleware used by routes
//

function setEmailish(req, res, next) {
    req.emailish = config.emailish(req.user.username);
    next();
}

function returnCheckSession(req, res, next) {
    res.json({isRunning: req.isRunning, target: req.oioExistingTarget});
}

function filterGuest(req, res,next) {
    if(config.isGuestUser(req.user.username)) {
        res.status(403);
        res.send("xterm not allowed for guest");
    }
    else next();
}

function setupTarget(target, runCmd, req, res, next) {
    req.oioTarget = target;
    req.oioRunCmd = runCmd;
    req.ifRunningDo = req.query.if || null;
    next();
}

function goToVnc(req, res, next) {
    var url = `/client/go?target=${req.oioTarget}&port=${req.oioPort}&autoconnect=1&view_only=0`;
    url = `${url}${config.supportHttps ? "&encrypt=1" : ""}&u=${req.user.uname}&p=${req.sftpPwd}`;
    if(config.isNCO(req)) url = `${url}&nco=1`;
    if(req.query.autologin != undefined) url = `${url}&autologin=1`;
    res.redirect(url);
}

//
//  Utilities
//
function randomString(len) {
    var p = "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    return [...Array(len)].reduce(a=>a+p[~~(Math.random()*p.length)],'');
}

//
// Exports
//
module.exports = medleyRouter;
