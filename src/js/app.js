const api_key = process.env.API_KEY;

class Station {
    constructor() {
        this.report = {};
    }

    fetch(...args) {
        let url = "";
        this.report = {};

        switch (args.length) {
            case 1:
                url = `https://api.waqi.info/feed/${args[0]}/?token=${api_key}`;
                break;
            case 2:
                url = `https://api.waqi.info/feed/geo:${args[0]};${args[1]}/?token=${api_key}`;
                break;
        }
        return fetch(url);
    }

    async fetchData(...args) {
        const response = await this.fetch(...args);

        let report = await response.json();

        if (this.checkError(report) === false) {
            report = report.data;
            this.setValues(report);

            return report;
        } else {
            return false;
        }
    }

    checkError(response) {
        let error = false;

        if (response.status === "ok") {
            console.log("Everything worked just fine.");
        } else {

            switch (response.data) {
                case "Over quota":
                    console.log("Quota limit reached.");
                    break;
                case "Invalid key":
                    console.log("Invalid API key.");
                    break;
                case "Unknown station":
                    alert("The station you entered is unknown, please enter another one.");
                    break;
            }

            error = true;
        }

        return error;
    }

    setValues(report) {
        for (let key in report) {
            switch (key) {
                case "city":
                    this.report[key] = report[key].name;
                    break;

                case "aqi":
                    this.report[key] = report[key];
                    break;
            }
            for (let index in report.iaqi) {
                switch (index) {
                    case "no2":
                    case "h":
                    case "t":
                        this.report[index] = report.iaqi[index].v;
                        break;
                    case "w":
                        this.report[index] = (report.iaqi[index].v / 1.6).toFixed(2); //mph to kmh
                        break;
                    case "p":
                        this.report[index] = (report.iaqi[index].v / 131).toFixed(2); //Torr to Pascal
                        break;
                }
            }
        }
    }

    domManipulation(city, spanList, verdictList, main, instructions) {
        if (this.report.city !== undefined) {
            instructions.style.display = "none";
            main.style.display = "block";

            city.textContent = this.report.city;

            for (let index = 0; index < spanList.length; index++) {
                switch (spanList[index].id) {
                    case "humidity":
                        spanList[index].textContent = this.report["h"];
                        break;

                    case "no2":
                        spanList[index].textContent = this.report["no2"];
                        break;

                    case "pressure":
                        spanList[index].textContent = this.report["p"];
                        break;

                    case "temperature":
                        spanList[index].textContent = this.report["t"];
                        break;

                    case "wind":
                        spanList[index].textContent = this.report["w"];
                        break;
                }
            }

            this.changeVerdict(verdictList, true);
        }
    }

    changeVerdict(verdicsts, control = false) {
        if (control === true) {
            let grade = "";

            if (this.report.aqi >= 0 && this.report.aqi <= 50) grade = "good";
            if (this.report.aqi >= 51 && this.report.aqi <= 100) grade = "moderate";
            if (this.report.aqi > 101) grade = "bad";

            verdicsts[0].textContent = verdicsts[1].alt = `${grade}`;
            verdicsts[1].src = `images/icon-pack/${grade}.svg`;
        } else return;
    }

    changeDOM() {
        this.domManipulation(cityName, spanValues, verdictList, mainSection, instructions);
        this.changeVerdict(verdictList);
    }
}

const station = new Station();

const mainSection = document.querySelector("main");
const instructions = document.querySelector(".instructions");
const infoBox = document.querySelector(".additional-info");
const discoverMoreBtn = document.querySelector(".know-more");
const form = document.querySelector("form");
const geoButton = document.querySelector(".geolocation-cta");

let cityName = document.querySelector("#city");
let spanValues = document.querySelectorAll(".result");
let verdictList = document.querySelectorAll(".verdict");


discoverMoreBtn.addEventListener("click", (event) => {
    if (infoBox.style.display === "block") {
        infoBox.style.display = "none";
        discoverMoreBtn.textContent = "discover more ▼";

    } else {
        infoBox.style.display = "block";
        discoverMoreBtn.textContent = "discover more ▲";
    }
});

document.addEventListener("DOMContentLoaded", (event) => form.txtCity.focus());

form.addEventListener("submit", (event) => {
    event.preventDefault();
    station.fetchData(form.txtCity.value)
        .then(report => {
                station.changeDOM();
            },
            reject => alert("Try to insert a valid station or geolocate yourself"));
    form.txtCity.value = "";
    form.txtCity.focus();
}, false);


geoButton.addEventListener("click", (event) => {
    navigator.geolocation.getCurrentPosition((position) => {
        station.fetchData(position.coords.latitude, position.coords.longitude)
            .then(report => {
                station.changeDOM();
            });
        form.txtCity.focus()
    });
});