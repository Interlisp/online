
# Online.Interlisp.Org: Demo mode (aka Museum Mode)
## Overview

When accessing online.interlisp.org (OIO) using Demo Mode,  Online Medley will start up and at the end of processing the ONLINE-INIT file will automatically LOAD a lisp file (source or compiled, Interlisp or Medley CommonLisp) that was specified in the URL through which OIO was accessed.  This lisp file is referred to as a *start-script* and the intention is that when it is LOADed it will run a demo by defining and/or LOADing additional lisp code and then starting up that demo, e.g., via a P file package command.  Before the Online Medley run is started, the start-script file is downloaded using ```wget```into a known file in the Medley file system from where it is LOADed by ONLINE-INIT. 

An addition aspect of Demo Mode is that based on flags in the URL login processing can be skipped, the user automatically logged in as guest, and the Online Medley session started with no user interaction required.   Alternatively,  the login process can remain but the standard "Run Medley" page will be skipped and the user will go directly from login to the running Medley without having to set all the run parameters in the Run Medley page.  Automatic guest login is sufficient for most demos.  But requiring login allows demos to save files and context between runs of Online Medley, which is not possible with guest login.

##Demo mode URLs
To access Demo mode, use the following URLs:

```https://online.interlisp.og/demo?start=\<START-SCRIPT>``` for automatic guest login.
```https://online.interlisp.og/demo/login?start=\<START-SCRIPT>``` to enable log





















> Written with [StackEdit](https://stackedit.io/).
<!--stackedit_data:
eyJoaXN0b3J5IjpbMTIxNDc3MzA2Nl19
-->