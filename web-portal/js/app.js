


//
//  Require all node modules up front
//
const config = require('./config');
const fs = require('fs');
const path = require('path');
const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const session = require("express-session");
const passport = require('passport');
//const favicon = require('serve-favicon')
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn.bind(null, '/user/login');
const { userRouter, medleyRouter, clientRouter, adminRouter } = require('./routers');

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

// Setup passport for user authentication
app.use(passport.initialize());
app.use(passport.session());

// Do the routing
app.use((req, res, next) => {
            if(req.protocol === 'https') next();
            else res.redirect(`https://${req.hostname}:${config.httpsPort}${req.url}`);
          });
app.use('/images', express.static(config.imagesDir));
app.get('/', (req, res) => { res.redirect('/main'); });
app.use('/stylesheets', express.static(config.stylesheetsPath));
app.get('/main', ensureLoggedIn(), (req, res, next) => { res.render('main', {login: req.user.username}); });
app.use('/user', userRouter);
app.use('/medley', ensureLoggedIn(), medleyRouter);
app.use('/client', ensureLoggedIn(), clientRouter);
app.use('/admin', ensureLoggedIn(), adminRouter);
app.use('/client', ensureLoggedIn(), clientRouter);

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
