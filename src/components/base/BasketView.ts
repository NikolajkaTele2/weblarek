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


    this.container.classList.add('basket__empty');
    this.submitButton.disabled = true;
    this.totalElement.textContent = '0 синапсов';
	}

	setItems(items: HTMLElement[]): void {
		this.listElement.replaceChildren(...items);

		const isEmpty = items.length === 0;


		if (isEmpty) {
			if (!this.listElement.contains(this.emptyElement)) {
				this.listElement.appendChild(this.emptyElement);
			}
		} else if (this.listElement.contains(this.emptyElement)) {
			this.emptyElement.remove();
		}

		if (isEmpty) {
			this.container.style.height = '220px';
		} else {
			this.container.style.height = 'auto';
		}

		this.submitButton.disabled = isEmpty;

		this.container.style.overflow = 'hidden';
		this.listElement.style.overflow = 'hidden';
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