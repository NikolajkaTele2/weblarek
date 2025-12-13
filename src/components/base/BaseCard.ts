import { Component } from "./Component";
import { IProduct } from "../../types";
import { ensureElement } from "../../utils/utils";

// Базовый класс для всех карточек товара
export abstract class BaseCard extends Component<IProduct> {
  protected titleElement: HTMLElement;
  protected priceElement: HTMLElement;
  protected categoryElement: HTMLElement;
  protected imageElement: HTMLImageElement;
  protected buttonElement: HTMLButtonElement | null;

  constructor(container: HTMLElement) {
    super(container);

    // Проверяем существование контейнера
    if (!container) {
      throw new Error("Container element is required for BaseCard");
    }

    this.titleElement = ensureElement<HTMLElement>(".card__title", container);
    this.priceElement = ensureElement<HTMLElement>(".card__price", container);
    this.categoryElement = ensureElement<HTMLElement>(
      ".card__category",
      container
    );
    this.imageElement = ensureElement<HTMLImageElement>(
      ".card__image",
      container
    );

    this.buttonElement = container.querySelector(".card__button");
  }

  set title(value: string) {
    this.titleElement.textContent = value;
  }

  set price(value: number | null) {
    this.priceElement.textContent =
      value === null ? "Бесценно" : `${value} синапсов`;
  }

  set category(value: string) {
    this.categoryElement.textContent = value;
  }

  //добавление картинок с проверками
  set image(src: string) {
    this.setImage(this.imageElement, src, this.titleElement.textContent ?? "");

    this.imageElement.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
    };
  }

  setButtonState(disabled: boolean, text?: string) {
    if (!this.buttonElement) return;
    this.buttonElement.disabled = disabled;
    if (text) this.buttonElement.textContent = text;
  }
}
