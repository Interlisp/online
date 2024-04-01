# online
Source code for https://online.interlisp.org

# What's here?

* docker_medley
    Code for building a Docker image of a Medley Release as used by Interlisp Online.   For each user session, a Docker container is started from this image.
* docker_portal
    Code for building a Docker image of the Interlisp Online web portal.  A single container started from this Docker image serves as the Interlisp Online portal..
* docs
    Has Online Interlisp.Org operation manual
* system
    Misc. items for setting up and maintaining the Interlisp Online server running in Ubuntu on AWS. Specifically, the oio.sh script is used to install the Medley and Portal Docker images on the AWS server as well as to perform various maintenance and informational tasks for Interlisp Online.
* web-portal
    Back-end and front-end code for implementing the Interlisp Online web portal.  The back-end (in subdirectory Server) is immplemented in NodeJS.  The front-end (in subdirectory client) is a mix of HTML5 (PUG templates) and Javascript.  The front-end also contains a slightly modified version of noVNC.
* .github/workflows
     GitHub workflows for building the Medley and Portal Docker images.
