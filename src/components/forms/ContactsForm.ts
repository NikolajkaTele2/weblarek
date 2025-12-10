import { BaseForm } from '../base/BaseForm';
import { events } from '../base/Events';
import { ensureElement } from '../../utils/utils';
import { IBuyer } from '../../types';

export class ContactsForm extends BaseForm {
  private emailInput: HTMLInputElement;
  private phoneInput: HTMLInputElement;
  private submitButton: HTMLButtonElement;
  private errorElement: HTMLElement | null;

  constructor(container: HTMLElement) {
    if (!container) {
      throw new Error('Container element is required for ContactsForm');
    }
    super(container);

    this.emailInput = ensureElement<HTMLInputElement>('input[name="email"]', this.formElement);
    this.phoneInput = ensureElement<HTMLInputElement>('input[name="phone"]', this.formElement);
    this.submitButton = ensureElement<HTMLButtonElement>('button[type="submit"]', this.formElement);
    this.errorElement = ensureElement<HTMLElement>('.form__errors', this.formElement);

    const updateState = () => {
      const filled = this.emailInput.value.trim() && this.phoneInput.value.trim();
      this.submitButton.disabled = !filled;

      if (!filled && this.errorElement) {
        this.errorElement.textContent = '';
      }
    };

    updateState();

    this.emailInput.addEventListener('input', () => {
      events.emit('order:change-email', { email: this.emailInput.value });
      updateState();
    });


    this.phoneInput.addEventListener('input', () => {
      events.emit('order:change-phone', { phone: this.phoneInput.value });
      updateState();
    });

    this.formElement.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!this.submitButton.disabled) {
        events.emit('order:submit-step2', {});
      }
    });
  }

  updateFields(data: Partial<IBuyer>) {
    if (data.email !== undefined) this.emailInput.value = data.email;
    if (data.phone !== undefined) this.phoneInput.value = data.phone;

    const filled = this.emailInput.value.trim() && this.phoneInput.value.trim();
    this.submitButton.disabled = !filled;
  }

  setValidationState({ canSubmit, errorMessage }: { canSubmit: boolean; errorMessage?: string }) {
    this.submitButton.disabled = !canSubmit;
    if (this.errorElement) {
      this.errorElement.textContent = errorMessage ?? '';
    }
  }
}