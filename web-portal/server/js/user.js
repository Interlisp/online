/*******************************************************************************
 *
 *   user.js:  User registration and login for online.interlisp.org
 *             web portal.
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
const url = require('url');
const express = require("express");
const passport = require('passport');
const {userModel, loginModel} = require('./mongodb');
const validateEmail = require('email-addresses').parseOneAddress;
const crypto = require('crypto');
const gmailSend = require('./gmail-send')({user: config.gmailUsername, pass: config.gmailPassword, from: config.gmailFrom });

//
//  The router
//
const userRouter = express.Router();

//
//  Misc helper functions
//
function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

function generateEmailBody(req, firstname, token) {
    const origin = url.format({protocol: req.protocol, host: req.get('host')});
    const oio = "<i>online&#65279;.interlisp.&#65279;org</i>";
    return ``
      + `Dear ${firstname},<br><br>You have recently registered for an account on `
      + `${oio}. `
      + `In order to keep this account active, please click on the following link to verify your email address: `
      + `<a href='${origin}/user/verify?token=${token}'>Verify email</a>`
      + `<br><br>If you have not verified your email by 7 days after you created it, your account `
      + `at ${oio} may be automatically deleted.<br><br>Thanks.<br><br>The ${oio} Team<br>`
      ;
}


//
//  Setup passport authentication support
//

passport.use(userModel.createStrategy());
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// Make sure there is a guest user registered
(async () => {
    try {
          const user = await userModel.findByUsername(config.guestUsername);
          if (!user)
            userModel.register(
                {
                  username: config.guestUsername,
                  uname: "guest",
                  firstname: "Guest",
                  lastname: "User",
                  initials: "guest",
                  nodisclaimer: false,
                  isVerified: true,
                  created: Date.now(),
                  lastLogin: 0,
                  verificationToken: "used"
               },
                config.guestPassword,
                async (err, thisModel, passwordErr) => {
                    if(err) {
                        console.log("Error registering guest user: " + err);
                    }
                    if(passwordErr) {
                        console.log("Password Error registering guest user: " + passwordErr);
                    }
                }
            );
    } catch(err) { console.log("Error registering guest user: " + err); }
})();

//
//
//  User login routes
//
//

function passportAuthenticate(req, res, next) {
    passport.authenticate('local',
        (err, user, info) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                console.dir(info);
                return res.redirect('/user/login?info=' + info);
            }


            req.logIn(user,
                async function(err) {
                    if (err) {
                        return next(err);
                    } else {
                        try {
                            await userModel.updateOne({username: user.username},{$set: {lastLogin: Date.now()}, $inc: {numLogins : 1}});
                        } catch (err) {
                            console.log("Update last login time error: " + err);
                        }
                        try {
                            await loginModel.create({username: user.username, timestamp: Date.now()});
                        } catch (err) {
                            console.log("Error in logging login: " + err);
                        }
                        if(user.uname)
                            if ((user.uname == "guest") && (req.query.autologin != undefined)) {
                                const newQuery={};
                                newQuery.autologin="true";
                                if(req.query.notecards != undefined) newQuery.notecards="true";
                                if(req.query.rooms != undefined) newQuery.rooms="true";
                                if((req.query.start != undefined) && (req.query.start != ""))
                                    newQuery.start=req.query.start;
                                return res.redirect(url.format({pathname:"/main", query: newQuery}));
                            }
                            else
                                return res.redirect('/main');
                        else
                            return res.render('reregister', {isNCO: config.isNCO(req)});
                    }
                }
            );
        }
    )(req, res, next);
}

userRouter.post('/login', passportAuthenticate);
userRouter.get('/autologin', passportAuthenticate);

userRouter.get('/login',
    (req, res) => {
        res.render('login',
                    {
                      verificationNotice: "false",
                      guestUsername: config.guestUsername,
                      guestPassword: config.guestPassword,
                      isNCO: config.isNCO(req)
                    }
        );
    }
);

userRouter.post('/logout',
  (req, res) => {
        req.logout();
        res.redirect('/user/login');
        }
);

//
//
//  User registration routes
//
//

userRouter.get('/register',
  (req, res) => { res.render('register', {isNCO: config.isNCO(req)}); }
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
        const token = generateToken();
        userModel.register(
            {
                username: req.body.username,
                active: false,
                uname: req.body.uname,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                initials: req.body.initials,
                nodisclaimer: req.body.nodisclaimer ? true : false,
                isVerified: false,
                created: Date.now(),
                numLogins: 0,
                lastLogin: 0,
                verificationToken: token
            },
            req.body.password,
            async (err, thisModel, passwordErr) => {
                if(!err) {
                    try {
                        const {result,full} =
                           await gmailSend({to: req.body.username,
                                       subject: "Email verification for online.interlisp.org",
                                       html: generateEmailBody(req, req.body.firstname, token) });
                        if(false) console.dir(result);
                        if(false) console.dir(full);
                    }
                    catch(err) {
                        console.log("Gmail send error: " + err);
                    }
                    return res.render('login', { verificationNotice: "true",
                                                 email: req.body.username,
                                                 guestUsername: config.guestUsername,
                                                 guestPassword: config.guestPassword
                                                });
                }
                else {
                    return res.redirect('/user/register?info=' + err);
                }
            }
        );
    }
);

userRouter.post('/reregister',
    async (req, res, next) => {
        try {
            const token = generateToken();
            let repRes = await userModel.updateOne(
                {   username: req.user.username },
                {   uname: req.body.uname,
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    initials: req.body.initials,
                    isValidated: false,
                    nodisclaimer: false,
                    created: Date.now(),
                    verificationToken: token,
                }
            );
            if(false) console.dir(repRes);
            req.user.firstname = req.body.firstname;
            resendVerification(req);
            res.redirect('/main?rr=1');
        } catch(err) {
            res.redirect('/user/reregister?info=' + err);
        }
    }
);

//
//
//  Routes to handle nodisclainmer
//
//




userRouter.getNoDisclaimer = async function(req) {
    try {
            let doc = await userModel.findOne({ username: req.user.username });
            return doc.nodisclaimer;
        } catch(err) {
            console.dir("get nodisclaimer error: " + err);
            return false;
        }
};

userRouter.get('/nodisclaimer',
    async (req, res, next) => {
        try {
            let repRes = await userModel.updateOne(
                {   username: req.user.username }, 
                {   nodisclaimer: true }
            );
            if(false) console.dir(repRes);
            res.redirect('/main');
        } catch(err) {
            console.dir("nodisclaimer error: " + err);
            res.redirect('/main');
        }
    }
);

//
//
//  Routes to handle email verification
//
//

userRouter.getIsVerified = async function(req) {
    try {
            let doc = await userModel.findOne({ username: req.user.username });
            return doc.isVerified;
        } catch(err) {
            console.dir("get getIsVerified error: " + err);
            return false;
        }
};

userRouter.get('/verify',
    async(req, res, next) => {
        const token = req.query.token;
        try {
            let repRes = await userModel.updateOne(
                {   verificationToken: token },
                {
                    isVerified: true,
                    verificationToken: "used"
                }
            );
            console.dir(repRes);
            res.redirect('/');
        } catch(err) {
            console.dir("isVerified error: " + err);
            res.redirect('/');
        }
    }
);


async function resendVerification(req) {
    var token;
    try {
            let doc = await userModel.findOne({ username: req.user.username });
            token = doc.verificationToken;
            if(token == "notAssigned") {
                token = generateToken();
                await userModel.updateOne({ username: req.user.username }, { verificationToken: token });
            }
        } catch(err) {
            console.dir("get get token error: " + err);
            return false;
        }

    try {
        const {result,full} =
           await gmailSend({to: req.user.username,
                       subject: "Email verification for online.interlisp.org",
                       html: generateEmailBody(req, req.user.firstname, token) });
    }
    catch(err) {
        console.log("Gmail resend error: " + err);
    }
    return true;
}

userRouter.get('/resendverification',
    async(req, res, next) => {
        const result = resendVerification(req);
        if(result)
            res.send('OK');
        else
            res.send('Not OK');
        return result;
    }
);

userRouter.get('/nofilemgrwarning',
    async(req, res, next) => {
        const doSet = req.query.set || false;
        if(doSet) {
            try {
                let repRes = await userModel.updateOne(
                    { username: req.user.username },
                    { noFileMgrWarning: true }
                );
                console.dir(repRes);
                res.status(200).send('OK');
            } catch(err) {
                console.dir("/nofilemgrwarning error: " + err);
                res.status(500).send('Error');
            }
        } else {
            if(config.isGuestUser(req.user.username))
                res.status(200).send("guest");
            else {
                try {
                    const userObj = await userModel.findOne({ username: req.user.username });
                    const noWarning = userObj.noFileMgrWarning;
                    res.status(200).send(noWarning ? "true" : "false");
                } catch(err) {
                    console.dir("/nofilemgrwarning error: " + err);
                    res.status(500).send('Error');
                }
            }
        }
    }
);


userRouter.get('/clhstabnotice',
    async(req, res, next) => {
        const doSet = req.query.set || false;
        if(doSet) {
            try {
                let repRes = await userModel.updateOne(
                    { username: req.user.username },
                    { noCLHSTabNotice: true }
                );
                console.dir(repRes);
                res.status(200).send('OK');
            } catch(err) {
                console.dir("/clhstabnotice error: " + err);
                res.status(500).send('Error');
            }
        } else {
            if(config.isGuestUser(req.user.username))
                res.status(200).send("guest");
            else {
                try {
                    const userObj = await userModel.findOne({ username: req.user.username });
                    const noNotice = userObj.noCLHSTabNotice;
                    res.status(200).send(noNotice ? "true" : "false");
                } catch(err) {
                    console.dir("/clhstabnotice error: " + err);
                    res.status(500).send('Error');
                }
            }
        }
    }
);

//
//
//  Exports
//
//
module.exports = userRouter;
