
# Online.Interlisp.Org: Demo mode (aka Museum Mode)
## Overview

When accessing online.interlisp.org (OIO) using Demo Mode,  Online Medley will start up and at the end of processing the ONLINE-INIT file will automatically LOAD an lisp file (source or compiled, Interlisp or Medley CommonLisp) that was specified in the URL through which OIO was accessed.  This lisp file is referred to as a *start-script* and the intention is that when is is LOADed it will run a demo by defining and/or LOADing additional lisp code and then starting up that demo (e.g., via a P file package command in the start-script file).
> Written with [StackEdit](https://stackedit.io/).
<!--stackedit_data:
eyJoaXN0b3J5IjpbMTkzMTU2OTU3OV19
-->