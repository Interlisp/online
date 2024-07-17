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

const mPath = require('node:path');
const config = require("./config");
const express = require("express");
const { isText, isBinary, getEncoding } = require('istextorbinary');

const filesApp = express();

// Define function to set content type headers for files with no
// extension.  Use isBinary to distinguish octet-stream versus
// text content types.
// Used by express.static
function setContentType(res, path, stat) {
    const ext = mPath.extname(path);
    if(ext.length == 0) {
        if(isBinary(path)) {
            res.set('Content-Type', 'application/octet-stream');
        } else {
            res.set('Content-Type', 'text/plain; charset=UTF-8');
        }
    } else {
        switch(ext) {
          case '.sh':
          case '.command':
          case '.awk':
            res.set('Content-Type', 'text/plain; charset=UTF-8');
            break;
        }
    }
}

filesApp.use((req, res, next) => {
            if(req.protocol === 'https' || !config.supportHttps) next();
            else res.redirect(`https://${req.hostname}:${config.httpsRedirectPort}${req.url}`);
          });

const staticOptions = {
    dotfiles: "allow",
    index: "index.html",
    setHeaders: setContentType
};

filesApp.use(express.static(config.filesHostingPath, staticOptions));

// catch 404 and forward to error handler
filesApp.use((req, res, next) => {
  console.log("heeeeeere *******************************************************************");
  res.send(' **************** ' + req.originalURL);
  //next(createError(404, `${req.originalUrl} Not Found`));
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
