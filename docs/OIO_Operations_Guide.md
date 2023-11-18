# Online.Interlisp.Org: Operations Guide
## Overview
Online.interlisp.org runs on an AWS EC2 instance (currently a t3.medium instance with 50GB attached EBS storage) controlled by the Interlisp.org AWS account.  This instance runs Ubuntu (currently 20.04) with Docker CE installed.  An AWS Elastic IP (3.19.8.9) is assigned to the instance, which in turn is pointed to by a DNS A record for online.interlisp.org managed via the Interlisp.org GoDaddy account.


Build, operation and maintenance of online.interlisp.org centers around two Docker images:  the Portal image and the Medley (Online) image.  These two images are available from the Github Container Registry at ghcr.io/interlisp/online-production and ghcr.io/interlisp/online-medley, respectively.  (There is also a third image ghcr.io/interlisp/online-development that is a version of the Portal image with additional tools/features for test and development work.)


The Portal image incorporates all of the web-portal functionality and is intended to run as a singleton container on the EC2 host to “provide” the online.interlisp.org web service.   The Portal image/container is Ubuntu-based and includes the main Node.js web server as well as a MongoDB server for the user database.  When running, the production Portal container is named `oio` and services ports 80 (HTTP) and 443 (HTTPS) on the EC2 host.  In addition, certain files including log files and the user database are mapped from the container into the EC2 host file system (at /srv/oio/production), making them available for backup and maintenance outside of the Portal container.


There is often a second development Portal container running based on the development Portal image.   When running, the development Portal container is named `oio-dev` and services ports 8080 (HTTP) and 8081 (HTTPS) on the EC2 host. Use `https://online.interlisp.org:8081` to access the development portal.  Log files and the user database for the development portal are stored at /srv/oio/development in the EC2 host file system.


The Medley (Online) image is used to run a separate sandboxed instance of Medley for each user.  The image includes Medley, an Xvnc server, a filebrowser service and various support services.  For each user, the Portal container will start a separate Medley (Online) container,  map to it a set of unique port addresses on the EC2 host, and map the user directory portion of its file system to a per-user persistent Docker volume.  The user’s web app uses the mapped ports to access the Medley running “on” the Xvnc server.   The Medley containers run in parallel to (rather than within) the Portal container, meaning they all operate in a common docker space at the level of the EC2 host and share the network environment of the host.    


The SSL/TLS certificates for online.interlisp.org are maintained at the EC2 host level and are mapped into the web portal Docker container when it starts up.  These certificates are kept at 
/etc/letsencrypt/live/online.interlisp.org  (and, more generally, at /etc/letsencrypt) on the host.  These TLS certificates must be renewed quarterly (manually) once a quarter as described below.




## Enabling ssh access in order to manage online.interlisp.org


Management of online.interlisp.org is accomplished via an ssh terminal connection to the EC2 host.  


To enable this ssh connection, you will need an IAM login under the Interlisp.org AWS account.  This IAM account will need at least the following permissions:
1. AmazonEC2FullAccess
2. AmazonS3FullAccess
3. IAMUserChangePassword
4. EC2InstanceConnect
Any Administrator of the Interlisp.org AWS account can set this up for you (Larry, Frank, ?).


Once the IAM login is established, log into console.aws.amazon.com using the “interlisp” as the account (or, alternatively, 941561944431 as the account number) and your IAM username and password.


From the AWS dashboard, navigate to the S3 service.   In the S3 dashboard, you should see a list of S3 buckets for the account.  (Currently, just 1 bucket.)  Click on the “oio.support” bucket, revealing a list of three Objects (aka, files).  These are the public/private keys that will enable ssh access to the online.interlisp.org EC2 host.


Download the .pem file and the .pub file and place them into the ~/.ssh directory on whatever machine you will be using for the ssh terminal.   Change the file permissions on the .pem file to prohibit all access except read/write by owner (chmod 0600 in Linux).  On many systems, you will also need to ensure that the ~/..ssh directory is set to prohibit all access except read/write/execute by owner.


Append the following lines to the file `~/.ssh/config`.
```
Host online.interlisp.org
HostName online.interlisp.org
User ubuntu
IdentityFile ~/.ssh/id_online-interlisp-org.pem


Host oio
HostName online.interlisp.org
User ubuntu
IdentityFile ~/.ssh/id_online-interlisp-org.pem
```


You are now ready to connect to the online.interlisp.org host.  


In a terminal window, type `ssh oio` or `ssh online.interlisp.org`.


You will be automatically logged into a bash shell on the oio host as user ‘ubuntu’ with sudo access and the vi and/or nano as available editors.


## Starting/stopping the OIO web portal (Docker container)


The OIO web portal (Docker container) is started automatically by systemd whenever the OIO host is rebooted.  This is controlled by the service file /lib/systemd/system/oio.service.   Standard systemctl operations (e.g. sudo systemctl disable oio.service) can be used to modify this behavior.


To stop the OIO web portal:  `sudo systemctl stop oio.service`.   Occasionally, this will fail to stop the running Docker container.  In this case, try `docker container kill oio`.  Note: “sudo” is not required with docker commands for user ubuntu.


To start the OIO web portal (after a stop or if start on boot is disabled): `sudo systemctl start oio.service`


To view the “console log” from the oio.service, use: `journalctl -b -u oio.service`


The oio-dev.service is also autostarted on boot and runs in parallel to the oio.service.  The oio-dev.service runs a Docker container that includes the latest development code and several additional tools for test and debug.  The development web portal listens on port 8080 (HTTP) and 8081 (HTTPS) and has its own version of the user database, etc, allowing simultaneous access to both the production and the development portals.


Managing the oio-dev service (and docker container) is the same as running the standard oio service (and docker container), replacing the “oio” in commands with “oio-dev”.


## Monitoring the web-portal service(s)


The utility `oio` can be used to monitor (and do some limited maintenance) on the web portal.  `oio` is installed in /home/ubuntu/bin, which should be on the PATH when logged in as ubuntu.


The following are the available `oio` commands:

```
oio help: lists all available commands


oio status:  lists status of oio and oio-dev docker containers
oio status all:  lists status of all oio docker containers including running user Medley containers


oio ghosts:  lists all Medley docker containers that have been running for greater than 12 hours
oio ghosts kill:  kill all Medley docker containers that have been running for greater than 12 hours


oio users list:  list all registered users
oio users list new:  list users registered in the last month
oio users list new YYYY-MM-DD:  list new users registered since YYYY-MM-DD


oio guests:  count of guest logins in the last month
oio guests YYYY-MM-DD:  count of guest logins since YYYY-MM-DD
```


The utility `oio-dev` is equivalent to the `oio` utility, except it operates on the oio-dev (development) web portal rather than the oio (production) web portal.


## Renew LetsEncrypt SSL Certificate


The LetsEncrypt SSL Certificate needs to be renewed at least once every 90 days.  This process must be done manually, preferably at least a few days before the old certificate expires.
The process takes about 15 seconds, but the web portal (docker container) must be stopped before the process can proceed.


To check the expiration date of the existing certificate:
```
sudo openssl x509 -dates -noout -in /etc/letsencrypt/live/online.interlisp.org/cert.pem
```


To renew the certificate:
```
# stop the portal container
sudo systemctl stop oio.service
# (optional) renewal dry-run
sudo certbot renew --dry-run
# renew the certificate
sudo certbot renew
# restart the web-portal service/container
sudo systemctl start oio.service
```


## Bring new Medely release online

1. Make sure that the Docker image corresponding to the new Medley release has been created and uploaded to 
Docker Hub under interlisp/medley.  When listing the Tags (sorted by Newest) under interlisp/medley, there should be
a tag whose first "part" (up to the first underscore) corresponds to the release tag for the new Medley release.
This will usually be the second tag listed immediately after the "latest" tag.  If no matching tag can be found,
then you will have to back and run the `Build/Push Docker Image` action in the Medley repo on Github.

2.  In the interlisp/online Github repo, run the `Build/Push Online-Medley Docker Image` action.  This will create an
online Docker image for the new Medley release and store it in the Github Container Repository tagged as 
`ghcr.io/interlisp/online-medley:development`.

3.  Test this new online-Medley image as follows:

    3.1 Connect via ssh to the online.interlisp.org host as described in Section 2 above. 

    3.2  Execute: `oio medley pulldev`

    3.3  From a web browser go to `https://online.interlisp.org:8081` to connect to the development version
         of Interlisp Online.  Login (or login as guest) and Run Medley.  The Medley that starts should be the new
         Medley release.  Run it through its paces to make it works.  Then logout of Medley.

4.  Retag new online-Medley image from :development to :production

    4.1   Connect via ssh to the online.interlisp.org host as described in Section 2 above.

    4.2   Execute: `oio medley dev2prod`

    4.3  Next time you `Run Medley` at `https://online.interlisp.org`, you should get the new Medley release.

## Bring an updated Portal online

1. In the interlisp/online Github repo, run the `Build/Push Portal Docker Image` action.  This will create two
new Docker images containing the online Portal code (online-development and online-production) and
store them in the Github Container Registry tagged as `ghcr.io/interlisp/online-development:latest` and
`ghcr.io/interlisp/online-production:latest`.  The portal code in these two Docker images is the same, but the
online-development image includes many additional tools to help in developing and testing the portal code.
The online-production image includes just what is necessary to run the portal in production.

2.  Test the updated Portal as follows:

    2.1   Connect via ssh to the online.interlisp.org host as described in Section 2 above.

    2.2   Execute: `oio portal pulldev`.  This will pull the online-development:latest Docker image from the GHCR onto
          the online.interlisp.org host.

    2.3   Execute: `sudo systemctl restart oio-dev.service` to restart the oio-dev service to run the new docker
          image.

    2.4   From a web browser go to `https://online.interlisp.org:8081` to connect to the newly updated development
          version of Interlisp Online.

    2.5   Run Interlisp Online through its paces to check that the updates (and base functions) are working correctly.

3.  Install the production version of the updated portal

     3.1  Connect via ssh to the online.interlisp.org host as described in Section 2 above.

     3.2  Execute `oio portal pullprod`.  This will pull the online-production:latest Docker image from the GHCR onto
          the online.interlisp.org host.

     3.3  Execute: `sudo systemctl restart oio.service` to restart the oio service to run the new docker
          image.

     3.4  From a web browser go to `https://online.interlisp.org` to connect to the newly updated production
          version of Interlisp Online and make sure everything is working as expected.


  

     
