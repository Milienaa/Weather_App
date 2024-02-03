'use strict';

class WeatherApp {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.days = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
    };
    this.todayWeatherWrap = document.querySelector('.today__wrap');
    this.hourlyWrap = document.querySelector('.hourly__wrap');
    this.wrapper = document.querySelector('.wrapper__content');
    this.form = document.querySelector('.header__form');
    this.fifthWeatherWrap = document.querySelector('.fifthday__wrap');
    this.placesWrap = document.querySelector('.places__wrap');
    this.btnWrap = document.querySelector('.header__wrap2');
    this.errorWrap = document.querySelector('.wrapper__error');
    this.searchCity = 'Kyiv';
  }

  init() {
    this.getCurrentForecastType();
    this.fetchWeather();
    this.btnWrap.addEventListener('click', this.makeForecastBtnActive.bind(this));
    this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
    window.addEventListener('DOMContentLoaded', this.handleDOMContentLoaded.bind(this));
  }

  getCurrentForecastType() {
    const radioButtons = document.querySelectorAll('input[name="forecast-type"]');
    let selectedValue = '';

    radioButtons.forEach((radioButton) => {
      radioButton.addEventListener('click', () => {
        if (selectedValue !== radioButton.value) {
          selectedValue = radioButton.value;
          this.fetchWeather(this.searchCity, selectedValue);
        }
      });
    });
  }

  fetchWeather(city = 'Kyiv', type = 'today') {
    fetch(`http://api.openweathermap.org/data/2.5/forecast?q=${city}&cnt=40&lang=en&units=metric&appid=${this.apiKey}`)
      .then((data) => data.json())
      .then((data) => {
        if (type === 'today') {
          const todayWeatherItems = data.list.filter((item) => {
            const currentDate = new Date();
            return (
              new Date(item.dt_txt).getDay() === currentDate.getDay() &&
              new Date(item.dt_txt).getMonth() === currentDate.getMonth() &&
              new Date(item.dt_txt).getFullYear() === currentDate.getFullYear()
            );
          });

          const fetchNearestLocations = async () => {
            const nearest = await this.getWeatherForNearestCities(data.city.coord.lat, data.city.coord.lon);
            return nearest.filter(({ name }) => name !== data.city.name);
          };

          fetchNearestLocations().then((nearest) =>
            this.setTodayForecastWrapper(
              data.city,
              data.list[0],
              todayWeatherItems,
              nearest
            )
          );
        } else {
          const fifthDayForecast = {
            city: data.city,
            list: data.list.reduce(
              (acc, curr, id) => {
                if (id === 0) {
                  acc[acc.length - 1].push(curr);
                  return acc;
                }
                const lastItem = acc[acc.length - 1];
                const lastItemElem = lastItem[lastItem.length - 1];

                const lastDate = new Date(lastItemElem.dt_txt).getDate();
                const currDate = new Date(curr.dt_txt).getDate();

                if (lastDate !== currDate) {
                  acc.push([curr]);
                  return acc;
                }

                acc[acc.length - 1].push(curr);
                return acc;
              },
              [[]]
            ),
          };

          this.setFifthDayForecastWrapper(fifthDayForecast);
        }
      })
      .catch(() => this.setError());
  }

  setTodayForecastWrapper(city, todayWeather, weather, nearest) {
    this.wrapper.innerHTML = `<div class="today__wrap">${this.setTodayWeatherHead(city, todayWeather)}</div><div class="hourly__wrap">${this.setHourlyWeather(city, weather)}</div><div class="places__wrap">${this.setPlacesWeather(nearest)}</div>`;
  }

  setFifthDayForecastWrapper(weather) {
    this.wrapper.innerHTML = `
      <div class="fifthday__wrap">
        ${this.setFifthDayHead(weather.list)}
        ${this.setFifthDayContent(weather.list)}
      </div>
      <div class="hourly__wrap">${this.setHourlyWeather(weather.city, weather.list[0])}</div>
    </div>`;

    const hourlyWrap = document.querySelector('.hourly__wrap');
    this.makeDayForecastActive(0);
    const radioButtons = document.querySelectorAll('input[name="day"]');
    let selectedValue = '';

    radioButtons.forEach((radioButton) => {
      radioButton.addEventListener('click', () => {
        if (selectedValue !== radioButton.value) {
          selectedValue = radioButton.value;
          this.makeDayForecastActive(selectedValue);
          hourlyWrap.innerHTML = this.setHourlyWeather(weather.city, weather.list[selectedValue]);
        }
      });
    });
  }

  makeForecastBtnActive(e) {
    if (e.target.matches('.btnToday')) {
      e.target.classList.add('btn--active');
      const btnFifthDay = document.querySelector('.btnFifthDay');
      btnFifthDay.classList.remove('btn--active');
    }

    if (e.target.matches('.btnFifthDay')) {
      e.target.classList.add('btn--active');
      const btnToday = document.querySelector('.btnToday');
      btnToday.classList.remove('btn--active');
    }
  }

  makeDayForecastActive(index) {
    const dayContent = document.querySelectorAll('.forecast');
    dayContent.forEach((elem) => elem.classList.remove('forecast--active'));
    dayContent[+index].classList.add('forecast--active');
  }

  setFifthDayHead(weather) {
    return `<div class="fifthday__wrap__head" style="grid-template-columns: repeat(${weather.length}, 1fr)">
        ${weather
          .map(
            (item, id) => `
           <div class="day__week">
                <label>
                <input type="radio" name="day" value="${id}" ${id === 1 ? 'checked' : ''} />
                    <p class="day">${this.days[new Date(item[0].dt_txt).getDay()]}</p>
                    <p class="date">${new Date(item[0].dt_txt).toLocaleString('en-US', {
                      month: 'short',
                      day: '2-digit',
                    })}</p>
                </label>
            </div>
        `
          )
          .join('')}
    </div>`;
  }

  setFifthDayContent(weather) {
    const content = weather
      .map((day, index) => {
        console.log(`Day ${index + 1}:`, day);

        if (day[0] && day[0].weather && day[0].main) {
          return `
              <div class="forecast">
                <img class="fifthday__img" src="http://openweathermap.org/img/w/${
                  day[0].weather[0].icon
                }.png" alt="">
                <p class="celcius">${Math.floor(day[0].main.temp)}</p>
                <p>${day[0].weather[0].description}</p>
              </div>
            `;
        } else {
          return '';
        }
      })
      .join('');

    return `<div class="fifthday__wrap__content" style="grid-template-columns: repeat(${weather.length}, 1fr)">${content}</div>`;
  }

  setTodayWeatherHead(city, weather) {
    const sunriseTime = new Date(city.sunrise * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const sunsetTime = new Date(city.sunset * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const duration = this.calculateDuration(city.sunrise * 1000, city.sunset * 1000);

    return `<div class="today__wrap__head">
      <div class="today__wrap__head__text">
          <h2>Today's Forecast -</h2>
          <p class="town">${city.name}</p>
      </div>
      <p class="current__date">${new Date(weather.dt_txt)
        .toLocaleDateString()
        .replaceAll('.', ':')}</p>
  </div>
  <div class="today__wrap__content">
      <div class="forecast">
          <img class="today__img" src="http://openweathermap.org/img/w/${
            weather.weather[0].icon
          }.png" alt="">
          <p>${weather.weather[0].description}</p>
      </div>
      <div class="temp">
          <p class="temperature">${Math.floor(weather.main.temp)}° C</p>
          <p>feels like ${Math.floor(weather.main.feels_like)}°</p>
      </div>
      <div class="sun">
          <div class="sun__item"><p class="sunrise">Sunrise </p><span>${sunriseTime}</span></div>
          <div class="sun__item"><p class="sunset">Sunset </p><span>${sunsetTime}</span></div>
          <div class="sun__item"><p class="duration">Duration </p><span>${duration}</span></div>
      </div>
  </div>`;
  }

  calculateDuration(sunriseTimestamp, sunsetTimestamp) {
    const durationMilliseconds = sunsetTimestamp - sunriseTimestamp;
    const durationHours = Math.floor(durationMilliseconds / (60 * 60 * 1000));
    const durationMinutes = Math.floor((durationMilliseconds % (60 * 60 * 1000)) / (60 * 1000));

    return `${durationHours}:${durationMinutes < 10 ? '0' : ''}${durationMinutes} hr`;
  }

  handleFormSubmit(event) {
    event.preventDefault();
    const input = this.form.querySelector('.header__form__field');
    this.searchCity = input.value;
    this.fetchWeather(input.value);
  }

  setPlacesWeather(nearest) {
    return `
      <div class="places__wrap__head">
          <p>Nearby places</p>
      </div>
      <ul class="places__wrap__content">
        ${nearest
          .map(
            ({ name, main, weather }) => `<li class="near__item">
                    <div class="hour">
                      <p>${name}</p>
                    </div>
                    <div class="forecast">
                      <img class="places__img" src="http://openweathermap.org/img/w/${weather[0].icon}.png" alt="">
                      <p>${weather[0].description}</p>
                    </div>
                    <div class="temp">
                      <p>${main.temp}°</p>
                    </div>
                </li>`,
          )
          .join('')}
      </ul>`;
  }

  handleDOMContentLoaded(event) {
    const responseStatus = 404;
    this.setError(responseStatus);
  }

  setError(status) {
    if (status === 404) {
      this.todayWeatherWrap.style.display = 'none';
      this.fifthWeatherWrap.style.display = 'none';
      this.hourlyWrap.style.display = 'none';
      this.placesWrap.style.display = 'none';
      this.errorWrap.style.display = 'block';
    }
  }

  setHourlyWeather(city, weather) {
    const head = ` <div class="hourly__wrap__head">
                      <div class="hourly__wrap__head__text">
                          <h2>Hourly -</h2>
                          <p class="town">${city.name}</p>
                      </div>
                  </div>`;

    const list = `${weather
      .map(
        (item) => `<li class="item">
                          <div class="hour">
                              <p>${new Date(item.dt_txt).toLocaleTimeString([], {
                                hour: '2-digit',
                                hour12: true,
                              })}</p>
                          </div>
                          <div class="forecast">
                              <img class="hourly__img" src="http://openweathermap.org/img/w/${
                                item.weather[0].icon
                              }.png" alt="">
                              <p>${item.weather[0].description}</p>
                          </div>
                          <div class="temp">
                              <p>${Math.floor(item.main.temp)}°</p>
                          </div>
                          <div class="feels">
                              <p>${Math.floor(item.main.feels_like)}°</p>
                          </div>
                          <div class="wind">
                              <p>${Math.floor(item.wind.speed)} km/h</p>
                          </div>
                      </li>`,
      )
      .join('')}`;

    return `${head}
      <ul class="hourly__wrap__content">
                      <li class="item item__first">
                          <p>Hour</p>
                          <p>Forecast</p>
                          <p>Temp (°C)</p>
                          <p>Feels like</p>
                          <p>Wind (km/h)</p>
                      </li>
                      ${list}
                      </ul>`;
  }

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Геолокація не підтримується браузером.'));
      }
    });
  }

  async getWeatherForecast({ lat, lon }) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=5&units=metric&appid=${this.apiKey}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log(data);
      return data.list;
    } catch (error) {
      console.error('Помилка при отриманні прогнозу погоди:', error);
      throw error;
    }
  }

  async getWeatherForNearestCities(paramLat, paramLon) {
    try {
      const location = await this.getCurrentLocation();

      const coordForForecast =
        paramLat && paramLon
          ? { lat: paramLat, lon: paramLon }
          : { lat: location.lat, lon: location.lon };

      const weatherForecast = await this.getWeatherForecast(coordForForecast);
      return weatherForecast;
    } catch (error) {
      console.error('Помилка:', error.message);
    }
  }
}