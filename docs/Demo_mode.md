
# Online.Interlisp.Org: Demo mode (aka Museum Mode)
## Overview

When accessing online.interlisp.org (OIO) using Demo Mode,  Online Medley will LOAD a Lisp file called a *start script*.   The start script is specified by a query parameter in the URL through which OIO was accessed.  Before the Online Medley run starts, the start script file is downloaded using ```wget```into a known file in the Medley file system.  It is then LOADed as the last step in the ONLINE-INIT initialization.  The intent is that upon LOAD the start script will run a demo by defining and/or LOADing additional Lisp code and then starting up that demo, e.g., via a P file package command.  

An addition aspect of Demo Mode is that login processing can (optionally) be skipped, the user automatically logged in as guest, and the Online Medley session started with no user interaction required.   Alternatively,  the login process can remain but the standard "Run Medley" page will be skipped and the user will go directly from login to the running Medley without having to set all the run parameters in the Run Medley page.  Automatic guest login is sufficient for most demos.  But requiring login allows demos to save files and context between runs of Online Medley, which is not possible with guest login.

## Demo mode URLs
To access Demo mode, use the following URLs:

```https://online.interlisp.og/demo?start=\<START-SCRIPT>``` for automatic guest login.
```https://online.interlisp.og/demo/login?start=\<START-SCRIPT>``` to require logins

```<START-SCRIPT>``` is a URL pointing to a start-script lisp file that can be wget'd by the OIO server.  **This URL must be encoded using the equivalent of Javascript's *encodeURIComponent*.**  The easiest way to do this is via one of the many websites that offer this service such as https://meyerweb.com/eric/tools/dencoder/.

In addition to the *start* query parameter, Demo mode supports the *notecards=1* and *rooms=1* query parameters.  If these query parameters are included in the Demo mode URL, then NoteCards and/or Rooms will be automatically started when Online Medley runs, in addition to the start-script.

Any of the query parameters (start, notecards, rooms) can be left off, with the expected change of function.  For example, https://online.interlisp.org/demo?notecards=1 will automatically login as guest and start notecards - but not run any start script.

Example Demo mode URL:  https://online.interlisp.org/demo?start=https%3A%2F%2Fgithub.com%2FInterlisp%2Fonline%2Fraw%2Frefs%2Fheads%2Ffgh_museum-mode%2Fstart-scripts%2FSTART-INSPHEX.LCOM&notecards=1.  This URL will automatically login as guest, wget and LOAD the file START-INSPHEX.LCOM from the Interlisp/Online repo on github and start Notecards.

## Start scripts

Any LOADable Lisp file (source or compiled, Interlisp or Medley CommonLisp) can serve as a start script.

Sample start scripts can be found in the Interlisp/Online Github repo in the start-scripts directory.

Most demos will require Lisp (or other) files that are not included in the standard Online Medley image.  One very handy function to be used in start scripts for these demos is ```(ShellWget URL OUTFILE)```.   This function will download (using wget) the file specified by URL and store it in the versioned Online Medley file system under the name OUTFILE.  OUTFILE can then be LOADed by the start script.

Below is the start script for a demo of Pamoroso's INSPHEX utility  The start script defines and then runs a function called START-INSPHEX.  The START-INPHEX function in turn uses ShellWget to download the source code to INSPHEX from Github, compiles it, loads the compiled file and then uses ADD.PROCESS to run the main HEXDUMP function.  There is some additional complication in the call to ADD.PROCESS to ensure that packages are handled correctly.  But most existing Interlisp demos will not need this complexity since they don't use packages.

```
(DEFINE-FILE-INFO ^^PACKAGE "INTERLISP" ^^READTABLE "INTERLISP" ^^BASE 10)

(FILECREATED "16-Nov-2025 21:15:14" {DSK}<home>frank>il>START-INSPHEX.;1 1641)

(PRETTYCOMPRINT START-INSPHEXCOMS)

(RPAQQ START-INSPHEXCOMS ((FNS START-INSPHEX)
                          (P (START-INSPHEX))))
(DEFINEQ

(START-INSPHEX
  [LAMBDA NIL                                               
    (LET* ((INSPHEX.FILE (OUTFILEP "{CORE}INSPHEX"))
           INSPHEX.DFASL)
          (ShellWget "https://raw.githubusercontent.com/pamoroso/insphex/refs/heads/main/INSPHEX"
                 INSPHEX.FILE)
          (SETQ INSPHEX.DFASL (CL:COMPILE-FILE INSPHEX.FILE))
          (LOAD INSPHEX.DFASL)
          (ADD.PROCESS (LIST (CL:FIND-SYMBOL "HEXDUMP" "INSPHEX")
                             (KWOTE INSPHEX.DFASL)
                             '(CREATEW (CREATEREGION (FIX (TIMES 0.35 SCREENWIDTH))
                                              (FIX (TIMES 0.25 SCREENHEIGHT))
                                              (FIX (TIMES 0.5 SCREENWIDTH))
                                              (FIX (TIMES 0.5 SCREENHEIGHT])
)
(START-INSPHEX)
STOP

```

## Start scripts outside of Demo mode

Start scripts can also be used outside of Demo mode.  In the normal OIO workflow, the user will be taken to the "Run Medley" page.  On the Run Medley page, if you enable *Show advanced options* there will be a field into which you can enter the URL for a start-script (in either original or URI encoded forms).   When Online Medley starts up, the specified start script will be wget'd and LOADed as in Demo mode.

Additionally, if a ```start=<encoded start-script URL>``` query parameter is included in the URL used to access OIO (outside of Demo mode), then the specified URL (decoded) will be prepopulated into the Advanced Options/Start URL field on the Run Medley page.

## Synonyms for *https::online.interlisp.org/demo*

For legacy reasons,  ```https:://online.interlisp.org/demo/guest``` and ```https:://online.interlisp.org/guest``` are synonyms for ```https::online.interlisp.org/demo```.

<!--stackedit_data:
eyJoaXN0b3J5IjpbODM4MzE2NTEzLDIxNTAzNzAxMCwxNzE0MT
E2OTc0XX0=
-->