import AbstractComponent from './abstract-component.js';

const createFavoriteWeatherContainerTemplate = () => {
  return (
    `<li class="favorites__item favorite-item">
      
    </li>`
  );
}

export default class FavoriteWeatherContainer extends AbstractComponent {
  constructor() {
    super();
  }

  getTemplate() {
    return createFavoriteWeatherContainerTemplate();
  }
}