const config = require("./config");
const express = require("express");
const passport = require('passport');
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const validateEmail = require('email-addresses').parseOneAddress;
const docker = require('./docker');

//
// Router for noVNC
//
const clientRouter = express.Router();
clientRouter.get('/go', (req, res, next) => { res.sendFile(config.noVncHomePage); });
clientRouter.use(express.static(config.noVncDir));


//
// Router for user registration and login
//

// set up mongoose amd passport-local-mongoose for user database access
mongoose.connect(`mongodb://localhost/${config.userdbName}`,
  { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);
const userModel = mongoose.model('userInfo', userSchema, 'userInfo');
passport.use(userModel.createStrategy());
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());


const userRouter = express.Router();
userRouter.post('/login', 
            (req, res, next) => {
                  passport.authenticate('local',
                  (err, user, info) => {
                    if (err) {
                      return next(err);
                    }
                
                    if (!user) {
                      console.dir(info);
                      return res.redirect('/user/login?info=' + info);
                    }
                
                    req.logIn(user, function(err) {
                      if (err) {
                        return next(err);
                      }
                
                      return res.redirect('/');
                    });
                
                  })(req, res, next);
            }
);

userRouter.get('/login',
  (req, res) => { res.render('login'); }
);

userRouter.post('/logout',
  (req, res) => { 
        req.logout();
        res.redirect('/user/login');
        }
);

userRouter.get('/register',
  (req, res) => { res.render('register'); }
);


userRouter.post('/register',
    (req, res, next) => {
        const addrObj = validateEmail(req.body.username);
        if(!addrObj || (addrObj.name != null) || req.body.username.trim().match(/^<.*>$/))
            return res.redirect('/user/register?info=' + encodeURIComponent("Incorrectly formatted email address"));
        else
            next();
    },
    (req, res, next) => {
        userModel.register(
            {username: req.body.username, active: false}, 
            req.body.password,
            (err, thisModel, passwordErr) => {
                if(!err) 
                    return res.redirect('/user/login?info=' + encodeURIComponent('Registration successful. Please login.'));
                else {
                    return res.redirect('/user/register?info=' + err);
                }
            }
        );        
    }    
);



//
//  Routes to handle starting on Interlisp via docker
//
const medleyRouter = express.Router();
const badchars = new RegExp("[!#$%&'*+/=?^`{|}~]", "g");
const dockerTlsMounts =
        ` --mount type=bind,src=${config.tlsCertDir},dst=${config.tlsCertDir},readonly`
        + ` --mount type=bind,src=${config.tlsArchiveCertDir},dst=${config.tlsArchiveCertDir},readonly`;
const dockerTlsEnv =
        ` --env TLS_KEYFILE=${config.tlsKeyPath}`
        + ` --env TLS_CERTFILE=${config.tlsCertPath}`;
var port = config.dockerPortMin;

// Check for existing containers
medleyRouter.get("/checksession", checkForRunningContainer, getSessionTarget, returnCheckSession);

function checkForRunningContainer(req, res, next) {
    const emailish = req.user.username.replace(badchars, '-').replace("@", ".-.");
    docker.command(`ps -aqf "name=^${emailish}$"`)
        .then(data => {
            req.emailish = emailish;
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

function returnCheckSession(req, res, next) {
    res.json({isRunning: req.isRunning, target: req.oioExistingTarget});
}


// start interlisp
medleyRouter.get("/interlisp", setupTarget.bind(null, "Interlisp", interlispRunCmd), checkForRunningContainer, killIfNeeded, startIfNeeded, goToVnc);

// start xterm andsftp server
medleyRouter.get("/xterm", setupTarget.bind(null, "xterm", xtermRunCmd), checkForRunningContainer, killIfNeeded, startIfNeeded, goToVnc);


//${config.isDev ? `-${Math.floor(Math.random() * 99999)}` : ``}
function interlispRunCmd(req) {
    const emailish = req.emailish;
    const port = req.oioPort;
    const resume = req.query.resume && ((req.query.resume == "1") || (req.query.resume.toLowerCase() == "true"));
    const screen_width = req.query.screen_width || 1024;
    const screen_height = req.query.screen_height || 808;
    const cmd =
            `run -d ${config.noDockerRm ? "" : "--rm"}`
            + ` --network host`
            + ` --name ${emailish}`
            + ` --mount type=volume,source=${emailish}_home,target=/home/medley`
            + ` --mount type=volume,source=${emailish}_il,target=/home/medley/il`
            + dockerTlsMounts
            + ` --env PORT=${port}`
            + ` --label "OIO_PORT=${port}"`
            + ` --label "OIO_TARGET=${req.oioTarget}"`
            + dockerTlsEnv
            + ` --entrypoint ${config.dockerScriptsDir}/run-online-medley`
            + ` ${config.dockerImage}`
            + (resume ? ` vmem` : ` sysout`)
            + ` ${screen_width} ${screen_height}`
            ;
    return cmd;
}

function xtermRunCmd(req) {
    const emailish = req.emailish;
    const port = req.oioPort;
    const cmd =
        `run -d ${config.noDockerRm ? "" : "--rm"}`
        + ` --network host`
        + ` --name ${emailish}${config.isDev ? `-${Math.floor(Math.random() * 99999)}` : ``}`
        + ` --mount type=volume,source=${emailish}_home,target=/home/medley`
        + ` --mount type=volume,source=${emailish}_il,target=/home/medley/il`
        + dockerTlsMounts
        + ` --env PORT=${port}`
        + ` --label "OIO_PORT=${port}"`
        + ` --label "OIO_TARGET=${req.oioTarget}"`
        + dockerTlsEnv
        + ` --entrypoint ${config.dockerScriptsDir}/run-xterm`
        + ` ${config.dockerImage}`
        + ` 1024 808`
        ;
    return cmd;
}

function setupTarget(target, runCmd, req, res, next) {
    req.oioTarget = target;
    req.oioRunCmd = runCmd;
    req.ifRunningDo = req.query.if || null;
    next();
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
        const runCmd = req.oioRunCmd(req);
        if(config.isDev) console.log(runCmd);
	    docker
            .command(runCmd)
            .then(data => { req.oioPort = port; next(); })
            .catch(err => { console.log(err); res.status(500).send(err.stderr); });
    } else {
        docker
            .command(`inspect --format "{{ .Config.Labels.OIO_PORT }}" ${req.emailish}`)
            .then(data => {
                req.oioPort = data.object;
                next();
                })
            .catch(err => { console.log(err); res.status(500).send(err); } );
    }
}

function goToVnc(req, res, next) {
    res.redirect(`${config.httpsBaseUrl}/client/go?target=${req.oioTarget}&port=${req.oioPort}&autoconnect=1&encrypt=1`);
}


medleyRouter.get(
    '/reset',
    (req, res) => {
        const emailish = req.user.username.replace(badchars, '-').replace("@", ".-.");
        const vol= req.query.vol;
        if((vol != "il") && (vol != "home")) {
            res.status(400);
            res.send('Error: vol query string parameter is neither "il" nor "home"');
        } else {
            const run_cmd = `volume rm ${emailish}_${vol}`;
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
    }
);

//
// Router for various admin tasks
//
const adminRouter = express.Router();

function isAdmin(req, res, next) {
    console.dir(req.user.username);
    if(req.user.username === "frank@halasz.org") return next();
    else return res.redirect("/");
}

adminRouter.get('/reset_pwd', isAdmin, (req, res) => res.render('reset_pwd'));

adminRouter.post('/reset_pwd',
    isAdmin,
    async (req, res, next) => {
        try {
            const user = await userModel.findByUsername(req.body.username);
            if (!user)
                return res.redirect('/admin/reset_pwd?info=' + encodeURIComponent(`Error: User ${req.body.username} not found`));
            else {
                await user.setPassword(req.body.password);
                await user.save();
                return res.redirect('/admin/reset_pwd?info=' + "Success");
            }
        } catch(err) {
            console.log("Thrown error");
            console.dir(err);
            return res.redirect('/admin/reset_pwd?info=' + err);
        }
    }
);

adminRouter.get('/delete_user', isAdmin, (req, res) => res.render('delete_user'));

adminRouter.post('/delete_user',
    isAdmin,
    async (req, res, next) => {
        try {
            const user = await userModel.findByUsername(req.body.username);
            if (!user)
                return res.redirect('/admin/delete_user?info=' + encodeURIComponent(`Error: User ${req.body.username} not found`));
            else {
                await user.deleteOne();
                return res.redirect('/admin/delete_user?info=' + "Success");
            }
        } catch (err) {
            console.dir(err);
            return res.redirect('/admin/delete_user?info=' + err);
        }
    }
);


exports.clientRouter = clientRouter;
exports.userRouter = userRouter;
exports.medleyRouter = medleyRouter;
exports.adminRouter = adminRouter;
