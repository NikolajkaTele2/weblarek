import { events } from '../base/Events';
import { ensureElement } from '../../utils/utils';

export class PageView {
	private gallery: HTMLElement;
	private basketButton: HTMLButtonElement;
	private basketCounter: HTMLElement;

	constructor() {
		this.gallery = ensureElement<HTMLElement>('.gallery');
		this.basketButton = ensureElement<HTMLButtonElement>('.header__basket');
		this.basketCounter = ensureElement<HTMLElement>('.header__basket-counter');

		this.basketButton.addEventListener('click', () => {
			events.emit('basket:open', {});
		});
	}

	setCatalog(items: HTMLElement[]) {
		this.gallery.replaceChildren(...items);
	}

  setBasketCounter(count: number) {
    const formattedCount = count > 99 ? '99+' : String(count);
    this.basketCounter.textContent = formattedCount;
    
    // Блокируем кнопку если корзина пуста
    this.basketButton.disabled = count === 0;
  }
}