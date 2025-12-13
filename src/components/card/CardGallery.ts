import { BaseCard } from "../base/BaseCard";
import { IProduct } from "../../types";
import { events } from "../base/Events";
import { CDN_URL, categoryMap } from "../../utils/constants";

export class CardGallery extends BaseCard {
  private id: string = "";

  constructor(container: HTMLElement) {
    if (!container) {
      throw new Error("Container element is required for CardGallery");
    }
    super(container);

    container.addEventListener("click", () => {
      events.emit("product:select", { id: this.id });
    });

    if (this.buttonElement) {
        this.buttonElement.addEventListener("click", (event) => {
          event.stopPropagation();
          events.emit("product:add-to-basket", { id: this.id });
        });
      }
    }

  render(data: IProduct): HTMLElement {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid product data provided to CardCatalog");
    }

    if (!data.id) {
      console.warn("Product without ID provided to CardCatalog");
      return this.container;
    }

    this.id = data.id;

    if (!data.title) {
      console.warn(`Product ${data.id} has empty title`);
    }
    this.title = data.title;
    this.price = data.price;
    this.image = `${CDN_URL}/${data.image}`;
    this.category = data.category;

    this.categoryElement.className = "card__category";

    const map = categoryMap as Record<string, string>;
    const categoryClass = map[data.category];

    if (categoryClass) {
      this.categoryElement.classList.add(categoryClass);
    }

    this.categoryElement.textContent = data.category;

    if (this.buttonElement) {
      if (data.price === null) {
        this.setButtonState(true, "Недоступно");
      } else {
        this.setButtonState(false, "Купить");
      }
    }
    return this.container;
  }
}
