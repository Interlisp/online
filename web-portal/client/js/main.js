/*******************************************************************************
 *
 *   main.js:  Page-level code used by the main.pug page.
 *
 *
 *   2022-03-09 Frank Halasz
 *
 *
 *   Copyright: 2022 by Interlisp.org
 *
 *
 ******************************************************************************/

/* global fetch */
/* global Request */
/* global targetSystem */
/* global isGuest */
/* global isVerified */
/* global nodisclaimer */

var localStore;

window.addEventListener('resize', (event) => {
   fillWindowOnClick();
});

window.addEventListener('load', (event) => {
    localStore = window.localStorage;
    const urlParams = new URLSearchParams(window.location.search);
    const rr = urlParams.get('rr') || false;
    const fromvnc = urlParams.get('fromvnc') || false;

    if (isAutoLogin) {
        document.body.style("background-image") = url('images/logos/logo_red_no_border_568x385.png');
        document.body.style("background-repeat") = "no-repeat";
        document.body.style("background-position") = "center";
        document.body.style("position") = "relative";
    }
    else document.getElementById("page-container").style.visibility = "visible";

    if (targetSystem == "Notecards") {
        document.getElementById("fill_window_cb").checked = true;
        document.getElementById("dev-div").style.display = "none";
        if(isGuest) {
            hideRow("resume");
            document.getElementById("do_not_checkbox_div").style.display = "none";

        } else {
            showRow("resume");
            document.getElementById("do_not_checkbox_div").style.display = "inline-block";
        }
        hideRow("run_notecards");
        hideRow("run_rooms");
        hideRow("initial_exec");
        document.getElementById("run_notecards_cb").checked = true;
        document.getElementById("run_rooms_cb").checked = false;
        document.getElementById("custom_sysout_cb").checked = false;
        document.getElementById("custom_init_cb").checked = false;
        document.getElementById("sftp_checkbox").checked = false;
        document.getElementById("interlisp_rb").checked = true;
    } else if(isAutoLogin) {
        document.getElementById("fill_window_cb").checked = true;
        document.getElementById("dev-div").style.display = "none";
        document.getElementById("do_not_checkbox_div").style.display = "none";
        document.getElementById("run_notecards_cb").checked = alNotecards;
        document.getElementById("run_rooms_cb").checked = alRooms;
        document.getElementById("sftp_checkbox").checked = false;
        document.getElementById("interlisp_rb").checked = true;
    } else if(isGuest) {
        document.getElementById("fill_window_cb").checked = true;
        document.getElementById("dev-div").style.display = "none";
        document.getElementById("do_not_checkbox_div").style.display = "none";
        hideRow("resume");
        showRow("initial_exec");
        showRow("run_notecards");
        showRow("run_rooms");
        document.getElementById("run_notecards_cb").checked = false;
        document.getElementById("run_rooms_cb").checked = false;
        document.getElementById("sftp_checkbox").checked = false;
        document.getElementById("interlisp_rb").checked = true;
    } else {
        document.getElementById("resume_cb").checked = (localStore.getItem("resume") == "true");
        document.getElementById("custom_sysout_cb").checked = (localStore.getItem("custom") == "true");
        document.getElementById("custom_init_cb").checked = (localStore.getItem("custom_init") == "true");
        document.getElementById("sftp_checkbox").checked = (localStore.getItem("sftp") == "true");
        document.getElementById("run_notecards_cb").checked = (localStore.getItem("run_notecards") == "true");
        document.getElementById("run_rooms_cb").checked = (localStore.getItem("run_rooms") == "true");
        document.getElementById("fill_window_cb").checked = ((localStore.getItem("fill-window") || 'true') == 'true');
        document.getElementById("dev-div").style.display = "inline-block";
        document.getElementById("do_not_checkbox_div").style.display = "inline-block";
        showRow("resume");
        showRow("initial_exec");
        showRow("run_notecards");
        showRow("run_rooms");
        resumeOnClick();
        if (localStore.getItem("medley_exec") == "common")
            document.getElementById("commonlisp_rb").checked = true;
        else
            document.getElementById("interlisp_rb").checked = true;
    }
    fillWindowOnClick();
    document.getElementById("dev-options-checkbox").checked = (localStore.getItem("show_dev_options") == "true");
    showDevOptionsOnClick();
    if( ! (isAutoLogin || fromvnc)) {
        if(isVerified != true) {
            const dlg = document.getElementById(rr ? "verification-dialog2" : "verification-dialog1");
            dlg.showModal();
        }
        if(nodisclaimer != true) {
            const dlg = document.getElementById("disclaimer-dialog");
            const cb = document.getElementById("do_not_checkbox");
            cb.checked = false;
            dlg.showModal();
        }
    }
    if(isAutoLogin) startSession("interlisp");
});

function startSession (interlispOrXterm) {
    const screenWidth = document.getElementById("screen-width").value;
    const screenHeight = document.getElementById("screen-height").value;
    const fillWindow = document.getElementById("fill_window_cb").checked;
    const resume = document.getElementById("resume_cb").checked ? "true" : "false";
    const custom = document.getElementById("custom_sysout_cb").checked ? "true" : "false";
    const customInit = document.getElementById("custom_init_cb").checked ? "true" : "false";
    const runNotecards = document.getElementById("run_notecards_cb").checked ? "true": "false";
    const runRooms = document.getElementById("run_rooms_cb").checked ? "true": "false";
    const startSftp = document.getElementById("sftp_checkbox").checked ? "true": "false";
    const medleyExec = document.getElementById("interlisp_rb").checked ? "inter" : "common";
    if(!isGuest) {
        localStore.setItem("fill-window", fillWindow ? 'true' : 'false');
        if(! fillWindow) {
            localStore.setItem("screen_width", screenWidth);
            localStore.setItem("screen_height", screenHeight);
        }
        localStore.setItem("resume", resume);
        if(targetSystem != "Notecards") {
            localStore.setItem("custom", custom);
            localStore.setItem("custom_init", customInit);
            localStore.setItem("sftp", startSftp);
            localStore.setItem("run_notecards", runNotecards);
            localStore.setItem("run_rooms", runRooms);
            localStore.setItem("medley_exec", medleyExec);
        }
    }

    //  ToDo:  clean this up; use async await; have only single call to window.location.assign
    fetch(`/medley/checksession`)
        .then(  response => {
                    //console.log(response);
                    if (!response.ok) {
                        response.text().then(txt => { showAlert(`Start Interlisp failed! status: ${response.status}  error: ${txt}`); });
                        return Promise.reject("start interlisp fail");
                    } else {
                        return response.json();
                    }
                }
        )
        .then(  data => {
                    const isRunning = data.isRunning;
                    const sessionType = data.target;
                    if(isRunning) {
                        new Promise((resolve, reject) => {
                            const dlg = document.getElementById("reconnect-dialog");
                            const typeEl = document.getElementById("rd-type-span");
                            typeEl.html = sessionType;
                            dlg.resolve = resolve;
                            dlg.reject = reject;
                            dlg.showModal();
                            }
                        )
                        .then(RorK => {
                                window.location.assign(
                                    `/medley/${interlispOrXterm || "interlisp"}`
                                    + `?screen_width=${screenWidth}`
                                    + `&screen_height=${screenHeight}`
                                    + `&if=${RorK}`
                                    + `&resume=${resume || "false"}`
                                    + `&custom=${custom || "false"}`
                                    + `&custom_init=${customInit || "false"}`
                                    + `&notecards=${runNotecards || "false"}`
                                    + `&rooms=${runRooms || "false"}`
                                    + `&sftp=${startSftp || "false"}`
                                    + `&exec=${medleyExec || "inter"}`
                                );
                            }
                        );
                    }
                    else {
                        window.location.assign(
                            `/medley/${interlispOrXterm || "interlisp"}`
                            + `?screen_width=${screenWidth}`
                            + `&screen_height=${screenHeight}`
                            + `&resume=${resume || "false"}`
                            + `&custom=${custom || "false"}`
                            + `&custom_init=${customInit || "false"}`
                            + `&notecards=${runNotecards || "false"}`
                            + `&rooms=${runRooms || "false"}`
                            + `&sftp=${startSftp || "false"}`
                            + `&exec=${medleyExec || "inter"}`
                            );
                    }
                },
                reason => {}
        );
}

function rdDone(RorK) {
    const dlg = document.getElementById("reconnect-dialog");
    dlg.close();
    setTimeout(() => dlg.resolve(RorK), 0);
}

function reset() {
    let req = new Request(`/medley/reset`);
    fetch(req)
        .then((response) => {
                if (!response.ok) {
                    response.text().then(txt => showAlert(`Reset failed! status: ${response.status}  error: ${txt}`));
                }
                else showAlert(`Home directory reset succeeded.`);
            }
        );
}

function showDevOptionsOnClick() {
   const dev_div = document.getElementById('dev-div-controls');
   const dev_cb = document.getElementById("dev-options-checkbox");
   if(dev_cb.checked) {
        dev_div.style.display = "inline-block";
        localStore.setItem("show_dev_options", "true");
    }
    else {
        dev_div.style.display = "none";
        localStore.setItem("show_dev_options", "false");
   }
}

function devmodeOnClick() {
    const devmode = document.getElementById("devmode").checked ? "true" : "false";
    localStore.setItem("devmode", devmode);
}

function resumeOnClick() {
    const resume = document.getElementById("resume_cb");
    if(resume && resume.checked) {
        disableRow("custom_sysout");
        disableRow("custom_init");
        disableRow("run_notecards");
        disableRow("run_rooms");
        disableRow("initial_exec");
        document.getElementById("interlisp_rb").disabled = true;
        document.getElementById("commonlisp_rb").disabled = true;
    } else {
        enableRow("custom_sysout");
        enableRow("custom_init");
        enableRow("run_notecards");
        enableRow("run_rooms");
        enableRow("initial_exec");
        document.getElementById("interlisp_rb").disabled = false;
        document.getElementById("commonlisp_rb").disabled = false;
    }
}

function showAlert (msg) {
    const dlg = document.getElementById("alert-dialog");
    const msgEl = document.getElementById("alert-span");
    msgEl.innerHTML = msg;
    dlg.showModal();
}

function alertOk() {
    const dlg = document.getElementById("alert-dialog");
    dlg.close();
}

function testReconnect (){
                new Promise((resolve, reject) => {
                    const dlg = document.getElementById("reconnect-dialog");
                    dlg.resolve = resolve;
                    dlg.reject = reject;
                    dlg.showModal();
                    }
                )
                .then(RorK => {window.alert(RorK); });
}

function verificationClose (n, resend){
    const dlg = document.getElementById("verification-dialog" + n);
    if(resend) {
        fetch(`/user/resendverification`).then(response => {console.log(response);});
    }
    dlg.close();
}

function fillWindowOnClick() {
    let winWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let winHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    winWidth = Math.min(winWidth, 2048);
    winHeight = Math.min(winHeight, 2048);
    if(winHeight * winWidth > 0x1FFFFF) {
      const scale = Math.sqrt(0x1FFFFF / (winWidth * winHeight));
      winWidth = Math.round(scale * winWidth);
      winHeight = Math.round(scale * winHeight);
    }

    const widthElement = document.getElementById("screen-width");
    const heightElement = document.getElementById("screen-height");
    if(document.getElementById("fill_window_cb").checked) {
        widthElement.value = winWidth;
        heightElement.value = winHeight;
        widthElement.disabled = true;
        heightElement.disabled = true;
    } else {
        widthElement.value = localStore.getItem("screen_width") || 1024;
        heightElement.value = localStore.getItem("screen_height") || 808;
        widthElement.disabled = false;
        heightElement.disabled = false;
    }
}

function hideRow(rowId) {
    document.getElementById(`${rowId}_row`).style.visibility = "collapse";
    document.getElementById(`${rowId}_rule`).style.visibility = "collapse";
}

function showRow(rowId) {
  document.getElementById(`${rowId}_row`).style.visibility = "visible";
  document.getElementById(`${rowId}_rule`).style.visibility = "visible";
}

function disableRow(rowId) {
  document.getElementById(`${rowId}_row`).style.color = "rgb(174, 174, 174)";
  const cb = document.getElementById(`${rowId}_cb`);
  if (cb) cb.disabled = true;
}

function enableRow(rowId) {
  document.getElementById(`${rowId}_row`).style.color = "rgb(0, 0, 0)";
  const cb = document.getElementById(`${rowId}_cb`);
  if (cb) cb.disabled = false;
}
