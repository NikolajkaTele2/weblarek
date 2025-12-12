import "./scss/styles.scss";

import { Gallery } from "./components/Models/Gallery";
import { Basket } from "./components/Models/Basket";
import { Buyer } from "./components/Models/Buyer";

import { CardGallery } from "./components/card/CardGallery";
import { CardPreview } from "./components/card/CardPreview";
import { BasketView } from "./components/base/BasketView";
import { CardBasket } from "./components/card/CardBasket";
import { DeliveryForm } from "./components/forms/DeliveryForm";
import { ContactsForm } from "./components/forms/ContactsForm";
import { SuccessView } from "./components/base/SuccessView";

import { Modal } from "./components/base/Modal";
import { events } from "./components/base/Events";

import { Api } from "./components/base/Api";
import { BuyApi } from "./components/base/BuyAPI";
import { API_URL } from "./utils/constants";
import { IProduct, IOrderData, ISuccessResponse } from "./types";
import { PageView } from "./components/base/PageView";
import { cloneTemplate } from "./utils/utils";

const gallery = new Gallery();
const basket = new Basket();
const buyer = new Buyer();

const basketView = new BasketView(cloneTemplate<HTMLElement>("#basket"));

const page = new PageView();

const previewCard = new CardPreview(
  cloneTemplate<HTMLElement>("#card-preview")
);

const deliveryForm = new DeliveryForm(cloneTemplate<HTMLElement>("#order"));

const contactsForm = new ContactsForm(cloneTemplate<HTMLElement>("#contacts"));

const successView = new SuccessView(cloneTemplate<HTMLElement>("#success"));

const api = new Api(API_URL);
const buyApi = new BuyApi(api);

function openBasket() {
  const content = basketView.render();
  modal.open(content);
}

const modal = new Modal();

buyApi.getProductList().then((items) => {
  gallery.setAllProducts(items);
});

events.on<{ products: IProduct[]; count: number }>(
  "gallery:changed",
  ({ products }) => {
    const cards = products.map((product) => {
      const el = cloneTemplate<HTMLElement>("#card-catalog");
      const card = new CardGallery(el);
      return card.render(product);
    });

    page.setCatalog(cards);
  }
);

events.on<{ id: string }>("product:select", ({ id }) => {
  const product = gallery.getProduct(id);
  if (product) {
    gallery.setDetailedProduct(product);
  } else {
    console.warn(`Товар с ID ${id} не найден`);
  }
});

events.on<{ product: IProduct }>("gallery:selected", ({ product }) => {
  if (!product) {
    return;
  }
  const content = previewCard.render(product);

  const itemsInBasket = basket.getSelectedProducts();
  previewCard.updateButton(itemsInBasket);

  modal.open(content);
});

events.on<{ id: string }>("product:toggle-from-preview", ({ id }) => {
  const product = gallery.getProduct(id);
  if (!product) {
    console.warn(`Товар с ID ${id} не найден`);
    return;
  }
  if (product.price === null) {
    console.warn(`Товар "${product.title}" без цены, пропускаем`);
    return;
  }

  if (basket.hasProduct(id)) {
    basket.removeProduct(id);
  } else {
    basket.addProduct(product);
  }
});

events.on<{ id: string }>("product:add-to-basket", ({ id }) => {
  const product = gallery.getProduct(id);
  if (!product) {
    return;
  }

  if (product.price === null) {
    return;
  }

  if (!basket.hasProduct(id)) {
    basket.addProduct(product);
  }
});

events.on<{ id: string }>("basket:item-remove", ({ id }) => {
  basket.removeProduct(id);
});

events.on<{ items: IProduct[]; total: number; count: number }>(
  "basket:changed",
  ({ items, total, count }) => {
    page.setBasketCounter(count);

    previewCard.updateButton(items);

    const itemNodes = items.map((item, index) => {
      const view = new CardBasket(); // твой класс
      return view.render(item, index);
    });

    basketView.setItems(itemNodes);
    basketView.setTotal(total);
  }
);

events.on("basket:open", () => {
  openBasket();
});

events.on("basket:submit", () => {
  if (basket.getItemsCount() === 0) {
    return;
  }

  const content = deliveryForm.render();
  modal.open(content);
});

events.on<{ payment: "card" | "cash" }>(
  "order:change-payment",
  ({ payment }) => {
    buyer.setBuyerData({ payment });
  }
);

events.on<{ address: string }>("order:change-address", ({ address }) => {
  buyer.setBuyerData({ address });
});

events.on<{ email: string }>("order:change-email", ({ email }) => {
  buyer.setBuyerData({ email });
});

events.on<{ phone: string }>("order:change-phone", ({ phone }) => {
  buyer.setBuyerData({ phone });
});

events.on("buyer:changed", () => {
  const data = buyer.getBuyerData();
  const validation = buyer.validate();

  deliveryForm.updateFields(data);
  deliveryForm.setValidationState({
    canSubmit: !validation.errors.payment && !validation.errors.address,
    errorMessage: validation.errors.payment || validation.errors.address || "",
  });

  contactsForm.updateFields(data);
  contactsForm.setValidationState({
    canSubmit: !validation.errors.email && !validation.errors.phone,
    errorMessage: validation.errors.email || validation.errors.phone || "",
  });
});

events.on("order:submit-stepOne", () => {
  const validation = buyer.validate();
  if (validation.errors.payment || validation.errors.address) {
    return;
  }

  const content = contactsForm.render();
  modal.open(content);
});

events.on("order:submit-stepTwo", () => {
  const items = basket.getSelectedProducts();
  const total = basket.getTotalPrice();
  const buyerData = buyer.getBuyerData();
  const validation = buyer.validate();

  if (Object.keys(validation.errors).length > 0) {
    return;
  }

  if (buyerData.payment !== "card" && buyerData.payment !== "cash") {
    return;
  }

  if (items.length === 0) {
    return;
  }

  const order: IOrderData = {
    payment: buyerData.payment,
    email: buyerData.email,
    phone: buyerData.phone,
    address: buyerData.address,
    total,
    items: items.map((item) => item.id),
  };
  buyApi
    .submitOrder(order)
    .then((result: ISuccessResponse) => {
      const serverTotal = result.total || total;
      const content = successView.render(serverTotal);
      modal.open(content);
      basket.clearBasket();
      buyer.clearData();
    })
    .catch((error) => {
      console.error("Ошибка при оформлении заказа:", error);
    });
});

events.on("success:close", () => {
  modal.close();
});
