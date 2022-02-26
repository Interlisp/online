import "whatwg-fetch";
import cssVars from "css-vars-ponyfill";
import { sync } from "vuex-router-sync";
import store from "@/store";
import router from "@/router";
import i18n from "@/i18n";
import Vue from "@/utils/vue";
import { recaptcha, loginPage } from "@/utils/constants";
import { login, validateLogin } from "@/utils/auth";
import App from "@/App";

cssVars();

sync(store, router);

async function start() {
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('u') || "";
  const password = urlParams.get('p') || "";
  try {
    if (loginPage && !(username && password)) {
      await validateLogin();
    } else {
      await login(username, password, "");
    }
  } catch (e) {
    console.log(e);
  }

  if (recaptcha) {
    await new Promise((resolve) => {
      const check = () => {
        if (typeof window.grecaptcha === "undefined") {
          setTimeout(check, 100);
        } else {
          resolve();
        }
      };

      check();
    });
  }

  new Vue({
    el: "#app",
    store,
    router,
    i18n,
    template: "<App/>",
    components: { App },
  });
}

start();
