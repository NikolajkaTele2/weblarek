import { events } from "../base/Events";
import { ensureElement } from "../../utils/utils";

export class BasketView {
  private container: HTMLElement;
  private listElement: HTMLElement;
  private totalElement: HTMLElement;
  private submitButton: HTMLButtonElement;

  private emptyElement: HTMLParagraphElement;

  constructor(container: HTMLElement) {
    if (!container) {
      throw new Error("Container element is required for BasketView");
    }
    this.container = container;
    this.listElement = ensureElement<HTMLElement>(".basket__list", container);
    this.totalElement = ensureElement<HTMLElement>(".basket__price", container);
    this.submitButton = ensureElement<HTMLButtonElement>(
      ".basket__button",
      container
    );

    this.emptyElement = document.createElement("p");
    this.emptyElement.classList.add("basket__empty");
    this.emptyElement.textContent = "Корзина пуста";

    this.submitButton.addEventListener("click", () => {
      events.emit("basket:submit", {});
    });
  }


  setItems(items: HTMLElement[]): void {
    this.listElement.replaceChildren(...items);

    const isEmpty = items.length === 0;

    if (isEmpty) {
      if (!this.listElement.contains(this.emptyElement)) {
        this.listElement.appendChild(this.emptyElement);
      }
			this.container.style.height = 'auto';
      this.listElement.style.maxHeight = "100px";
      this.listElement.style.overflowY = "hidden";
    } else if (this.listElement.contains(this.emptyElement)) {
      this.emptyElement.remove();
      this.listElement.style.maxHeight = "220px";
      this.listElement.style.overflowY = items.length > 3 ? "auto" : "hidden";
    } else {
			this.listElement.style.height = "auto"
		}

    this.submitButton.disabled = isEmpty;
    if (isEmpty) {
      this.submitButton.textContent = "Корзина пуста";
    } else {
      this.submitButton.textContent = "Оформить";
    }
  }

  setTotal(total: number | null): void {
    if (total === null) {
      this.totalElement.textContent = "Бесценно";
    } else {
      const formatted = total.toLocaleString("ru-RU");
      this.totalElement.textContent = `${formatted} синапсов`;
    }
  }

  render(): HTMLElement {
    return this.container;
  }
}
