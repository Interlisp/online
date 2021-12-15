# Dockerfile to create online.interlisp.org docker image for use on AWS EC2
# 2021-11-11 Frank Halasz
# 
ARG FROM_TAG=latest
FROM interlisp/medley:${FROM_TAG}
ARG FROM_TAG
ARG BUILD_DATE
#
SHELL ["/bin/bash", "-c"]
USER root:root
# Pass the version information down
ENV MEDLEY_VERSION=${FROM_TAG}
ENV MEDLEY_ONLINE_BUILD_DATE=${BUILD_DATE}
#
ARG DEBIAN_FRONTEND=noninteractive
ARG USER_NAME=medley
ARG HOMEDIR=/home/${USER_NAME}
ENV MEDLEYDIR=${HOMEDIR}/il
# install git & gh (github cli) 
RUN apt-get update
RUN apt-get install -y apt-utils
RUN apt-get install -y curl
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
RUN apt-get update
RUN apt-get install -y git gh
#  websockify for use with noVNC
RUN apt-get install -y websockify
#  install xterm plus twm for minimal window manager function on xterm/sftp "page"
RUN apt-get install -y xterm twm autocutsel
# install sshd
RUN apt-get -y install openssh-server && \
    mkdir -p /var/run/sshd && \
    rm -f /etc/ssh/ssh_host_*key*
COPY sftp/sshd_config /etc/ssh/sshd_config
COPY sftp/ssh_host_*_key /etc/ssh/
COPY sftp/ssh_host_*_key.pub /etc/ssh/
RUN  chmod 600 /etc/ssh/ssh_host_*_key
#  nano & vim for ease of maintenance
RUN apt-get install -y nano vim
# keep lisp.virtualmem out of medley home dir
RUN mkdir -p ${MEDLEYDIR}
RUN chown ${USER_NAME}:${USER_NAME} ${MEDLEYDIR}
RUN mkdir ${MEDLEYDIR}/vmem
RUN chown ${USER_NAME}:${USER_NAME} ${MEDLEYDIR}/vmem
# move /app/medley over to /home/medley
RUN mv /app/medley/* ${MEDLEYDIR}
RUN chown --recursive --silent ${USER_NAME}:${USER_NAME} ${MEDLEYDIR}/*
# create a sysout subdir and copy full.sysout into it as online.sysout
RUN mkdir -p ${MEDLEYDIR}/sysout
RUN chown ${USER_NAME}:${USER_NAME} ${MEDLEYDIR}/sysout
RUN cp -p ${MEDLEYDIR}/loadups/full.sysout ${MEDLEYDIR}/sysout/online.sysout
# copy the run-XXX scripts into /app/medley/online/bin
RUN mkdir -p /app/medley/online/bin
RUN chown root:root /app/medley/online/bin
COPY scripts/* /app/medley/online/bin/
RUN chmod ugo+x /app/medley/online/bin/*
# copy INIT file into home directory
COPY --chown=${USER_NAME}:${USER_NAME} init/INIT ${MEDLEYDIR}
COPY --chown=${USER_NAME}:${USER_NAME} init/ONLINE-INIT ${MEDLEYDIR}
COPY --chown=${USER_NAME}:${USER_NAME} init/ONLINE-INIT.LCOM ${MEDLEYDIR}
# clean up medley/.bashrc for use with xterm
RUN sed -i /PS1=/s/u@.h/u@oio/ ${HOMEDIR}/.bashrc
RUN chown ${USER_NAME}:${USER_NAME} ${HOMEDIR}/.bashrc
# setup medley home dir with misc config files
COPY --chown=${USER_NAME}:${USER_NAME} misc/.Xresources ${HOMEDIR}
# Give user medley a password that can be used with sftp
RUN echo ${USER_NAME}:3333CoyoteHill | chpasswd
# Create the dir to mount the TLS certificates
RUN mkdir -p /etc/letsencrypt/live/online.interlisp.org/
RUN chmod go-rwx /etc/letsencrypt/live
RUN mkdir -p /etc/letsencrypt/archive/online.interlisp.org/
RUN chmod go-rwx /etc/letsencrypt/archive
# In actual use, USER and ENTRYPOINT will be set by the calling docker command
WORKDIR ${HOMEDIR}
USER root:root
ENTRYPOINT USER=${USER_NAME} /bin/bash
#
