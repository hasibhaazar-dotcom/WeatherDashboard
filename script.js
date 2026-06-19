const currentWeather = document.getElementById("currentWeather");
const forecastGrid = document.getElementById("forecastGrid");
const loader = document.getElementById("loader");
const canvas = document.getElementById("tempChart");
const ctx = canvas.getContext("2d");

const icons = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    61: "🌧️",
    63: "🌦️",
    65: "🌧️",
    71: "❄️",
    80: "🌦️",
    95: "⛈️"
};

function getIcon(code) {
    return icons[code] || "☁️";
}

function showLoader(status) {
    loader.style.display = status ? "block" : "none";
}

async function getCityCoords(city) {
    const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
    );
    const data = await res.json();
    return data.results[0];
}

async function fetchWeather(lat, lon, cityName) {
    showLoader(true);

    const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7`
    );

    const data = await res.json();

    showLoader(false);

    displayCurrent(data.current, cityName);
    displayForecast(data.daily);
    drawChart(data.hourly.temperature_2m.slice(0, 24));
}

function displayCurrent(current, city) {
    currentWeather.innerHTML = `
        <div class="weather-left">
            <div class="weather-icon">${getIcon(current.weather_code)}</div>
            <div class="weather-info">
                <h1>${city}</h1>
                <p>${current.temperature_2m}°C</p>
            </div>
        </div>

        <div class="weather-stats">
            <div class="stat-card">
                <h3>${current.temperature_2m}°</h3>
                <p>Temp</p>
            </div>

            <div class="stat-card">
                <h3>${current.wind_speed_10m}</h3>
                <p>Wind</p>
            </div>

            <div class="stat-card">
                <h3>${current.relative_humidity_2m}%</h3>
                <p>Humidity</p>
            </div>
        </div>
    `;
}

function displayForecast(daily) {
    forecastGrid.innerHTML = "";

    for (let i = 0; i < 7; i++) {
        const card = document.createElement("div");
        card.classList.add("forecast-card");

        card.innerHTML = `
            <h4>${new Date(daily.time[i]).toLocaleDateString("en-US", {weekday: "short"})}</h4>
            <div class="forecast-icon">${getIcon(daily.weather_code[i])}</div>
            <p>${daily.temperature_2m_max[i]}° / ${daily.temperature_2m_min[i]}°</p>
            <p>💧 ${daily.precipitation_probability_max[i]}%</p>
        `;

        forecastGrid.appendChild(card);
    }
}

function drawChart(temps) {
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const max = Math.max(...temps);
    const min = Math.min(...temps);
    const stepX = canvas.width / (temps.length - 1);

    ctx.beginPath();
    ctx.strokeStyle = "#4d8fff";
    ctx.lineWidth = 3;

    temps.forEach((temp, i) => {
        const x = i * stepX;
        const y = canvas.height - ((temp - min) / (max - min)) * 220 - 30;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();
}

async function searchCity(city) {
    const location = await getCityCoords(city);
    fetchWeather(location.latitude, location.longitude, location.name);
}

document.getElementById("searchBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value;
    searchCity(city);
});

navigator.geolocation.getCurrentPosition(
    pos => {
        fetchWeather(
            pos.coords.latitude,
            pos.coords.longitude,
            "Your Location"
        );
    },
    () => {
        searchCity("Mumbai");
    }
);
