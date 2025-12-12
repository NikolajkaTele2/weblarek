import { events } from "./Events";
import { ensureElement } from "../../utils/utils";

export abstract class BaseForm {
  protected container: HTMLElement;
  protected formElement: HTMLFormElement;

  // проверка валидности конструктра
  constructor(container: HTMLElement) {
    if (!container) {
      throw new Error("Container element is required for BaseForm");
    }
    this.container = container;

    const form =
      container instanceof HTMLFormElement
        ? container
        : ensureElement<HTMLFormElement>("form", container);

    this.formElement = form;

    this.formElement.addEventListener("input", (event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target.name) {
        console.warn("Input element without name attribute detected:", target);
        return;
      }

      events.emit("form:change", {
        name: target.name,
        value: target.value,
      });
    });
  }

  render(): HTMLElement {
    return this.container;
  }
}
