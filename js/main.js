const ENDPOINT = `https://api.openweathermap.org/data/2.5/`;
const TOKKEN = `d136e52c1f0eee76445085fa375a3f40`;

const DEFAULT_COORDS = {
  latitude: 59.9344574,
  longitude: 30.2441396
}

const localStorage = window.localStorage;

function sendRequest (mode, data) {
  let body = ``;

  switch(mode) {
    case `geo`:
      body = `weather?lat=${data.latitude}&lon=${data.longitude}`;
      break;

    case `ids`:
      body = `group?id=${data}`;
      break;

    case `name`:
      body = `weather?q=${data.trim()}`;
      break;

    default:
      body = false;
  }
  
  if (!body) {
    throw new Error(`Введите корректные параметры.`)
  }
  
  return fetch(`${ENDPOINT}${body}&units=metric&appid=${TOKKEN}`);
}

function getCurrentCoords () {
  return new Promise((resolve) => {
    const geo = navigator.geolocation;

    geo.getCurrentPosition((res) => {
      resolve({
        latitude: res.coords.latitude,
        longitude: res.coords.longitude
      });
    }, () => {
      resolve(DEFAULT_COORDS);
    }, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });    
};

async function getDataByGeo () {
  const curCoords = await getCurrentCoords().then((res) => res);
  
  return sendRequest(`geo`, curCoords).then((res) => {
      return res.json();
    });
};

function getIDsFromStorage () {
  const cities = getCitiesFromStorage();

  return cities.join(`,`);
}

function getCitiesFromStorage () {
  return JSON.parse(localStorage.getItem(`favoriteCities`));
}

function setCitiesInStorage (arr) {
  localStorage.setItem(`favoriteCities`, JSON.stringify(arr));
}

function addCityInStorage (id) {
  const cities = getCitiesFromStorage();
  cities.push(id)

  setCitiesInStorage(cities);
}

function removeCityFromStorage(id) {
  const cities = getCitiesFromStorage();

  setCitiesInStorage(cities.filter((city) => city !== Number(id)));
}

function getDataByIDs () {
  const ids = getIDsFromStorage();
  
  return sendRequest(`ids`, ids).then((res) => {
      return res.json();
    });
}

function getDataByName (cityName) {
  let isOK = false; 

  return sendRequest(`name`, cityName).then((res) => {
      if (res.ok) {
        isOK = true;
        
        return res.json();
      }

      throw new Error(`Не удалось найти город "${cityName}". Попробуйте снова.`);
    }).then((res) => {
      if (isOK) {
        if (getCitiesFromStorage().includes(res.id)) {
          throw new Error(`Город "${res.name}" уже в списке. Добавьте другой город.`);
        }

        addCityInStorage(res.id);
      }        

      return res;
    });
}

function isStorageEmpty () {
  if (!getCitiesFromStorage()) {
    setCitiesInStorage([]);

    return true;
  }

  if (!getCitiesFromStorage().length) {
    return true;
  }

  return false;
}

function getDirection (deg) {
  let direction;

  switch(true) {
    case deg > 11.25:
      direction = `North-northeast`;
      break;

    case deg > 33.75:
      direction = `Northeast`;
      break;
      
    case deg > 56.25:
    direction = `East-northeast`;
    break;
    
    case deg > 78.75:
      direction = `East`;
      break;
    
    case deg > 101.25:
      direction = `East-southeast`;
      break;
    
    case deg > 123.75:
      direction = `Southeast`;
      break;
    
    case deg > 146.25:
      direction = `South-southeast`;
      break;
    
    case deg > 168.75:
      direction = `South`;
      break;
    
    case deg > 191.25:
      direction = `South-southwest`;
      break;
    
    case deg > 213.75:
      direction = `Southwest`;
      break;
    
    case deg > 236.25:
      direction = `West-southwest`;
      break;
    
    case deg > 258.75:
      direction = `West`;
      break;
    
    case deg > 281.25:
      direction = `West-northwest`;
      break;
    
    case deg > 303.75:
      direction = `Northwest`;
      break;
    
    case deg > 326.25:
      direction = `North-northwest`;
      break;
  
    default:
      direction = `North`;
  }

  return direction;
};

function getWeatherData (data) {
  return {
    id: data[`id`],
    name: data[`name`],
    description: data[`weather`][0][`description`],
    icon: data[`weather`][0][`icon`],
    temp: Math.round(data[`main`][`temp`]),
    wind: {
      speed: data[`wind`][`speed`],
      direction: getDirection(data[`wind`][`deg`])
    },
    clouds: data[`clouds`][`all`],
    pressure: data[`main`][`pressure`],
    humidity: data[`main`][`humidity`],
    coordinates: {
      latitude: data[`coord`][`lat`],
      longitude: data[`coord`][`lon`]
    }
  }
}

function getWeathersData (data) {
  return data.list.map((city) => getWeatherData(city));
}

function getWeatherDetailsElement({wind, clouds, pressure, humidity, coordinates}) {
  const weatherDetailsElement = document.querySelector(`#weather-details`).content.cloneNode(true).querySelector(`.weather-details`);

  const detailsElements = weatherDetailsElement.querySelectorAll(`.weather-details__item`);

  detailsElements[0].querySelector(`.weather-details__value`).textContent = `${wind.speed} m/s, ${wind.direction}`;
  detailsElements[1].querySelector(`.weather-details__value`).textContent = `${clouds} %`;
  detailsElements[2].querySelector(`.weather-details__value`).textContent = `${pressure} hpa`;
  detailsElements[3].querySelector(`.weather-details__value`).textContent = `${humidity} %`;
  detailsElements[4].querySelector(`.weather-details__value`).textContent = `[${coordinates.latitude}, ${coordinates.longitude}]`;

  return weatherDetailsElement;
}

function initLocalWeather (container) {
  const refreshButtonElement = document.querySelector(`.refresh__button`);

  refreshButtonElement.classList.add(`refresh__button--loading`);
  refreshButtonElement.classList.remove(`refresh__button--error`);
  refreshButtonElement.disabled = true;

  getDataByGeo()
    .then((data) => {
      
      refreshButtonElement.classList.remove(`refresh__button--error`);
      refreshButtonElement.classList.remove(`refresh__button--loading`);
      refreshButtonElement.disabled = false;

      container.lastElementChild.remove();

      const fragment = document.createDocumentFragment();

      const generalElement = document.querySelector(`#local-general`).content.cloneNode(true).querySelector(`.local-weather`);
      
      const weatherData = getWeatherData(data);
      
      generalElement.querySelector(`.local-weather__city`).textContent = `${weatherData.name}`;
      generalElement.querySelector(`.local-weather__icon`).src = `http://openweathermap.org/img/wn/${weatherData.icon}@2x.png`;
      generalElement.querySelector(`.local-weather__icon`).alt = `${weatherData.description}`;
      generalElement.querySelector(`.local-weather__degrees`).textContent = `${weatherData.temp}°C`;

      fragment.appendChild(generalElement);
      fragment.querySelector(`.local-weather`).appendChild(getWeatherDetailsElement(weatherData));

      container.appendChild(fragment);
    })
    .catch(() => {
      refreshButtonElement.classList.add(`refresh__button--error`);
      refreshButtonElement.classList.remove(`refresh__button--loading`);
      refreshButtonElement.disabled = false;
    });
};

function getFavoritesItem (container, data) {
  const favoriteItemElement = document.querySelector(`#favorites-item`).content.cloneNode(true).querySelector(`.favorite-item`);

  favoriteItemElement.querySelector(`.favorite-item__city`).textContent = `${data.name}`;
  favoriteItemElement.querySelector(`.favorite-item__degrees`).textContent = `${data.temp}°C`;
  favoriteItemElement.querySelector(`.favorite-item__icon`).src = `http://openweathermap.org/img/wn/${data.icon}@2x.png`;
  favoriteItemElement.querySelector(`.favorite-item__icon`).alt = `${data.description}`;
  favoriteItemElement.querySelector(`.favorite-item__button`).dataset.id = `${data.id}`;

  favoriteItemElement.appendChild(getWeatherDetailsElement(data));

  container.appendChild(favoriteItemElement);
}

function initFavoritesWeather (container) {
  if (isStorageEmpty()) {
    container.lastElementChild.remove();

    const errorElement = document.createElement(`b`);
    errorElement.textContent = `Пока нет избранных городов.`;

    container.appendChild(errorElement);

    return;
  }

  getDataByIDs()
    .then((data) => {
      container.lastElementChild.remove();

      const fragment = document.createDocumentFragment(); 
      const weathersData = getWeathersData(data);   

      weathersData.forEach((city) => {
        getFavoritesItem(fragment, city);
      });
      
      container.appendChild(fragment);
    });
};

function refreshButtonHandler () {
  const refreshButtonElement = document.querySelector(`.refresh__button`);
  
  refreshButtonElement.addEventListener(`click`, (evt) => {
    evt.preventDefault();

    initLocalWeather(document.querySelector(`.local`));
  });
}

function formHandler () {
  const formElement = document.querySelector(`.favorites__add`);
  const addButtonElement = document.querySelector(`.favorites__add-button`);
  const addInputElement = document.querySelector(`.favorites__input`);
  const favoritesBoardElement = document.querySelector(`.favorites__list`);

  formElement.addEventListener(`submit`, (evt) => {
    evt.preventDefault();

    const isFirst = isStorageEmpty();

    addButtonElement.disabled = true;
    addInputElement.disabled = true;

    getDataByName(addInputElement.value)
      .then((data) => {
        if (isFirst) {
          favoritesBoardElement.innerHTML = ``;
        }

        getFavoritesItem(favoritesBoardElement, getWeatherData(data));

        addButtonElement.disabled = false;
        addInputElement.disabled = false;
        addInputElement.value = ``;
      })
      .catch((err) => {
        alert(err.message);

        addButtonElement.disabled = false;
        addInputElement.disabled = false;
        addInputElement.value = ``;
      });
  });
}

function deleteHandler () {
  const favoritesBoardElement = document.querySelector(`.favorites__list`);

  favoritesBoardElement.addEventListener(`click`, (evt) => {
    evt.preventDefault();

    if (evt.target.tagName === `BUTTON`) {
      removeCityFromStorage(evt.target.dataset.id);
      evt.target.parentNode.parentNode.remove();

      if (isStorageEmpty()) {
        favoritesBoardElement.innerHTML = `<b>Пока нет избранных городов.</b>`;
      }
    }
  });
}

function addHandlers () {
  refreshButtonHandler();
  formHandler();
  deleteHandler();
}

const localWeatherContainerElement = document.querySelector(`.local`);
const favoritesWeatherContainerElement = document.querySelector(`.favorites__list`);

initLocalWeather(localWeatherContainerElement)
initFavoritesWeather(favoritesWeatherContainerElement);
addHandlers();