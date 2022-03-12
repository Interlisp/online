/*******************************************************************************
 * 
 *   docker.js: Setup docker interface for use by online.interlisp.org web portal.
 * 
 * 
 *   2021-11-22 Frank Halasz
 * 
 * 
 *   Copyright: 2021-2022 by Interlisp.org 
 * 
 *
 ******************************************************************************/
var dockerCLI = require('docker-cli-js');

var DockerOptions = dockerCLI.Options;
var Docker = dockerCLI.Docker;
var options = new DockerOptions(
    /* machinename */ null,
    /* currentWorkingDirectory */ null,
    /* echo */ false,
   );
var docker = new Docker(options);

module.exports = docker;

