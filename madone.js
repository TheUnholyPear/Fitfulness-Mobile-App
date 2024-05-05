/*jshint globalstrict: true*/
'use strict';

let timePara;
let distancePara;
let pacePara;
let prevElement;

let timeStart;
let watchId;

let totalDistance = 0;
let initialPosition;
let currentPosition;

//incline handling:
const inclineHandler = function () {

    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", deviceOrientation);
    }else{
        document.getElementById("show-incline").innerText = "Incline not supported";
    }


    setTimeout(function () {
        window.removeEventListener("deviceorientation", deviceOrientation);
        document.getElementById("show-incline").innerText = "◬ Tap to show incline ◬";
    }, 30000);
};

const deviceOrientation = function(event){
    const beta = event.beta;
    let hill;

    if(beta < 0){
        hill = "downhill";
    }else{
        hill = "uphill";
    }

    let percentageOf45Degrees = Math.abs(Math.tan(beta * (Math.PI / 180)) * 100);

    if(beta <= 45 && beta >= -45) {
        document.getElementById("show-incline").innerHTML = "◬ Incline: " + Math.round(percentageOf45Degrees) + "% " + hill + " (" + ((Math.round(beta)<0?"-":"")+(Math.abs(Math.round(beta)))) + "°) ◬";
    }else{
        document.getElementById("show-incline").innerHTML = "◬ Incline: hill is too steep "+ hill +" ◬";
    }
};

//location and tracking:
const startButtonHandler = function () {
    const button = document.getElementById("bStart");
    if (button.innerText === "start") {
        button.style.background = "grey";
        button.style.color = "#FF0000";
        button.style.border = "0.075rem solid #FF0000";
        button.innerText = "stop";

        console.log("button = stop");
        getLocation();

    } else {
        button.style.background = "linear-gradient(to right, #138575FF 0%, #1E80CBFF 50%, #8664E8FF 100%)";
        button.style.color = "#fff";
        button.style.border = "0.075rem solid #007c89";

        console.log("button = start");
        button.innerText = "start";
        getLocation();
    }
};

const getLocation = function()  {
    const button = document.getElementById("bStart");

    if (button.innerText === "stop") {
        if (navigator.geolocation) {
            timeStart = Date.now();
            console.log("watching location");
            document.getElementById("average-pace").innerText = "not traveled any distance";
                watchId = navigator.geolocation.watchPosition(logPosition, geolocationError, {enableHighAccuracy: true});
        } else {
            document.getElementById("average-pace").innerText = "Geolocation not supported";
        }
    } else{
        navigator.geolocation.clearWatch(watchId);
        console.log("stopping watching location");
        document.getElementById("live-distance").innerText = "";
        document.getElementById("average-pace").innerText = "";
        totalDistance = 0;
        initialPosition = null;
        currentPosition = null;
    }
};

const geolocationError = function (error) {
    console.error("Geolocation error:", error.message);
};

const logPosition = function(position) {
    if (!initialPosition) {
        initialPosition = position;
        console.log("Initial position stored:", initialPosition);
    }else{
        initialPosition = currentPosition;
    }
    currentPosition = position;

    const distanceInMeters = distanceCalc(initialPosition, currentPosition) * 1000;
    totalDistance = totalDistance + distanceInMeters;
    const timeInMinutes = (Date.now() - timeStart) / 60000;

    console.log(Math.round(totalDistance) + "m" + " " + Math.round(timeInMinutes * 60) + "s");

    if (totalDistance >= 1 && Math.round(timeInMinutes * 60) >= 1 )  {
        document.getElementById("live-distance").innerHTML = Math.round(totalDistance) + "m";
        document.getElementById("average-pace").innerText = Math.round(timeInMinutes / (totalDistance / 1000)) + " mins/km";
    }else{
        document.getElementById("average-pace").innerText = "Not traveled any distance";
    }
};

const distanceCalc = function(p1, p2)  {
    const lat1 = p1.coords.latitude;
    const lon1 = p1.coords.longitude;
    const lat2 = p2.coords.latitude;
    const lon2 = p2.coords.longitude;

    const R = 6371;

    const x1 = lat2 - lat1;
    const dLat = (x1 * Math.PI) / 180;
    const x2 = lon2 - lon1;
    const dLon = (x2 * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1* Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// num pad and calculations
const buttonClickHandler = function(evt){
    if (evt.target.tagName === "BUTTON") {
        let prev = document.getElementById(prevElement);

        if (evt.target.id === "bC") {
            prev.innerText = "0|";
        }else if(evt.target.id === "blArrow"){
            if(prev.innerText.length > 2) {
                prev.innerText = prev.innerText.slice(0,(prev.innerText.length - 2));
                selectClickHandler({target: prev});
            }else{
                prev.innerText = "0|";
            }
        }else{
            if(prev.innerText === "0|"){
                prev.innerText = prev.innerText.replace("0|", evt.target.innerText + "|");
            }else if(prev.innerText.length < 6 && prevElement === "distance"){
                prev.innerText = prev.innerText.replace("|", evt.target.innerText + "|");
            }else if(prev.innerText.length < 4 && prevElement === "time"){
                prev.innerText = prev.innerText.replace("|", evt.target.innerText + "|");
            }
        }
        calcMns(timePara.innerText, distancePara.innerText);
    }
    console.log(evt.target.innerText);
};

const selectClickHandler = function(evt) {
    const prev = document.getElementById(prevElement);

    if (prevElement !== undefined) {
        prev.innerText = prev.innerText.replace("|", "");
        prev.style.color = "black";
        prev.style.textDecoration = "none";
    }

    evt.target.innerText += "|";
    evt.target.style.textDecoration = "underline #007c89";
    evt.target.style.color = "#FF0000";
    prevElement = evt.target.id;
};

const localStore = function(){
    const time = document.getElementById("time").innerText.replace("|","");
    const distance = document.getElementById("distance").innerText.replace("|","");

    localStorage.setItem("time",time);
    localStorage.setItem("distance",distance);
};

const calcMns = function (time, distance){
    time = time.replace("|", "");
    distance = distance.replace("|", "");
    const timeNum = parseInt(time);
    const distanceNum = parseInt(distance);

    if (distanceNum >= 10 && timeNum >= 5){
        let result = Math.round((1000/(distanceNum/timeNum))) + " mins/km";
        pacePara.innerText = result;
        localStorage.setItem("pace",result);
    }else{
        localStorage.setItem("pace","---");
        pacePara.innerText = "---";
    }
    localStore();
};


//initializer
const initializer = function() {
    timePara = document.getElementById("time");
    distancePara = document.getElementById("distance");
    pacePara = document.getElementById("pace");

    if (localStorage.getItem("time") && localStorage.getItem("distance") && localStorage.getItem("pace")) {
        console.log("Found localstorage");

        distancePara.innerText = localStorage.getItem("distance");
        timePara.innerText = localStorage.getItem("time");
        pacePara.innerText = localStorage.getItem("pace");
    } else {
        console.log("Not found localstorage");

        distancePara.innerText = "0";
        timePara.innerText = "0";
        pacePara.innerText = "--";
    }

    console.log("distance = " + distancePara.innerText);
    console.log("time = " + timePara.innerText);
    console.log("pace = " + pacePara);

    //keypad and select
    selectClickHandler({target: distancePara});

    distancePara.addEventListener("click", selectClickHandler);
    timePara.addEventListener("click", selectClickHandler);
    document.getElementById("keypad").addEventListener("click", buttonClickHandler);

    //track location
    document.getElementById("bStart").addEventListener("click", startButtonHandler);

    //touch incline and timeout
    document.getElementById("show-incline").addEventListener("click", inclineHandler);

};
window.addEventListener("pageshow", initializer);



