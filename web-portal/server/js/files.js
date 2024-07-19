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
const mFs = require('fs');
const mPath = require('node:path');
const mExpress = require("express");

const config = require("./config");
const { isText, isBinary, getEncoding } = require('istextorbinary');

const filesApp = mExpress();

// Define function to set content type headers for files with no
// extension.  Use isBinary to distinguish octet-stream versus
// text content types.
// Used by mExpress.static
function setContentType(res, path, stat) {
    const ext = mPath.extname(path);
    if(ext.length == 0) {
        const buffer = mFs.readFileSync(path);
        const name = mPath.basename(path);
        if(isInterlispSource(buffer, name)) {
            res.set('Content-Type', 'application/octet-stream');
        } else if (isText(null, buffer)) {
            res.set('Content-Type', 'text/plain; charset=UTF-8');
            res.set('X-Content-Type-Options', 'nosniff');
         } else {
            res.set('Content-Type', 'application/octet-stream');
        }
    } else {
        switch(ext) {
          case '.awk':
          case '.cmd':
          case '.command':
          case '.dribble':
          case '.iss':
          case '.lisp':
          case '.ps1':
          case '.sh':
          case '.tty':
          case '.sh':
          case '.yaml':
          case '.yml':
            res.set('Content-Type', 'text/plain; charset=UTF-8');
            break;
        }
    }
}

// Does buffer contain an Interlisp source file?
function isInterlispSource(buffer, name) {
     return (
              buffer.includes("(DEFINE-FILE-INFO")
              && buffer.includes(name + "COMS")
            );

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

filesApp.use(mExpress.static(config.filesHostingPath, staticOptions));

// can't find file - send error message
filesApp.use((req, res, next) => {
  if(req.url == "/favicon.ico") {
      res.status(404);
      res.end();
  } else {
      res.status(404);
      res.send("<!DOCTYPE html><html><body><h3>ERROR: Cannot find file: " + req.originalUrl + "</h3></body></html>");
  }
});


module.exports = filesApp;
