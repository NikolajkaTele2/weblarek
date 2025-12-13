// Импорт стилей
import "./scss/styles.scss";

// Импорт моделей (Model слой)
import { Gallery } from "./components/Models/Gallery";        // Модель каталога товаров
import { Basket } from "./components/Models/Basket";          // Модель корзины покупок
import { Buyer } from "./components/Models/Buyer";            // Модель данных покупателя

// Импорт View компонентов (View слой)
import { CardGallery } from "./components/card/CardGallery";  // Карточка товара в каталоге
import { CardPreview } from "./components/card/CardPreview";  // Карточка товара в превью
import { BasketView } from "./components/base/BasketView";    // Представление корзины
import { CardBasket } from "./components/card/CardBasket";    // Карточка товара в корзине
import { DeliveryForm } from "./components/forms/DeliveryForm"; // Форма доставки
import { ContactsForm } from "./components/forms/ContactsForm"; // Форма контактов
import { SuccessView } from "./components/base/SuccessView";  // Окно успешного заказа

// Импорт базовых компонентов и EventEmitter
import { Modal } from "./components/base/Modal";              // Модальное окно
import { events } from "./components/base/Events";            // Брокер событий (центральная шина)

// Импорт API слоя
import { Api } from "./components/base/Api";                  // Базовый API класс
import { BuyApi } from "./components/base/BuyAPI";            // API для покупок (наследует/композирует Api)
import { API_URL } from "./utils/constants";                  // Константа с URL API

// Импорт типов TypeScript
import { IProduct, IOrderData, ISuccessResponse } from "./types";

// Импорт View компонентов страницы
import { PageView } from "./components/base/PageView";        // Представление главной страницы
import { cloneTemplate } from "./utils/utils";                // Утилита для клонирования шаблонов

// === ИНИЦИАЛИЗАЦИЯ КОМПОНЕНТОВ ===
// Создание экземпляров моделей (Model слой)
const gallery = new Gallery();        // Управляет каталогом товаров
const basket = new Basket();          // Управляет корзиной покупок (хранит выбранные товары)
const buyer = new Buyer();            // Управляет данными покупателя

// Создание экземпляров View компонентов (View слой)
// Каждый View получает свой DOM-контейнер из HTML-шаблонов
const basketView = new BasketView(cloneTemplate<HTMLElement>("#basket"));
const page = new PageView();
const previewCard = new CardPreview(cloneTemplate<HTMLElement>("#card-preview"));
const deliveryForm = new DeliveryForm(cloneTemplate<HTMLElement>("#order"));
const contactsForm = new ContactsForm(cloneTemplate<HTMLElement>("#contacts"));
const successView = new SuccessView(cloneTemplate<HTMLElement>("#success"));

// Создание API клиентов
const api = new Api(API_URL);          // Базовый API клиент с общими методами
const buyApi = new BuyApi(api);        // Специализированный API для покупок (использует композицию)

// Функция для открытия корзины
function openBasket() {
  const content = basketView.render(); // Получаем DOM корзины из BasketView
  modal.open(content);                 // Открываем в модальном окне
}

// Создание модального окна
const modal = new Modal();

// === ЗАГРУЗКА ДАННЫХ С СЕРВЕРА ===
// Запрашиваем товары с сервера и передаем в модель Gallery
buyApi.getProductList().then((items) => {
  gallery.setAllProducts(items); // Сохраняем товары в модель
  // Автоматически сгенерируется событие "gallery:changed" (если реализовано в Gallery)
});

// === ПОДПИСКА НА СОБЫТИЯ (ЯДРО ПРЕЗЕНТЕРА) ===
// Здесь реализуется связь между View и Model через EventEmitter

// 1. Обработка обновления каталога товаров
events.on<{ products: IProduct[]; count: number }>(
  "gallery:changed",
  ({ products }) => {
    // Создаем карточки товаров для каждого продукта
    const cards = products.map((product) => {
      const el = cloneTemplate<HTMLElement>("#card-catalog"); // Клонируем шаблон
      const card = new CardGallery(el);                       // Создаем View карточки
      return card.render(product);                            // Рендерим с данными товара
    });
    page.setCatalog(cards); // Передаем карточки в PageView для отображения
  }
);

// 2. Обработка выбора товара в каталоге
events.on<{ id: string }>("product:select", ({ id }) => {
  const product = gallery.getProduct(id); // Получаем товар из модели Gallery
  if (product) {
    gallery.setDetailedProduct(product); // Устанавливаем как выбранный товар
    // Gallery должна сгенерировать событие "gallery:selected"
  }
});

// 3. Обработка события "товар выбран для детального просмотра"
events.on<{ product: IProduct }>("gallery:selected", ({ product }) => {
  if (!product) return;
  const content = previewCard.render(product); // Рендерим карточку превью
  const isInBasket = basket.hasProduct(product.id);
  previewCard.updateButton(isInBasket);; // Обновляем состояние кнопки "Купить/Удалить"
  modal.open(content); // Открываем в модальном окне
});

// 4. Обработка добавления/удаления товара из превью
events.on<{ id: string }>("product:toggle-from-preview", ({ id }) => {
  const product = gallery.getProduct(id);
  if (!product) return;
  
  // Проверяем, есть ли у товара цена (блокировка недоступных товаров)
  if (product.price === null) {
    console.warn(`Товар "${product.title}" без цены, пропускаем`);
    return;
  }
  
  // Добавляем или удаляем товар из корзины
  if (basket.hasProduct(id)) {
    basket.removeProduct(id); // Удаляем из корзины
  } else {
    basket.addProduct(product); // Добавляем в корзину
  }
  // Basket сгенерирует события "basket:changed", "basket:item-added/removed"
});

// 5. Обработка добавления товара в корзину из каталога
events.on<{ id: string }>("product:add-to-basket", ({ id }) => {
  const product = gallery.getProduct(id);
  if (!product || product.price === null) return; // Пропускаем товары без цены
  
  if (!basket.hasProduct(id)) {
    basket.addProduct(product); // Добавляем только если еще нет в корзине
  }
});

// 6. Обработка удаления товара из корзины
events.on<{ id: string }>("basket:item-remove", ({ id }) => {
  basket.removeProduct(id); // Удаляем товар из модели Basket
});

// 7. Обработка изменения состояния корзины (главное событие)
events.on<{ items: IProduct[]; total: number; count: number }>(
  "basket:changed",
  ({ items, total, count }) => {
    // 1. Обновляем счетчик в шапке
    page.setBasketCounter(count);
    
    const selectedProduct = gallery.getDetailedProduct();
    if (selectedProduct) {
      // Спрашиваем у Модели Basket: "Этот товар в корзине?"
      const isInBasket = basket.hasProduct(selectedProduct.id);
      // Говорим View: "Покажи кнопку соответственно"
      previewCard.updateButton(isInBasket); // ← передаем BOOLEAN
    }
    
    // 3. Создаем карточки товаров для корзины
    const itemNodes = items.map((item, index) => {
      const view = new CardBasket();
      return view.render(item, index);
    });
    
    // 4. Обновляем представление корзины
    basketView.setItems(itemNodes);
    basketView.setTotal(total);
  }
);

// 8. Обработка открытия корзины
events.on("basket:open", () => {
  openBasket(); // Вызываем функцию открытия корзины
});

// 9. Обработка нажатия "Оформить" в корзине
events.on("basket:submit", () => {
  if (basket.getItemsCount() === 0) return; // Защита от пустой корзины
  
  const content = deliveryForm.render(); // Рендерим форму доставки
  modal.open(content); // Открываем в модальном окне
});

// 10. Обработка изменений в форме доставки
events.on<{ payment: "card" | "cash" }>("order:change-payment", ({ payment }) => {
  buyer.setBuyerData({ payment }); // Сохраняем способ оплаты в модели Buyer
});

events.on<{ address: string }>("order:change-address", ({ address }) => {
  buyer.setBuyerData({ address }); // Сохраняем адрес в модели Buyer
});

// 11. Обработка изменений в форме контактов
events.on<{ email: string }>("order:change-email", ({ email }) => {
  buyer.setBuyerData({ email }); // Сохраняем email в модели Buyer
});

events.on<{ phone: string }>("order:change-phone", ({ phone }) => {
  buyer.setBuyerData({ phone }); // Сохраняем телефон в модели Buyer
});

// 12. Обработка изменения данных покупателя (валидация форм)
events.on("buyer:changed", () => {
  const data = buyer.getBuyerData(); // Получаем все данные покупателя
  const validation = buyer.validate(); // Проверяем валидность
  
  // Обновляем форму доставки
  deliveryForm.updateFields(data);
  deliveryForm.setValidationState({
    canSubmit: !validation.errors.payment && !validation.errors.address,
    errorMessage: validation.errors.payment || validation.errors.address || "",
  });
  
  // Обновляем форму контактов
  contactsForm.updateFields(data);
  contactsForm.setValidationState({
    canSubmit: !validation.errors.email && !validation.errors.phone,
    errorMessage: validation.errors.email || validation.errors.phone || "",
  });
});

// 13. Обработка перехода к форме контактов
events.on("order:submit-stepOne", () => {
  const validation = buyer.validate();
  // Проверяем валидность данных доставки перед переходом
  if (validation.errors.payment || validation.errors.address) return;
  
  const content = contactsForm.render(); // Рендерим форму контактов
  modal.open(content); // Открываем в модальном окне
});

// 14. Обработка отправки заказа (финальный шаг)
events.on("order:submit-stepTwo", () => {
  const items = basket.getSelectedProducts();
  const total = basket.getTotalPrice();
  const buyerData = buyer.getBuyerData();
  const validation = buyer.validate();
  
  // Проверяем все условия перед отправкой
  if (Object.keys(validation.errors).length > 0) return;
  if (buyerData.payment !== "card" && buyerData.payment !== "cash") return;
  if (items.length === 0) return;
  
  // Формируем данные для отправки на сервер
  const order: IOrderData = {
    payment: buyerData.payment,
    email: buyerData.email,
    phone: buyerData.phone,
    address: buyerData.address,
    total,
    items: items.map((item) => item.id),
  };
  
  // Отправляем заказ на сервер
  buyApi.submitOrder(order)
    .then((result: ISuccessResponse) => {
      const serverTotal = result.total || total;
      const content = successView.render(serverTotal); // Показываем окно успеха
      modal.open(content);
      basket.clearBasket(); // Очищаем корзину после успешного заказа
      buyer.clearData();    // Очищаем данные покупателя
    })
    .catch((error) => {
      console.error("Ошибка при оформлении заказа:", error);
    });
});

// 15. Обработка закрытия окна успешного заказа
events.on("success:close", () => {
  modal.close(); // Закрываем модальное окно
});