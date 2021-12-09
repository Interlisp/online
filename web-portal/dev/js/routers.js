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

// start interlisp
medleyRouter.get("/start", (req, res) => {
    const resume = req.query.resume && ((req.query.resume == "1") || (req.query.resume.toLowerCase() == "true"));
    const screen_width = req.query.screen_width || 1024;
    const screen_height = req.query.screen_height || 808;
    const devmode = req.query.devmode && ((req.query.devmode == "1") || (req.query.devmode.toLowerCase() == "true"));
    const emailish = req.user.username.replace(badchars, '-').replace("@", ".-.");
    port = port + 1;
    if (port > config.dockerPortMax) port = config.dockerPortMin;
    const run_cmd =
        `run -d ${config.isDev ? "" : "--rm"}`
        + ` --network host`
        + ` --name ${emailish}${config.isDev ? `-${Math.floor(Math.random() * 99999)}` : ``}`
        + ` --mount type=volume,source=${emailish}_home,target=/home/medley`
        + ` --mount type=volume,source=${emailish}_il,target=/home/medley/il`
        + dockerTlsMounts
        + ` --env PORT=${port}`
        + dockerTlsEnv
        + ` --entrypoint ${config.dockerScriptsDir}/run-online-medley`
        + ` ${config.dockerImage}`
        + (resume ? ` vmem` : ` sysout`)
        + ` ${screen_width} ${screen_height}`
        ;
    if(config.isDev) console.log(run_cmd);
    docker
        .command(`container ${config.isDev ? `ls` : `kill ${emailish}`}`)
        .catch((err)=>{ if(config.isDev) { console.log("Expected error after container kill: " + err); } } )
	    .finally(() =>
		    docker
	            .command(run_cmd)
	            .then(data => { res.redirect(`${config.httpsBaseUrl}/client/go?target=Interlisp&port=${port}&autoconnect=1&encrypt=1`); })
	            .catch(err => { console.log(err); res.send(err.stderr); })
                );
});

// start xterm andsftp server
medleyRouter.get("/xterm", (req, res) => {
    const emailish = req.user.username.replace(badchars, '-').replace("@", ".-.");
    port = port + 1;
    if (port > config.dockerPortMax) port = config.dockerPortMin;
    const run_cmd =
        `run -d ${config.isDev ? "" : "--rm"}`
        + ` --network host`
        + ` --name ${emailish}${config.isDev ? `-${Math.floor(Math.random() * 99999)}` : ``}`
        + ` --mount type=volume,source=${emailish}_home,target=/home/medley`
        + ` --mount type=volume,source=${emailish}_il,target=/home/medley/il`
        + dockerTlsMounts
        + ` --env PORT=${port}`
        + dockerTlsEnv
        + ` --entrypoint ${config.dockerScriptsDir}/run-xterm`
        + ` ${config.dockerImage}`
        + ` 1024 808`
        ;
//        + ` --privileged` 
   if(config.isDev) console.log(run_cmd);
   docker
        .command(`container ${config.isDev ? `ls` : `kill ${emailish}`}`)
        .catch((err)=>{ if(config.isDev) { console.log("Expected error after container kill: " + err); } } )
	    .finally(() =>
		    docker
	            .command(run_cmd)    
	            .then(data => { res.redirect(`${config.httpsBaseUrl}/client/go?target=xterm&port=${port}&autoconnect=1&encrypt=1`); })
	            .catch(err => { console.log(err); res.send(err.stderr); })
                );
});

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
