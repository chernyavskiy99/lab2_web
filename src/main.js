import LocalWeatherController from './controllers/local-weather.js';
import FavoritesBoardController from './controllers/favorites-board.js';
import API from './api/index.js';

const localWeatherContainerElement = document.querySelector(`.local`);
const favoritesContainerElement = document.querySelector(`.favorites`);

const api = new API();

const localWeatherController = new LocalWeatherController(localWeatherContainerElement, api);
const favoritesBoardController = new FavoritesBoardController(favoritesContainerElement, api);

localWeatherController.render();
favoritesBoardController.render();
