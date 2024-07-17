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

// can't find file - send error message
filesApp.use((req, res, next) => {
  if(req.url == "/favicon.ico") {
      res.status(404);
      res.end();
  } else {
      res.status(404);
      res.send("<!DOCTYPE html><html><body><h1>Cannot find file: " + req.OriginalUrl + "</h1></body></html>");
  }
}


module.exports = filesApp;
