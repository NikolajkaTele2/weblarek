import { BaseForm } from "../base/BaseForm";
import { events } from "../base/Events";
import { IBuyer } from "../../types";
import { ensureElement, ensureAllElements } from "../../utils/utils";

export class DeliveryForm extends BaseForm {
  private paymentButtons: HTMLButtonElement[];
  private addressInput: HTMLInputElement;
  private errorElement: HTMLElement;
  private submitButton: HTMLButtonElement;

  constructor(container: HTMLElement) {
    if (!container) {
      throw new Error("Container element is required for DeliveryForm");
    }
    super(container);

    this.paymentButtons = ensureAllElements<HTMLButtonElement>(
      ".button_alt",
      this.formElement
    );
    this.addressInput = ensureElement<HTMLInputElement>(
      'input[name="address"]',
      this.formElement
    );
    this.errorElement = ensureElement<HTMLElement>(
      ".form__errors",
      this.formElement
    );
    this.submitButton = ensureElement<HTMLButtonElement>(
      ".order__button",
      this.formElement
    );

    // обработчики кнопок оплаты
    this.paymentButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const val: "card" | "cash" =
          btn.getAttribute("name") === "cash" ? "cash" : "card";
        events.emit("order:change-payment", { payment: val });
      });
    });

    // обработчик адреса
    this.addressInput.addEventListener("input", () => {
      events.emit("order:change-address", { address: this.addressInput.value });
    });

    // отправка формы
    this.formElement.addEventListener("submit", (e) => {
      e.preventDefault();
      events.emit("order:submit-stepOne", {});
    });
  }

  setPayment(payment: "card" | "cash" | ""): void {
    this.paymentButtons.forEach((btn) => {
      const btnName = btn.getAttribute("name");
      const isActive = btnName === payment;
      btn.classList.toggle("button_alt-active", isActive);
    });
  }

  updateFields(data: Partial<IBuyer>): void {
    if (!data) return;

    if (
      data.payment === "card" ||
      data.payment === "cash" ||
      data.payment === ""
    ) {
      this.setPayment(data.payment);
    }

    if (data.address !== undefined) {
      this.addressInput.value = data.address;
    }
  }

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