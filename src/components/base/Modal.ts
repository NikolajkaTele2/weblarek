import { events } from './Events';
import { ensureElement } from '../../utils/utils';

export class Modal {
  protected modalElement: HTMLElement;
  protected contentElement: HTMLElement;
  private isOpen: boolean = false;

  constructor() {
    this.modalElement = ensureElement<HTMLElement>('.modal');
    this.contentElement = ensureElement<HTMLElement>('.modal__content', this.modalElement);

    // закрытие по крестику
    const closeBtn = ensureElement<HTMLButtonElement>('.modal__close', this.modalElement);
    closeBtn.addEventListener('click', () => {
      this.close();
      events.emit('modal:close', {});
    });

    // закрытие по клику вне контента
    this.modalElement.addEventListener('click', (event) => {
      if (event.target === this.modalElement) {
        this.close();
        events.emit('modal:close', {});
      }
    });
    // закрытие по escape
    this.modalElement.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
          this.close();
          events.emit('modal:close', {});
      }
    });
  }

  open(content: HTMLElement) {
      this.isOpen = true;
      this.contentElement.replaceChildren(content);
      this.modalElement.classList.add('modal_active');
      this.modalElement.style.overflow = 'hidden';
      events.emit('modal:open', {});
  }

  isOpened(): boolean {
      return this.isOpen;
  }

  close() {
    this.modalElement.classList.remove('modal_active');
    this.contentElement.replaceChildren();
  }
}