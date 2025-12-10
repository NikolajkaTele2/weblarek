import { BaseCard } from '../base/BaseCard';
import { IProduct } from '../../types';
import { events } from '../base/Events';
import { CDN_URL } from '../../utils/constants';
import { ensureElement } from '../../utils/utils';

export class CardPreview extends BaseCard {
	private id: string = '';
	private descriptionElement: HTMLElement;
	private isFree = false; // товар "бесценно"

	constructor(container: HTMLElement) {
		if (!container) {
			throw new Error('Container element is required for CardPreview');
		}
		super(container);

		this.descriptionElement = ensureElement<HTMLElement>('.card__text', container);

		const button = this.buttonElement;
		if (button) {
			button.addEventListener('click', () => {
				// запрещаем покупку бесценного товара или при disabled
				if (this.isFree || button.disabled) return;

				events.emit('product:toggle-from-preview', { id: this.id });
			});
		}
	}

	public updateButton(items: IProduct[]): void {
		const button = this.buttonElement;
		if (!button) return;

		if (this.isFree) {
			this.setButtonDisabled(true, 'Недоступно');
			return;
		}

		const isInBasket = items.some((item) => item.id === this.id);
    const buttonText = isInBasket ? 'Удалить из корзины' : 'Купить';
        
    this.setButtonDisabled(false, buttonText);
	}

	render(data: IProduct): HTMLElement {
		this.id = data.id;
		this.title = data.title;
		this.price = data.price;
		this.category = data.category;
		this.image = `${CDN_URL}/${data.image}`;

		// запоминаем, что товар бесплатный
		this.isFree = data.price === null;

		this.descriptionElement.textContent = data.description;

		if (this.buttonElement && this.isFree) {
			this.setButtonDisabled(true, 'Недоступно');
		}

		return this.container;
	}
}