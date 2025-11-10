/*******************************************************************************
 *
 *   app.js:  Express app for online.interlisp.org web portal. Sets up and does
 *            routing of htpp(s) requests.
 *
 *
 *   2021-11-18 Frank Halasz
 *
 *
 *   Copyright: 2021-2023 by Interlisp.org
 *
 *
 ******************************************************************************/

const config = require('./config');
const fs = require('fs');
const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const session = require("express-session");
const passport = require('passport');
const url = require('url');
const cookieParser = require('cookie-parser');
//const favicon = require('serve-favicon')

// Set up main app as well as the filesApp
// And reroute queries with
const app = express();
const filesApp = require('./files');
app.use((req, res, next) => {
            if(config.isFIO(req)) filesApp(req, res);
            else next();
        });

//app.use(favicon(path.join(config.imagesDir, 'favicon.ico')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// view engine setup
app.set('views', config.viewsPath);
app.set('view engine', 'pug');

// Set up logging
const logStream = fs.createWriteStream(config.logPath, { flags: 'a' });
logger.token('user', (req, res) => { return (req.user && req.user.username) || "Unknown"; });
logger.token('user-agent-short', (req, res) => { return (req.get('User-Agent') && req.get('User-Agent').split(' ', 1)[0]) || "Unknown"; });
app.use(
  logger(
    ':date[iso] :user :method :url :user-agent-short :status :response-time ms - :res[content-length]', {
        stream: logStream,
        skip: (req, res) => {
          return !(/^\/interlisp/.test(req.originalUrl) || /^\/client\/go/.test(req.originalUrl) || /^\/main$/.test(req.originalUrl) || /^\/$/.test(req.originalUrl));
        }
    }));

//  Set up express session
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false
}));

//
// Setup routers
//
const medleyRouter = require('./medley');
const userRouter = require("./user");
const adminRouter = require("./admin");
const clientRouter = express.Router();
clientRouter.get('/go', (req, res, next) => { res.sendFile(config.noVncHomePage); });
clientRouter.use(express.static(config.noVncDir));

// Setup passport for user authentication
app.use(passport.initialize());
app.use(passport.session());
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn.bind(null, '/user/login');

// Use cookie-parser
app.use(cookieParser());

// Do the routing
app.use((req, res, next) => {
            if(req.protocol === 'https' || !config.supportHttps) next();
            else res.redirect(`https://${req.hostname}:${config.httpsRedirectPort}${req.url}`);
          });
app.use('/images', express.static(config.imagesDir));
app.get('/', (req, res) => { res.redirect('/main'); });
app.use('/stylesheets', express.static(config.stylesheetsPath));
app.use('/polyfills', express.static(config.polyfillsPath));
app.use('/js', express.static(config.clientJsPath));
app.get('/main',
         ensureLoggedIn(),
         async (req, res, next) =>
             {
                  let page = 'main';
                  let alURL = "";
                  const fromvnc = (req.query.fromvnc != undefined);
                  const isAutoLogin = (req.query.autologin != undefined);
                  if(isAutoLogin && fromvnc) {
                      alURL = req.cookies.autologinURL;
                      page = 'again';
                  }
                  res.render(page,
                           {
                             login: req.user.username,
                             isGuest: (req.user.username == config.guestUsername),
                             isVerified: (await userRouter.getIsVerified(req) ? 'true' : 'false'),
                             nodisclaimer: (await userRouter.getNoDisclaimer(req) ? 'true' : 'false'),
                             isNCO: config.isNCO(req),
                             isAutoLogin: isAutoLogin,
                             notecards: (req.query.notecards != undefined),
                             rooms: (req.query.rooms != undefined),
                             alURL: alURL || "dummy",
                             start: (req.query.start != undefined) && (req.query.start != "") ? req.query.start : ""
                           }
                  );
             }
       );

function autologinGoToMain(req, res, next) {
    const cookieUrl = encodeURIComponent(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    res.cookie('autologinURL', cookieUrl);
    res.redirect(url.format({pathname:"/main", query: req.query}));
}

function autologinReturnTo(req) {
    return req.originalUrl + (req.originalUrl.includes("?") ? "&" : "?") + "autologin=true";
}

app.get([ '/guest', '/demo', '/demo/guest' ],
         (req, res, next) => {
            if(req.query.autologin === undefined) {
              if (req.isAuthenticated && req.isAuthenticated()) {
                req.logout();
              }
              req.session.returnTo = autologinReturnTo(req);
              let newQuery = {};
              newQuery.username = config.guestUsername;
              newQuery.password = config.guestPassword;
              res.redirect(url.format({pathname:"/user/autologin", query: newQuery}));
            }
            else next();
         },
         autologinGoToMain
       );

app.get([ '/demo/login' ],
         (req, res, next) => {
             if(req.query.autologin === undefined) {
               req.session.returnTo = autologinReturnTo(req);
               if (req.isAuthenticated && req.isAuthenticated()) {
                  if (req.user.username == config.guestUsername) req.logout();
                  else res.render('relogin',
                         {
                           loggedUsername: req.user.username,
                           redirectNo: url.format({ pathname:"/user/autologin", query:{} }),
                           redirectYes: url.format({ pathname:"/user/autologin", query:{logout: "true"} })
                          }
                        );
               }
               res.redirect(url.format({ pathname:"/user/autologin", query:{} }));
             }
             else next();
         },
         autologinGoToMain
       );

app.use('/user', userRouter);
app.use('/medley', ensureLoggedIn(), medleyRouter);
app.use('/client', ensureLoggedIn(), clientRouter);
app.use('/admin', ensureLoggedIn(), adminRouter);
app.use('/downloads', express.static(config.staticHostingPath));
app.use('/statics', express.static(config.staticHostingPath));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404, `${req.originalUrl} Not Found`));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = config.isDev ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
