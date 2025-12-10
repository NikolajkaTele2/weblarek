import { BaseForm } from '../base/BaseForm';
import { events } from '../base/Events';
import { IBuyer } from '../../types';
import { ensureElement, ensureAllElements } from '../../utils/utils';

export class DeliveryForm extends BaseForm {
	private payment: 'card' | 'cash' | '' = '';
	private address = '';

	private paymentButtons: HTMLButtonElement[];
	private addressInput: HTMLInputElement;
	private errorElement: HTMLElement;
	private submitButton: HTMLButtonElement;

	constructor(container: HTMLElement) {
		super(container);

		this.paymentButtons = ensureAllElements<HTMLButtonElement>(
			'.button_alt',
			this.formElement
		);
		this.addressInput = ensureElement<HTMLInputElement>(
			'input[name="address"]',
			this.formElement
		);
		this.errorElement = ensureElement<HTMLElement>(
			'.form__errors',
			this.formElement
		);
		this.submitButton = ensureElement<HTMLButtonElement>(
			'.order__button',
			this.formElement
		);

		// обработчики кнопок оплаты
		this.paymentButtons.forEach((btn) => {
			btn.addEventListener('click', () => {
				const val: 'card' | 'cash' =
					btn.getAttribute('name') === 'cash' ? 'cash' : 'card';
				this.payment = val;

				this.paymentButtons.forEach((b) =>
					b.classList.remove('button_alt-active')
				);
				btn.classList.add('button_alt-active');

				events.emit('order:change-payment', { payment: val });
			});
		});

		// обработчик адреса
		this.addressInput.addEventListener('input', () => {
			this.address = this.addressInput.value.trim();
			events.emit('order:change-address', { address: this.address });
		});

		// отправка формы
		this.formElement.addEventListener('submit', (e) => {
			e.preventDefault();
			events.emit('order:submit-step1', {});
		});
	}

	updateFields(data: Partial<IBuyer>): void {
    if (!data) return;

		if (data.payment === 'card' || data.payment === 'cash' || data.payment === '') {
			this.payment = data.payment;
			this.paymentButtons.forEach((b) =>
				b.classList.toggle(
					'button_alt-active',
					b.getAttribute('name') === data.payment
				)
			);
		}

		if (data.payment === null) {
			this.paymentButtons.forEach((b) =>
				b.classList.remove('button_alt-active')
			);
		}

		if (data.address !== undefined) {
			this.address = data.address;
			this.addressInput.value = data.address;
		}
	}

	/** установка состояния валидации */
	setValidationState({
		canSubmit,
		errorMessage,
	}: {
		canSubmit: boolean;
		errorMessage: string;
	}): void {
		this.submitButton.disabled = !canSubmit;
		this.errorElement.textContent = errorMessage;
	}
}