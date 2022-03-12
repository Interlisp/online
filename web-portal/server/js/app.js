/*******************************************************************************
 * 
 *   app.js:  Express app for online.interlisp.org web portal. Sets up and does
 *            routing of htpp(s) requests. 
 * 
 * 
 *   2021-11-18 Frank Halasz
 * 
 * 
 *   Copyright: 2021-2022 by Interlisp.org 
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
//const favicon = require('serve-favicon')

// Set up express basics
const app = express();
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

// Do the routing
app.use((req, res, next) => {
            if(req.protocol === 'https' || !config.supportHttps) next();
            else res.redirect(`https://${req.hostname}:${config.httpsRedirectPort}${req.url}`);
          });
app.use('/images', express.static(config.imagesDir));
app.get('/', (req, res) => { res.redirect('/main'); });
app.use('/stylesheets', express.static(config.stylesheetsPath));
app.use('/polyfills', express.static(config.polyfillsPath));
app.use('/views/js', express.static(`${config.viewsPath}/js`));
app.get('/main', 
         ensureLoggedIn(),
         async (req, res, next) => 
             { res.render('main', 
                           {
                             login: req.user.username, 
                             isGuest: (req.user.username == config.guestUsername),
                             isVerified: (await userRouter.getIsVerified(req) ? 'true' : 'false'),
                             nodisclaimer: (await userRouter.getNoDisclaimer(req) ? 'true' : 'false'),
                             isNCO: config.isNCO(req)
                            }
                          );
              }
        );
app.use('/user', userRouter);
app.use('/medley', ensureLoggedIn(), medleyRouter);
app.use('/client', ensureLoggedIn(), clientRouter);
app.use('/admin', ensureLoggedIn(), adminRouter);

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
