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

