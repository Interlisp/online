
# Online.Interlisp.Org: Demo mode (aka Museum Mode)
## Overview

When accessing online.interlisp.org (OIO) using Demo Mode,  Online Medley will start up and at the end of processing the ONLINE-INIT file will automatically LOAD a lisp file (source or compiled, Interlisp or Medley CommonLisp) that was specified in the URL through which OIO was accessed.  This lisp file is referred to as a *start-script* and the intention is that when it is LOADed it will run a demo by defining and/or LOADing additional lisp code and then starting up that demo, e.g., via a P file package command.  Before the Online Medley run is started, the start-script file is downloaded using ```wget```into a known file in the Medley file system from where it is LOADed by ONLINE-INIT. 

An addition aspect of Demo Mode is that based on flags in the URL login processing can be skipped, the user automatically logged in as guest, and the Online Medley session started with no user interaction required.   Alternatively,  the login process can remain but the standard "Run Medley" page will be skipped and the user will go directly from login to the running Medley without having to set all the run parameters in the Run Medley page.  Automatic guest login is sufficient for most demos.  But requiring login allows demos to save files and context between runs of Online Medley, which is not possible with guest login.

## Demo mode URLs
To access Demo mode, use the following URLs:

```https://online.interlisp.og/demo?start=\<START-SCRIPT>``` for automatic guest login.
```https://online.interlisp.og/demo/login?start=\<START-SCRIPT>``` to require logins

```<START-SCRIPT>``` is a URL pointing to a start-script lisp file that can be wget'd by the OIO server.  **This URL must be encoded using the equivalent of Javascript's *encodeURIComponent*.**  The easiest way to do this is via one of the many websites that offer this service such as https://meyerweb.com/eric/tools/dencoder/.

In addition to the *start* query parameter, Demo mode supports the *notecards=1* and *rooms=1* query parameters.  If these query parameters are included in the Demo mode URL, then NoteCards (and/or Rooms) will be automatically started when Online Medley runs, in addition to the start-script.

Any of the query parameters (start, notecards, rooms) can be left off, with the expected change of function.  For example, https://online.interlisp.org/demo?notecards=1 will automatically login as guest and start notecards - but not run any start-script.

Example Demo mode URL:  https://online.interlisp.org/demo?start=https%3A%2F%2Fgithub.com%2FInterlisp%2Fonline%2Fraw%2Frefs%2Fheads%2Ffgh_museum-mode%2Fstart-scripts%2FSTART-INSPHEX.LCOM&notecards=1.  This URL will automatically login as guest, wget and LOAD the file START-INSPHEX.LCOM from the Interlisp/Online repo on github and start Notecards.

## Start scripts

Sample start scripts can be found in the Interlisp/Online Github repo in the start-scripts directory.

Most demos will require Lisp (or other) files that are not included in the standard Online Medley image.  One very handy function to be used in start-scripts for these demos is ```(ShellWget URL OUTFILE)```.   This function will download (using wget) the file specified by URL and store it in the versioned Online Medley file system under the name OUTFILE.  OUTFILE can then be LOADed in the start-script.

Below is the start-script for a demo of INSPHEX.  The start-script defines and then runs a function called START-INSPHEX.  START-INPHEX in turn uses ShellWget to download the source code to INSPHEX from Github, compiles it, loads the compiled file and then uses ADD.PROCESS to run the main HEXDUMP function.  There is some additional complication in the call to ADD.PROCESS to ensure that packages are handled correctly.  Most exisitng Interlisp demos will not need this complexity since they don't use packages.

## Start scripts outside of Demo mode

Start scripts can also be used outside of Demo mode.  In the normal workflow, the user will be taken to the "Run Medley" page.  On the Run Medley page, if you enable *Show advanced options* there will be a field into which you enter the URL for a start-scripts (in either original or URI encoded forms


















> Written with [StackEdit](https://stackedit.io/).
<!--stackedit_data:
eyJoaXN0b3J5IjpbLTg1MDg2NzczMCw1OTAwMTA4NzMsNzg3Nj
QwOTIyXX0=
-->