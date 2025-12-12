import { events } from "../base/Events";
import { ensureAllElements } from "../../utils/utils";

export class SuccessView {
  private container: HTMLElement;
  private button: HTMLButtonElement | null;
  // private descriptionElement: HTMLElement | null;

  constructor(container: HTMLElement) {
    if (!container) {
      throw new Error("Container element is required for SuccessView");
    }

    this.container = container;

    const [primaryButton] = ensureAllElements<HTMLButtonElement>(
      ".success__button",
      container
    );
    const [typeButton] = ensureAllElements<HTMLButtonElement>(
      'button[type="button"]',
      container
    );
    const [anyButton] = ensureAllElements<HTMLButtonElement>(
      "button",
      container
    );

    this.button = primaryButton ?? typeButton ?? anyButton ?? null;

    // const [successDescription] = ensureAllElements<HTMLElement>('.success__description',container);
    // const [modalDescription] = ensureAllElements<HTMLElement>('.modal__description',container);

    // this.descriptionElement = successDescription ?? modalDescription ?? null;

    if (this.button) {
      this.button.addEventListener("click", () => {
        events.emit("success:close", {});
      });
    }
  }

  render(total: number = 0): HTMLElement {
    const [priceElement] = ensureAllElements<HTMLElement>(
      ".order-success__description",
      this.container
    );

    if (priceElement) {
      priceElement.textContent = `Списано ${total} синапсов`;
    }
    return this.container;
  }
}
