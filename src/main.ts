import './scss/styles.scss';

import { Gallery } from './components/Models/Gallery';
import { Basket } from './components/Models/Basket';
import { Buyer } from './components/Models/Buyer';

import { CardGallery } from './components/card/CardGallery';
import { CardPreview } from './components/card/CardPreview';
import { BasketView } from './components/base/BasketView';
import { CardBasket } from './components/card/CardBasket';
import { DeliveryForm } from './components/forms/DeliveryForm';
import { ContactsForm } from './components/forms/ContactsForm';
import { SuccessView } from './components/base/SuccessView';

import { Modal } from './components/base/Modal';
import { events } from './components/base/Events';

import { Api } from './components/base/Api';
import { BuyApi } from './components/base/BuyAPI';
import { API_URL } from './utils/constants';
import { IProduct, IOrderData, ISuccessResponse } from './types';
import { PageView } from './components/base/PageView';
import { cloneTemplate } from './utils/utils';

// -------- МОДЕЛИ (твои имена) --------
const gallery = new Gallery();
const basket = new Basket();
const buyer = new Buyer();

// -------- VIEW-СЛОЙ (твои имена) --------
const basketView = new BasketView(
	cloneTemplate<HTMLElement>('#basket')
);

const page = new PageView();

const previewCard = new CardPreview(
	cloneTemplate<HTMLElement>('#card-preview')
);

const deliveryForm = new DeliveryForm(
	cloneTemplate<HTMLElement>('#order')
);

const contactsForm = new ContactsForm(
	cloneTemplate<HTMLElement>('#contacts')
);

const successView = new SuccessView(
	cloneTemplate<HTMLElement>('#success')
);

// -------- API (твои имена) --------
const api = new Api(API_URL);
const buyApi = new BuyApi(api);

// -------- ВСПОМОГАТЕЛЬНОЕ --------
function openBasket() {
	const content = basketView.render();
	modal.open(content);
}

const modal = new Modal();

// -------- ЗАГРУЗКА КАТАЛОГА --------
buyApi
	.getProductList()
	.then((items) => {
		gallery.setAllProducts(items);
	})
	.catch((error) => {
		console.error('Ошибка при загрузке каталога:', error);
		// МОЖНО ДОБАВИТЬ: показать пользователю сообщение об ошибке
	});

// -------- ПРЕЗЕНТЕР: КАТАЛОГ --------

// 1. Каталог изменился → отображаем карточки
events.on<{ products: IProduct[], count: number }>('gallery:changed', ({ products }) => {
	console.log(`Презентер: Загружено ${products.length} товаров`);
	
	const cards = products.map((product) => {
		const el = cloneTemplate<HTMLElement>('#card-catalog');
		const card = new CardGallery(el);
		return card.render(product);
	});

	page.setCatalog(cards);
});

// 2. Выбрали товар в галерее → сохраняем для детального просмотра
events.on<{ id: string }>('product:select', ({ id }) => {
	console.log(`Презентер: Выбран товар ID: ${id}`);
	
	const product = gallery.getProduct(id);
	if (product) {
		gallery.setDetailedProduct(product);
	} else {
		console.warn(`Товар с ID ${id} не найден`);
	}
});

// 3. Товар сохранен для детального просмотра → открываем превью
events.on<{ product: IProduct }>('gallery:selected', ({ product }) => {
	if (!product) {
		console.warn('Попытка открыть превью без товара');
		return;
	}

	console.log(`Презентер: Открываем превью товара: ${product.title}`);
	
	const content = previewCard.render(product);

	// Обновляем состояние кнопки (в корзине/не в корзине)
	const itemsInBasket = basket.getSelectedProducts();
	previewCard.updateButton(itemsInBasket);

	modal.open(content);
});

// 4. В превью нажали кнопку покупки/удаления → работаем с корзиной
events.on<{ id: string }>('product:toggle-from-preview', ({ id }) => {
	const product = gallery.getProduct(id);
	if (!product) {
		console.warn(`Товар с ID ${id} не найден`);
		return;
	}

	// Защита: товары без цены нельзя добавлять в корзину
	if (product.price === null) {
		console.warn(`Товар "${product.title}" без цены, пропускаем`);
		return;
	}

	if (basket.hasProduct(id)) {
		console.log(`Удаляем из корзины: ${product.title}`);
		basket.removeProduct(id);
	} else {
		console.log(`Добавляем в корзину: ${product.title}`);
		basket.addProduct(product);
	}
});

// 5. Нажали "Купить" в карточке галереи → добавляем в корзину
events.on<{ id: string }>('product:add-to-basket', ({ id }) => {
	const product = gallery.getProduct(id);
	if (!product) {
		console.warn(`Товар с ID ${id} не найден`);
		return;
	}

	// Защита от бесплатных товаров
	if (product.price === null) {
		console.warn(`Товар "${product.title}" без цены, пропускаем`);
		return;
	}

	// Защита от дублирования
	if (!basket.hasProduct(id)) {
		console.log(`Быстрое добавление в корзину: ${product.title}`);
		basket.addProduct(product);
	}
});

// -------- ПРЕЗЕНТЕР: КОРЗИНА --------

// 1. Удаление товара из корзины
events.on<{ id: string }>('basket:item-remove', ({ id }) => {
	console.log(`Презентер: Удаление товара из корзины ID: ${id}`);
	basket.removeProduct(id);
});

// 2. Корзина изменилась → обновляем все связанные компоненты
events.on<{ items: IProduct[], total: number, count: number }>('basket:changed', ({ items, total, count }) => {
	console.log(`Презентер: Корзина изменена. Товаров: ${count}, Сумма: ${total}`);
	
	// Счётчик в шапке
	page.setBasketCounter(count);

	// Кнопка в превью (если открыто)
	previewCard.updateButton(items);

	// Список и сумма в окне корзины (если открыто)
	const itemNodes = items.map((item, index) => {
		const view = new CardBasket(); // твой класс
		return view.render(item, index);
	});
	
	basketView.setItems(itemNodes);
	basketView.setTotal(total);
});

// 3. Открытие корзины
events.on('basket:open', () => {
	console.log('Презентер: Открытие корзины');
	openBasket();
});

// 4. Нажали "Оформить" в корзине
events.on('basket:submit', () => {
	console.log('Презентер: Нажали "Оформить" в корзине');
	
	// Проверяем, что корзина не пуста
	if (basket.getItemsCount() === 0) {
		console.warn('Попытка оформить пустую корзину');
		return;
	}
	
	const content = deliveryForm.render();
	modal.open(content);
});

// -------- ПРЕЗЕНТЕР: ФОРМЫ --------

// 1. Изменения в формах → сохраняем в модели
events.on<{ payment: 'card' | 'cash' }>('order:change-payment', ({ payment }) => {
	console.log(`Презентер: Способ оплаты изменен: ${payment}`);
	buyer.setBuyerData({ payment });
});

events.on<{ address: string }>('order:change-address', ({ address }) => {
	console.log(`Презентер: Адрес изменен: ${address}`);
	buyer.setBuyerData({ address });
});

events.on<{ email: string }>('order:change-email', ({ email }) => {
	console.log(`Презентер: Email изменен: ${email}`);
	buyer.setBuyerData({ email });
});

events.on<{ phone: string }>('order:change-phone', ({ phone }) => {
	console.log(`Презентер: Телефон изменен: ${phone}`);
	buyer.setBuyerData({ phone });
});

// 2. Данные покупателя изменились → валидируем и обновляем формы
events.on('buyer:changed', () => {
	console.log('Презентер: Данные покупателя изменены');
	
	const data = buyer.getBuyerData();
	const validation = buyer.validate();

	// Форма доставки
	deliveryForm.updateFields(data);
	deliveryForm.setValidationState({
		canSubmit: !validation.errors.payment && !validation.errors.address,
		errorMessage: validation.errors.payment || validation.errors.address || '',
	});

	// Форма контактов
	contactsForm.updateFields(data);
	contactsForm.setValidationState({
		canSubmit: !validation.errors.email && !validation.errors.phone,
		errorMessage: validation.errors.email || validation.errors.phone || '',
	});
});

// 3. Первый шаг формы (доставка) пройден
events.on('order:submit-stepOne', () => {
	console.log('Презентер: Шаг 1 формы пройден');
	
	const validation = buyer.validate();
	
	if (validation.errors.payment || validation.errors.address) {
		console.warn('Шаг 1 не пройден, есть ошибки:', validation.errors);
		return;
	}
	
	const content = contactsForm.render();
	modal.open(content);
});

// 4. Второй шаг формы (контакты) пройден → отправляем заказ
events.on('order:submit-stepTwo', () => {
	console.log('Презентер: Шаг 2 формы пройден, отправляем заказ');
	
	const items = basket.getSelectedProducts();
	const total = basket.getTotalPrice();
	const buyerData = buyer.getBuyerData();
	const validation = buyer.validate();

	// Проверка валидности
	if (Object.keys(validation.errors).length > 0) {
		console.error('Данные невалидны:', validation.errors);
		// МОЖНО ДОБАВИТЬ: показать ошибки пользователю
		return;
	}

	// Проверяем, что payment точно 'card' или 'cash'
	if (buyerData.payment !== 'card' && buyerData.payment !== 'cash') {
		console.error('Неверный способ оплаты:', buyerData.payment);
		return;
	}

	// Проверяем, что корзина не пуста
	if (items.length === 0) {
		console.error('Корзина пуста, нельзя оформить заказ');
		return;
	}

	const order: IOrderData = {
		payment: buyerData.payment,
		email: buyerData.email,
		phone: buyerData.phone,
		address: buyerData.address,
		total,
		items: items.map((item) => item.id)
	};

	console.log('Отправляем заказ:', order);

	buyApi
		.submitOrder(order)
		.then((result: ISuccessResponse) => {
			console.log('Заказ успешно оформлен:', result);
			
			const serverTotal = result.total || total;
			const content = successView.render(serverTotal);
			modal.open(content);

			// Очищаем корзину и данные покупателя
			basket.clearBasket();
			buyer.clearData();
		})
		.catch((error) => {
			console.error('Ошибка при оформлении заказа:', error);
			// МОЖНО ДОБАВИТЬ: показать пользователю понятное сообщение
			alert('Не удалось оформить заказ. Пожалуйста, попробуйте ещё раз.');
		});
});

// 5. Закрытие окна успеха
events.on('success:close', () => {
	console.log('Презентер: Закрываем окно успеха');
	modal.close();
});

// -------- ДОПОЛНИТЕЛЬНЫЕ ОБРАБОТЧИКИ --------

// Закрытие модального окна любым способом
events.on('modal:close', () => {
	console.log('Презентер: Модальное окно закрыто');
	// Можно добавить сброс состояния форм, если нужно
});

// Открытие модального окна
events.on('modal:open', () => {
	console.log('Презентер: Модальное окно открыто');
});

