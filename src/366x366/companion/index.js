import { settingsStorage } from "settings";
import { localStorage } from "local-storage";
import { me as companion } from "companion";
import { device } from "peer";
import { weather, WeatherCondition } from "weather";

import { asap } from "./lib-fitbit-asap.js";

let lastWeatherUnit = null;

//Cancel all previous messages
asap.cancel();

//Wake every 15 minutes
console.log("Set companion wake interval to 15 minutes");
companion.wakeInterval = 900000;

// Monitor for significant changes in physical location
console.log("Enable monitoring of significant location changes");
companion.monitorSignificantLocationChanges = true;

asap.onmessage = (message) => {
  if (message.command === "send-settings") {
    sendSettingsWithDefaults();
  } else if (message.command === "ping") {
    sendPong();
  } else if (message.command === "weather") {
    sendWeather(message.unit);
  } else if (message.command === "initial-weather") {
    sendSavedWeather("weatherData");
    sendWeather(message.unit);
  }
};

// Listen for the significant location change event
companion.addEventListener("significantlocationchange", (evt) => {
  locationChange(false);
});

// Listen for the event
companion.addEventListener("wakeinterval", (evt) => {
  wokenUp(false);
});

// check launch reason
console.log(`Companion launch reason: ${JSON.stringify(companion.launchReasons)}`);
if (companion.launchReasons.locationChanged) {
  locationChange(true);
} else if (companion.launchReasons.wokenUp) {
  wokenUp(true);
}

sendSettingsWithDefaults();

// Settings have been changed
settingsStorage.addEventListener("change", (evt) => {
  sendSettingValue(evt.key, evt.newValue);
});

function sendSettingsWithDefaults() {
  console.log("Set Default Settings");
  setDefaultSettingOrSendExisting("distanceUnit", { values: [{ value: "auto", name: "Automatic (Use Fitbit Setting)" }], selected: [0] });
  setDefaultSettingOrSendExisting("dateFormat", { values: [{ value: "dd mmmm yyyy", name: "dd mmmm yyyy" }], selected: [11] });
  setDefaultSettingOrSendExisting("timeFormat", { values: [{ value: "auto", name: "Automatic (Use Fitbit Setting)" }], selected: [0] });
  setDefaultSettingOrSendExisting("showHeartRate", true);
  setDefaultSettingOrSendExisting("isHeartbeatAnimation", true);
  setDefaultSettingOrSendExisting("heartRateZoneVis", true);
  setDefaultSettingOrSendExisting("showTime", true);
  setDefaultSettingOrSendExisting("isAmPm", true);
  setDefaultSettingOrSendExisting("showSeconds", true);
  setDefaultSettingOrSendExisting("showLeadingZero", true);
  setDefaultSettingOrSendExisting("flashDots", true);
  setDefaultSettingOrSendExisting("showDate", true);
  setDefaultSettingOrSendExisting("showDay", true);
  setDefaultSettingOrSendExisting("StatsTL", { values: [{ value: "steps", name: "Steps" }], selected: [4] });
  setDefaultSettingOrSendExisting("StatsBL", { values: [{ value: "distance", name: "Distance" }], selected: [5] });
  setDefaultSettingOrSendExisting("StatsTM", { values: [{ value: "activeMinutes", name: "Active Zone Minutes" }], selected: [8] });
  setDefaultSettingOrSendExisting("StatsMM", { values: [{ value: "activeMinutesWeek", name: "Weekly Active Zone Minutes" }], selected: [9] });
  setDefaultSettingOrSendExisting("StatsBM", { values: [{ value: "WEATHER", name: "Weather" }], selected: [11] });
  setDefaultSettingOrSendExisting("StatsTR", { values: [{ value: "elevationGain", name: "Floors" }], selected: [6] });
  setDefaultSettingOrSendExisting("StatsBR", { values: [{ value: "calories", name: "Calories" }], selected: [7] });
  setDefaultSettingOrSendExisting("progressBars", { values: [{ value: "ring", name: "Ring" }], selected: [3] });
  setDefaultSettingOrSendExisting("showBatteryPercent", true);
  setDefaultSettingOrSendExisting("showBatteryBar", true);
  setDefaultSettingOrSendExisting("showPhoneStatus", false);
  setDefaultSettingOrSendExisting("torchEnabled", true);
  setDefaultSettingOrSendExisting("torchAutoOff", { values: [{ value: "15", name: "15 Seconds" }], selected: [4] });
  setDefaultSettingOrSendExisting("torchOverlay", true);
  setDefaultSettingOrSendExisting("timeColour", "white");
  setDefaultSettingOrSendExisting("dateColour", "white");
  setDefaultSettingOrSendExisting("stepsColour", "darkorange");
  setDefaultSettingOrSendExisting("distanceColour", "green");
  setDefaultSettingOrSendExisting("elevationGainColour", "darkviolet");
  setDefaultSettingOrSendExisting("caloriesColour", "deeppink");
  setDefaultSettingOrSendExisting("activeMinutesColour", "deepskyblue");
  setDefaultSettingOrSendExisting("activeMinutesWeekColour", "deepskyblue");
  setDefaultSettingOrSendExisting("batteryStatColour", "lime");
  setDefaultSettingOrSendExisting("heartColour", "crimson");
  setDefaultSettingOrSendExisting("heartRateColour", "white");
  setDefaultSettingOrSendExisting("bmColour", "gold");
  setDefaultSettingOrSendExisting("bmiColour", "gold");
  setDefaultSettingOrSendExisting("bmrColour", "gold");
  setDefaultSettingOrSendExisting("phoneStatusDisconnected", "red");
  setDefaultSettingOrSendExisting("phoneStatusConnected", "lime");
  setDefaultSettingOrSendExisting("progressBackgroundColour", "dimgray");
  setDefaultSettingOrSendExisting("batteryIcon0Colour", "red");
  setDefaultSettingOrSendExisting("batteryIcon25Colour", "darkorange");
  setDefaultSettingOrSendExisting("batteryIcon50Colour", "gold");
  setDefaultSettingOrSendExisting("batteryIcon75Colour", "lime");
  setDefaultSettingOrSendExisting("battery0Colour", "red");
  setDefaultSettingOrSendExisting("battery25Colour", "darkorange");
  setDefaultSettingOrSendExisting("battery50Colour", "gold");
  setDefaultSettingOrSendExisting("battery75Colour", "lime");
  setDefaultSettingOrSendExisting("batteryBackgroundColour", "dimgray");
  setDefaultSettingOrSendExisting("backgroundColour", "black");
  setDefaultSettingOrSendExisting("weatherColour", "tan");
  setDefaultSettingOrSendExisting("weatherRefreshInterval", { values: [{ value: "1800000", name: "30 minutes" }], selected: [2] });
  setDefaultSettingOrSendExisting("weatherTemperatureUnit", { values: [{ value: "auto", name: "Automatic (Use Fitbit Setting)" }], selected: [0] });
}

function setDefaultSettingOrSendExisting(key, value) {
  let existingValue = settingsStorage.getItem(key);
  if (existingValue == null) {
    setSetting(key, value);
  } else {
    console.log(`Companion Existing Setting - key:${key} existingValue:${existingValue}`);
    sendSettingValue(key, existingValue);
  }
}

function setSetting(key, value) {
  let jsonValue = JSON.stringify(value);
  console.log(`Companion Set - key:${key} val:${jsonValue}`);
  settingsStorage.setItem(key, jsonValue);
  sendSettingValue(key, jsonValue);
}

function sendSettingValue(key, val) {
  if (val) {
    var data = {
      dataType: "settingChange",
      key: key,
      value: JSON.parse(val),
    };

    console.log(`Queue Sending Setting - key:${data.key} val:${data.value}`);
    asap.send(data);
  } else {
    console.log(`value was null, not sending ${key}`);
  }
}

function sendWeather(unit) {
  let unitKey = "celsius";
  if (unit == "F") {
    unitKey = "fahrenheit";
  }
  lastWeatherUnit = unit;

  weather
    .getWeatherData({ temperatureUnit: unitKey })
    .then((data) => {
      if (data.locations.length > 0) {
        var sendData = {
          temperature: Math.floor(data.locations[0].currentWeather.temperature),
          unit: data.temperatureUnit,
          condition: findWeatherConditionName(WeatherCondition, data.locations[0].currentWeather.weatherCondition),
        };
        let jsonValue = JSON.stringify(sendData);
        localStorage.setItem("weather", jsonValue);
        sendSavedWeather("weatherUpdate");
      }
    })
    .catch((ex) => {
      console.error(ex.message);
      var sendData = {
        temperature: 0,
        unit: "celcius",
        condition: null,
      };
      let jsonValue = JSON.stringify(sendData);
      localStorage.setItem("weather", jsonValue);
      sendSavedWeather("weatherUpdate");
    });
}

function findWeatherConditionName(WeatherCondition, conditionCode) {
  for (const condition of Object.keys(WeatherCondition)) {
    if (conditionCode === WeatherCondition[condition]) return condition;
  }
}

function sendSavedWeather(dataType) {
  var savedWeather = localStorage.getItem("weather");
  if (savedWeather != null) {
    var savedData = JSON.parse(savedWeather);
    var sendData = {
      dataType: dataType,
      temperature: savedData.temperature,
      unit: savedData.unit,
      condition: savedData.condition,
    };
    asap.send(sendData);
  }
}

function sendPong() {
  var sendData = {
    dataType: "pong",
  };
  asap.send(sendData);
}

function locationChange(initial) {
  console.log(`LocationChangeEvent fired. - Initial: ${initial}`);
  if (lastWeatherUnit != null) {
    sendWeather(lastWeatherUnit);
  }
}

function wokenUp(initial) {
  console.log(`WakeEvent fired. - Initial: ${initial}`);
}
