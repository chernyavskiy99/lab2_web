import AbstractComponent from './abstract-component.js';

const createFavoritesBoardTemplate = () => {
  return (
    `<ul class="favorites__list list-style-reset">
    
    </ul>`
  );
}

export default class FavoritesBoard extends AbstractComponent {
  constructor() {
    super();
  }

  getTemplate() {
    return createFavoritesBoardTemplate();
  }
}