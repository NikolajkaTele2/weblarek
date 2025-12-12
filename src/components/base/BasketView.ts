import { events } from '../base/Events';
import { ensureElement } from '../../utils/utils';

export class BasketView {
	private container: HTMLElement;
	private listElement: HTMLElement;
	private totalElement: HTMLElement;
	private submitButton: HTMLButtonElement;

	private emptyElement: HTMLParagraphElement;

	constructor(container: HTMLElement) {
        if (!container) {
            throw new Error('Container element is required for BasketView');
        }
		this.container = container;

		this.listElement = ensureElement<HTMLElement>('.basket__list', container);
		this.totalElement = ensureElement<HTMLElement>('.basket__price', container);
		this.submitButton = ensureElement<HTMLButtonElement>('.basket__button', container);

		this.emptyElement = document.createElement('p');
		this.emptyElement.classList.add('basket__empty');
		this.emptyElement.textContent = 'Корзина пуста';

		this.submitButton.addEventListener('click', () => {
			events.emit('basket:submit', {});
		});

		// ИЗМЕНЕНО: вызываем fixHeight вместо setInitialState
		this.fixHeight();
	}

	/**
	 * ФИКС высоты для 3 товаров
	 * Было: 258px (помещается 2 товара)
	 * Стало: 360px (помещается 3 товара)
	 */
	private fixHeight(): void {
		// Начальное состояние
		this.submitButton.disabled = true;
		this.totalElement.textContent = '0 синапсов';
		
		// ВАЖНО: меняем высоту с 258px на 360px
		this.listElement.style.maxHeight = '360px';
		
		// Включаем скролл если нужно
		this.listElement.style.overflowY = 'auto';
		
		console.log('BasketView: высота исправлена (258px → 360px)');
	}

	setItems(items: HTMLElement[]): void {
		this.listElement.replaceChildren(...items);

		const isEmpty = items.length === 0;

		if (isEmpty) {
			if (!this.listElement.contains(this.emptyElement)) {
				this.listElement.appendChild(this.emptyElement);
			}
			// Для пустой корзины уменьшаем высоту
			this.listElement.style.maxHeight = '100px';
			this.listElement.style.overflowY = 'hidden';
		} else if (this.listElement.contains(this.emptyElement)) {
			this.emptyElement.remove();
			// Для непустой корзины возвращаем высоту 360px
			this.listElement.style.maxHeight = '360px';
			// ИЗМЕНЕНО: автоматически управляем скроллом
			this.listElement.style.overflowY = items.length > 3 ? 'auto' : 'hidden';
		}

		this.submitButton.disabled = isEmpty;
		if (isEmpty) {
			this.submitButton.textContent = 'Корзина пуста';
		} else {
			this.submitButton.textContent = 'Оформить';
		}
	}

	// Устанавливаем общую стоимость
    setTotal(total: number | null): void {
        if (total === null) {
            this.totalElement.textContent = 'Бесценно';
        } else {
            const formatted = total.toLocaleString('ru-RU');
            this.totalElement.textContent = `${formatted} синапсов`;
        }
    }

	// render только возвращает контейнер
	render(): HTMLElement {
		return this.container;
	}
}