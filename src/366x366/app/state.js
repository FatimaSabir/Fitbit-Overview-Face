import { display } from "display";
import { battery as powerBattery } from "power";
import { charger as powerCharger } from "power";
import { BodyPresenceSensor } from "body-presence";
import { HeartRateSensor } from "heart-rate";
import clock from "clock";

import * as bm from "./bm.js";
import * as date from "./date.js";
import * as battery from "./battery.js";
import * as time from "./time.js";
import * as hr from "./hr.js";
import * as activity from "./activity.js";
import * as weather from "./weather.js";
import * as connectivity from "./connectivity.js";

const hrm = new HeartRateSensor();
const body = new BodyPresenceSensor();
let backgroundRefreshInterval = setInterval(reApplyStateBackground, 300000); //5 minutes

clock.granularity = "seconds";

body.start();

if (body.present) {
  hrm.start();
  hr.newHrm(0);
  hr.setMonitoring(true);
}

display.onchange = (evt) => {
  reApplyState();
};

body.onreading = (evt) => {
  if (body.present) {
    hrm.start();
    hr.newHrm(0);
    hr.setMonitoring(true);
  } else {
    hrm.stop();
    hr.setMonitoring(false);
  }

  reApplyState();
};

clock.ontick = (evt) => {
  time.drawTime(evt.date);
  date.drawDate(evt.date);
  reApplyState();
};

powerBattery.onchange = (evt) => {
  reApplyState();
};

powerCharger.onchange = (evt) => {
  reApplyState();
};

hrm.onreading = (evt) => {
  hr.newHrm(hrm.heartRate);
};

export function reApplyState() {
  try {
    battery.drawBat();
    hr.drawHrm();
    activity.drawAllProgress();
    bm.drawBMR();
    bm.drawBMI();
    connectivity.drawState();
    reApplyStateBackground();
  } catch (e) {
    //Do Nothing
  }
}

export function reApplyStateBackground() {
  try {
    weather.fetchWeather();
  } catch (e) {
    //Do Nothing
  }
}
