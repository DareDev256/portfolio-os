import { el, fetchWithTimeout } from './dom-helpers.js';

/**
 * Weather Widget — Live weather display for Passion OS.
 * Uses Open-Meteo API (free, no key) + browser geolocation.
 */

const WMO_CODES = {
    0: ['Clear Sky', '☀️'], 1: ['Mostly Clear', '🌤'], 2: ['Partly Cloudy', '⛅'],
    3: ['Overcast', '☁️'], 45: ['Foggy', '🌫'], 48: ['Rime Fog', '🌫'],
    51: ['Light Drizzle', '🌦'], 53: ['Drizzle', '🌦'], 55: ['Dense Drizzle', '🌧'],
    61: ['Light Rain', '🌧'], 63: ['Rain', '🌧'], 65: ['Heavy Rain', '🌧'],
    71: ['Light Snow', '🌨'], 73: ['Snow', '❄️'], 75: ['Heavy Snow', '❄️'],
    80: ['Rain Showers', '🌦'], 81: ['Moderate Showers', '🌧'], 82: ['Violent Showers', '⛈'],
    85: ['Snow Showers', '🌨'], 86: ['Heavy Snow Showers', '❄️'],
    95: ['Thunderstorm', '⛈'], 96: ['Hail Storm', '⛈'], 99: ['Severe Hail', '⛈'],
};

function describeWMO(code) {
    return WMO_CODES[code] || ['Unknown', '🌡'];
}

/**
 * Validate that the API response has the expected shape.
 * Prevents crashes from malformed/unexpected data.
 */
function validateWeatherData(data) {
    if (!data || typeof data !== 'object') return false;
    const c = data.current;
    if (!c || typeof c.temperature_2m !== 'number' || typeof c.weather_code !== 'number') return false;
    const d = data.daily;
    if (!d || !Array.isArray(d.time) || d.time.length < 3) return false;
    if (!Array.isArray(d.temperature_2m_max) || !Array.isArray(d.temperature_2m_min)) return false;
    if (!Array.isArray(d.weather_code)) return false;
    return true;
}

async function fetchWeather(lat, lon) {
    // Validate coordinates are finite numbers to prevent injection via crafted Position objects
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        throw new Error('Invalid coordinates');
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
        '&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3';
    const res = await fetchWithTimeout(url, { timeout: 8000 });
    if (!res.ok) throw new Error(`Weather API: ${res.status}`);
    const data = await res.json();
    if (!validateWeatherData(data)) throw new Error('Unexpected API response shape');
    return data;
}

function getPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
    });
}

export function renderWeather(container) {
    container.innerHTML = '';
    const wrap = el('div', 'weather-app');
    const statusEl = el('div', 'weather-status', 'Locating you...');
    wrap.appendChild(statusEl);
    container.appendChild(wrap);

    let aborted = false;

    (async () => {
        try {
            const pos = await getPosition();
            if (aborted) return;
            const { latitude, longitude } = pos.coords;
            statusEl.textContent = 'Fetching weather...';
            const data = await fetchWeather(latitude, longitude);
            if (aborted) return;
            renderData(wrap, data);
        } catch (err) {
            if (aborted) return;
            wrap.innerHTML = '';
            const errWrap = el('div', 'weather-error');
            errWrap.appendChild(el('div', 'weather-error-icon', '📡'));
            errWrap.appendChild(el('div', 'weather-error-title', 'Location Unavailable'));
            errWrap.appendChild(el('div', 'weather-error-msg',
                err.code === 1 ? 'Permission denied — enable location access to use weather.'
                    : 'Could not determine your location. Check your connection.'));
            wrap.appendChild(errWrap);
        }
    })();

    return () => { aborted = true; };
}

function renderData(wrap, data) {
    wrap.innerHTML = '';
    const c = data.current;
    const [label, emoji] = describeWMO(c.weather_code);

    // Current conditions
    const now = el('div', 'weather-current');
    const iconEl = el('div', 'weather-big-icon', emoji);
    const info = el('div', 'weather-info');
    const temp = el('div', 'weather-temp', `${Math.round(c.temperature_2m)}°C`);
    const desc = el('div', 'weather-desc', label);
    const tz = data.timezone?.replace(/_/g, ' ').split('/').pop() || '';
    const loc = el('div', 'weather-loc', tz);
    info.append(temp, desc, loc);
    now.append(iconEl, info);

    // Stats row
    const stats = el('div', 'weather-stats');
    stats.appendChild(statCard('Feels Like', `${Math.round(c.apparent_temperature)}°C`));
    stats.appendChild(statCard('Humidity', `${c.relative_humidity_2m}%`));
    stats.appendChild(statCard('Wind', `${Math.round(c.wind_speed_10m)} km/h`));

    // 3-day forecast
    const forecast = el('div', 'weather-forecast');
    const fcTitle = el('div', 'weather-fc-title', '3-DAY FORECAST');
    forecast.appendChild(fcTitle);
    const days = el('div', 'weather-fc-days');
    for (let i = 0; i < 3; i++) {
        const date = new Date(data.daily.time[i]);
        const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' });
        const [, dayEmoji] = describeWMO(data.daily.weather_code[i]);
        const hi = Math.round(data.daily.temperature_2m_max[i]);
        const lo = Math.round(data.daily.temperature_2m_min[i]);

        const card = el('div', 'weather-fc-card');
        card.appendChild(el('div', 'weather-fc-day', dayName));
        card.appendChild(el('div', 'weather-fc-icon', dayEmoji));
        card.appendChild(el('div', 'weather-fc-range', `${hi}° / ${lo}°`));
        days.appendChild(card);
    }
    forecast.appendChild(days);

    wrap.append(now, stats, forecast);
}

function statCard(label, value) {
    const card = el('div', 'weather-stat');
    card.appendChild(el('div', 'weather-stat-val', value));
    card.appendChild(el('div', 'weather-stat-label', label));
    return card;
}
