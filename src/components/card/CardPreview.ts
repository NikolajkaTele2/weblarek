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

    events.on('basket:changed', (data: { items: IProduct[] }) => {
        console.log('CardPreview: получено basket:changed, обновляю кнопку');
        this.updateButton(data.items);
    });

		const button = this.buttonElement;
		if (button) {
			console.log('CardPreview: кнопка найдена, текст:', button.textContent);
			
			button.addEventListener('click', () => {
					console.log('CardPreview: клик по кнопке, this.id =', this.id);
					
					// ДОБАВЬ ЭТИ ПРОВЕРКИ:
					if (!this.id) {
							console.error('CardPreview: ID товара не установлен!');
							return;
					}
					
					// ДОБАВЬ ПРОВЕРКУ НА БЕСПЛАТНЫЙ ТОВАР И DISABLED:
					if (this.isFree || button.disabled) {
							console.log('CardPreview: Кнопка заблокирована (бесплатный или disabled)');
							return;
					}

					// ДОБАВЬ ОТПРАВКУ СОБЫТИЯ:
					console.log('CardPreview: Отправляю событие product:toggle-from-preview с id =', this.id);
					events.emit('product:toggle-from-preview', { id: this.id });
			});
		}
	}

	public updateButton(items: IProduct[]): void {
		const button = this.buttonElement;
		if (!button) return;

    if (!this.id) {
        console.warn('CardPreview.updateButton: id не установлен');
        return;
    }
    
		if (this.isFree) {
			this.setButtonDisabled(true, 'Недоступно');
			return;
		}

		const isInBasket = items.some((item) => item.id === this.id);
    console.log('CardPreview.updateButton: товар в корзине?', isInBasket, 'id:', this.id);
    
    const buttonText = isInBasket ? 'Удалить из корзины' : 'Купить';
    console.log('CardPreview.updateButton: устанавливаю текст:', buttonText);
    
    this.setButtonDisabled(false, buttonText);
		console.log('=== CardPreview.updateButton завершен ===');
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