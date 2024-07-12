/*******************************************************************************
 *
 *   files.js:   Sub-app to handle access to static files through
 *               files.interlisp.org.
 *
 *   2024-07-07 Frank Halasz
 *
 *
 *   Copyright: 2024 by Interlisp.org
 *
 *
 ******************************************************************************/

const config = require("./config");
const express = require("express");

const filesApp = express();

filesApp.use((req, res, next) => {
  if (req.url.substr(-1,1) == "/") res.redirect("index.html");
  else next();
});

filesApp.use(express.static(config.filesHostingPath));

// catch 404 and forward to error handler
filesApp.use((req, res, next) => {
  next(createError(404, `${req.originalUrl} Not Found`));
});

// error handler
filesApp.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = config.isDev ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = filesApp;
