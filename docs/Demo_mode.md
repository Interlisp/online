---


---

<h1 id="online.interlisp.org-demo-mode-aka-museum-mode"><a href="http://Online.Interlisp.Org">Online.Interlisp.Org</a>: Demo mode (aka Museum Mode)</h1>
<h2 id="overview">Overview</h2>
<p>When accessing <a href="http://online.interlisp.org">online.interlisp.org</a> (OIO) using Demo Mode,  Online Medley will start up and at the end of processing the ONLINE-INIT file will automatically LOAD a lisp file (source or compiled, Interlisp or Medley CommonLisp) that was specified in the URL through which OIO was accessed.  This lisp file is referred to as a <em>start-script</em> and the intention is that when it is LOADed it will run a demo by defining and/or LOADing additional lisp code and then starting up that demo, e.g., via a P file package command.  Before the Online Medley run is started, the start-script file is downloaded using <code>wget</code>into a known file in the Medley file system from where it is LOADed by ONLINE-INIT.</p>
<p>An addition aspect of Demo Mode is that based on flags in the URL login processing can be skipped, the user automatically logged in as guest, and the Online Medley session started with no user interaction required.   Alternatively,  the login process can remain but the standard “Run Medley” page will be skipped and the user will go directly from login to the running Medley without having to set all the run parameters in the Run Medley page.  Automatic guest login is sufficient for most demos.  But requiring login allows demos to save files and context between runs of Online Medley, which is not possible with guest login.</p>
<h2 id="demo-mode-urls">Demo mode URLs</h2>
<p>To access Demo mode, use the following URLs:</p>
<p><code>https://online.interlisp.og/demo?start=\&lt;START-SCRIPT&gt;</code> for automatic guest login.<br>
<code>https://online.interlisp.og/demo/login?start=\&lt;START-SCRIPT&gt;</code> to require logins</p>
<p><code>&lt;START-SCRIPT&gt;</code> is a URL pointing to a start-script lisp file that can be wget’d by the OIO server.  <strong>This URL must be encoded using the equivalent of Javascript’s <em>encodeURIComponent</em>.</strong>  The easiest way to do this is via one of the many websites that offer this service such as <a href="https://meyerweb.com/eric/tools/dencoder/">https://meyerweb.com/eric/tools/dencoder/</a>.</p>
<p>In addition to the <em>start</em> query parameter, Demo mode supports the <em>notecards=1</em> and <em>rooms=1</em> query parameters.  If these query parameters are included in the Demo mode URL, then NoteCards (and/or Rooms) will be automatically started when Online Medley runs, in addition to the start-script.</p>
<p>Any of the query parameters (start, notecards, rooms) can be left off, with the expected change of function.  For example, <a href="https://online.interlisp.org/demo?notecards=1">https://online.interlisp.org/demo?notecards=1</a> will automatically login as guest and start notecards - but not run any start-script.</p>
<p>Example Demo mode URL:  <a href="https://online.interlisp.org/demo?start=https%3A%2F%2Fgithub.com%2FInterlisp%2Fonline%2Fraw%2Frefs%2Fheads%2Ffgh_museum-mode%2Fstart-scripts%2FSTART-INSPHEX.LCOM&amp;notecards=1">https://online.interlisp.org/demo?start=https%3A%2F%2Fgithub.com%2FInterlisp%2Fonline%2Fraw%2Frefs%2Fheads%2Ffgh_museum-mode%2Fstart-scripts%2FSTART-INSPHEX.LCOM&amp;notecards=1</a>.  This URL will automatically login as guest, wget and LOAD the file START-INSPHEX.LCOM from the Interlisp/Online repo on github and start Notecards.</p>
<h2 id="start-scripts">Start scripts</h2>
<p>Sample start scripts can be found in the Interlisp/Online Github repo in the start-scripts directory.</p>
<p>Most demos will require Lisp (or other) files that are not included in the standard Online Medley image.  One very handy function to be used in start-scripts for these demos is <code>(ShellWget URL OUTFILE)</code>.   This function will download (using wget) the file specified by URL and store it in the versioned Online Medley file system under the name OUTFILE.  OUTFILE can then be LOADed in the start-script.</p>
<p>Below is the start-script for a demo of INSPHEX.  The start-script defines and then runs a function called START-INSPHEX.  START-INPHEX in turn uses ShellWget to download the source code to INSPHEX from Github, compiles it, loads the compiled file and then uses ADD.PROCESS to run the main HEXDUMP function.  There is some additional complication in the call to ADD.PROCESS to ensure that packages are handled correctly.  Most exisitng Interlisp demos will not need this complexity since they don’t use packages.</p>
<pre><code>
</code></pre>
<h2 id="start-scripts-outside-of-demo-mode">Start scripts outside of Demo mode</h2>
<p>Start scripts can also be used outside of Demo mode.  In the normal workflow, the user will be taken to the “Run Medley” page.  On the Run Medley page, if you enable <em>Show advanced options</em> there will be a field into which you can enter the URL for a start-script (in either original or URI encoded forms).   When Online Medley starts up, the specified start script will be download and LOADed as in Demo mode.</p>
<p>Additionally, if a <code>start=&lt;encoded start-script URL&gt;</code> query parameter is included in the URL used to access OIO (outside of Demo mode), then the specified URL (decoded) will be prepopulated into the Advanced Options/Start URL field on the Run Medley page.</p>
<blockquote>
<p>Written with <a href="https://stackedit.io/">StackEdit</a>.</p>
</blockquote>

