import { IProduct } from '../../types';
import { events } from '../base/Events';
import { cloneTemplate, ensureElement } from '../../utils/utils';

export class BasketItemView {
  private container: HTMLElement;
  private indexElement: HTMLElement;
  private titleElement: HTMLElement;
  private priceElement: HTMLElement;
  private deleteButton: HTMLButtonElement;

  private id = '';

  constructor() {
    
    this.container = cloneTemplate<HTMLElement>('#card-basket');

    this.indexElement = ensureElement<HTMLElement>('.basket__item-index', this.container);
    this.titleElement = ensureElement<HTMLElement>('.card__title', this.container);
    this.priceElement = ensureElement<HTMLElement>('.card__price', this.container);
    this.deleteButton = ensureElement<HTMLButtonElement>('.basket__item-delete', this.container);

    this.deleteButton.addEventListener('click', () => {
      if (this.id) {
        events.emit('basket:item-remove', { id: this.id });
      }
    });
  }

  render(product: IProduct, index: number): HTMLElement {
    if (!product) {
        throw new Error('Product is required');
    }
    
    if (typeof product.id !== 'string' || product.id.trim() === '') {
        throw new Error('Product must have a valid ID');
    }
    
    if (typeof product.title !== 'string') {
        console.warn('Product title is not a string, using fallback');
        product.title = 'Без названия';
    }
    
    // Валидация index
    if (!Number.isInteger(index)) {
        console.warn('Non-integer index provided, rounding down');
        index = Math.floor(index);
    }
    this.id = product.id;
    this.indexElement.textContent = String(index + 1);
    this.titleElement.textContent = product.title;
    this.priceElement.textContent = product.price === null ? 'Бесценно' : `${product.price} синапсов`;

    return this.container;
  }
}