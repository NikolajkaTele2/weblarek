import './scss/styles.scss';
import { Gallery } from './components/Models/Gallery';
import { Basket } from './components/Models/Basket';
import { Buyer } from './components/Models/Buyer';
import { API_URL } from './utils/constants';
import { BuyApi } from './components/base/BuyAPI';
import { Api } from './components/base/Api';
import { events } from './components/base/Events';
import { PageView } from './components/base/PageView';
import { Modal } from './components/base/Modal';
import { CardGallery } from './components/card/CardGallery';
import { CardPreview } from './components/card/CardPreview';
import { IProduct, TPayment, IOrderData } from './types';


// Объявляем переменные состояния
let gallery: Gallery;
let basket: Basket;
let buyer: Buyer;
let pageView: PageView;
let modal: Modal;
let api: BuyApi;

let basketModalIsOpen = false;

function initializeApp(): void {
    console.log('1: Init App');
    
    // 1. Инициализация моделей
    gallery = new Gallery();
    basket = new Basket();
    buyer = new Buyer();
    
    // 2. Инициализация API
    const baseApi = new Api(API_URL);
    api = new BuyApi(baseApi);
    
    // 3. Инициализация View
    pageView = new PageView();
    modal = new Modal();

    subscribeToEvents();
    
    loadCatalog();
}
async function loadCatalog(): Promise<void> {
    console.log('Шаг 2.1: Загрузка каталога товаров...');
    
    try {
        const products = await api.getProductList();
        console.log('✅ Товары загружены:', products.length, 'шт.');
        
        // Подписываемся на событие изменения каталога
        events.on('gallery:changed', (data: { products: any[], count: number }) => {
            console.log('✅ Событие получено!', data);
            handleCatalogChanged(data);
        });
        
        // Сохраняем товары (вызовет событие)
        gallery.setAllProducts(products);
        console.log('✅ Товары сохранены в модели Gallery');
        
    } catch (error) {
        console.error('❌ Ошибка при загрузке каталога:', error);
    }
}

function openProductPreview(product: IProduct): void {
    console.log(`📖 Открытие превью товара: ${product.title}`);
    
    // 1. Находим шаблон
    const template = document.querySelector('#card-preview') as HTMLTemplateElement;
    if (!template) {
        console.error('❌ Шаблон #card-preview не найден');
        return;
    }
    
    // 2. Клонируем шаблон
    const clonedTemplate = template.content.cloneNode(true) as HTMLElement;
    const container = clonedTemplate.firstElementChild as HTMLElement;

    console.log('openProductPreview: контейнер создан');
    console.log('Кнопка в контейнере:', container.querySelector('.card__button'));  
    
    // 3. Проверяем кнопку в шаблоне
    const button = container.querySelector('.card__button');
    console.log('✅ Кнопка в шаблоне:', button?.textContent);
    
    // 4. Создаем превью
    const preview = new CardPreview(container);
    console.log('openProductPreview: CardPreview создан');
    const previewElement = preview.render(product);
    console.log('openProductPreview: render выполнен');
    
    // 5. Обновляем состояние кнопки
    const isInBasket = basket.hasProduct(product.id);
    console.log(`✅ Товар в корзине? ${isInBasket}`);

    preview.updateButton(basket.getSelectedProducts());
    console.log('✅ Кнопка обновлена');
    
    // 6. Открываем модальное окно
    modal.open(previewElement);
    console.log('✅ Превью товара открыто');
}

function handleCatalogChanged(data: { products: any[] }): void {
    console.log('Шаг 3.1: Обработка изменения каталога...');
    console.log('Товаров для отображения:', data.products.length);
    
    // Находим шаблон ОДИН раз
    const template = document.querySelector('#card-catalog') as HTMLTemplateElement;
    if (!template) {
        console.error('❌ Шаблон #card-catalog не найден');
        return;
    }
    
    // Создаем карточки для каждого товара
    const catalogItems = data.products.map(product => {
        // Клонируем шаблон для каждого товара
        const clonedTemplate = template.content.cloneNode(true) as HTMLElement;
        const container = clonedTemplate.firstElementChild as HTMLElement;
        
        // Создаем карточку
        const cardGallery = new CardGallery(container);
        return cardGallery.render(product);
    }).filter((item): item is HTMLElement => item !== null);
    
    console.log('✅ Создано карточек:', catalogItems.length);
    
    // Отображаем каталог на странице
    pageView.setCatalog(catalogItems);
    console.log('✅ Каталог отображен на странице');
}

function subscribeToEvents(): void {
    // ОСТАВЛЯЕМ ТОЛЬКО события от МОДЕЛЕЙ ДАННЫХ и ПРЕДСТАВЛЕНИЙ:
    
    // 1. От моделей данных (должны быть)
    events.on('gallery:changed', (data: { products: any[], count: number }) => {
        console.log('✅ Событие получено!', data);
        handleCatalogChanged(data);
    });
    
    events.on('basket:changed', (data: { items: IProduct[], total: number, count: number }) => {
        console.log('📦 Событие: basket:changed');
        handleBasketChanged(data);     
    });
    
    // 2. От представлений (должны быть)
    events.on('basket:open', () => {
        console.log('✅ Main: получено basket:open - ОТКРЫВАЮ КОРЗИНУ');
        openBasketModal();
    });
    
    events.on('product:add-to-basket', (data: { id: string }) => {
        console.log('➕ Событие: product:add-to-basket', data.id);
        handleAddToBasket(data.id);
    });
    
    events.on('product:select', (data: { id: string }) => {
        console.log('👁️ Событие: product:select', data.id);
        handleProductSelect(data.id);
    });
    
    events.on('gallery:selected', (data: { product: IProduct }) => {
        console.log('👁️ Событие: gallery:selected получено');
        if (data && data.product) {
            openProductPreview(data.product);
        }
    });
    
    events.on('product:toggle-from-preview', (data: { id: string }) => {
        console.log('🔄 Main: получено событие product:toggle-from-preview', data.id);
        handleToggleFromPreview(data.id);
    });
}

function openBasketModal(): void {
    console.log('🛒 openBasketModal вызван!');
    basketModalIsOpen = true;
    
    const items = basket.getSelectedProducts();
    const total = basket.getTotalPrice();
    
    console.log(`Товаров: ${items.length}, Сумма: ${total}`);
    
    // 1. Найти шаблон корзины
    const template = document.querySelector('#basket') as HTMLTemplateElement;
    if (!template) {
        console.error('❌ Шаблон #basket не найден');
        return;
    }
    
    // 2. Клонировать
    const clonedTemplate = template.content.cloneNode(true) as HTMLElement;
    const container = clonedTemplate.firstElementChild as HTMLElement;
    
    // 3. Найти элементы в шаблоне
    const basketElement = container.querySelector('.basket');
    const listElement = container.querySelector('.basket__list');
    const totalElement = container.querySelector('.basket__price') as HTMLElement;
    const buttonElement = container.querySelector('.basket__button') as HTMLButtonElement;

    console.log('Найденные элементы:', { 
        basketElement: !!basketElement,
        listElement: !!listElement,
        totalElement: !!totalElement,
        buttonElement: !!buttonElement 
    });
    
    // 4. Заполнить список товаров ИСПРАВЬ - используй шаблон #card-basket
    if (listElement) {
        listElement.innerHTML = '';
        
        if (items.length === 0) {
            // Корзина пуста
            const emptyElement = document.createElement('li');
            emptyElement.className = 'basket__empty';
            emptyElement.textContent = 'Корзина пуста';
            listElement.appendChild(emptyElement);
        } else {
            // Добавить каждый товар через шаблон #card-basket
            const itemTemplate = document.querySelector('#card-basket') as HTMLTemplateElement;
            
            if (!itemTemplate) {
                console.error('❌ Шаблон #card-basket не найден');
                return;
            }
            
            items.forEach((item, index) => {
                // Клонировать шаблон товара
                const itemTemplateClone = itemTemplate.content.cloneNode(true) as HTMLElement;
                const itemElement = itemTemplateClone.firstElementChild as HTMLElement;
                
                // Заполнить данные
                const indexElement = itemElement.querySelector('.basket__item-index');
                const titleElement = itemElement.querySelector('.card__title');
                const priceElement = itemElement.querySelector('.card__price');
                const deleteButton = itemElement.querySelector('.basket__item-delete');
                
                if (indexElement) indexElement.textContent = String(index + 1);
                if (titleElement) titleElement.textContent = item.title;
                if (priceElement) priceElement.textContent = `${item.price} синапсов`;

                console.log('Поиск элементов в itemElement:');
                console.log('.basket__item-delete:', itemElement.querySelector('.basket__item-delete'));
                console.log('.card__button:', itemElement.querySelector('.card__button'));
                console.log('Все кнопки:', itemElement.querySelectorAll('button'));
                
                // Добавить обработчик удаления
                if (deleteButton) {
                    deleteButton.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        
                        console.log(`🗑️ Удаляю товар: ${item.title}`);
                        basket.removeProduct(item.id);
                        
                        // Если корзина открыта - просто перезагрузить ее
                        if (modal.isOpened()) {
                            console.log('🔄 Перезагружаю корзину...');
                            // Закрыть и открыть заново
                            modal.close();
                            setTimeout(() => openBasketModal(), 50);
                        }
                    });
                }
                
                listElement.appendChild(itemElement);
            });
        }
    }


     // 5. Обновить сумму
    if (totalElement) {
        totalElement.textContent = `${total} синапсов`;
    } else {
        console.error('Элемент .basket__price не найден');
        // Попробуй альтернативный селектор:
        const altTotalElement = container.querySelector('.modal__actions .basket__price');
        if (altTotalElement) {
            altTotalElement.textContent = `${total} синапсов`;
        }
    }
    
// 6. Настроить кнопку "Оформить"
    if (buttonElement) {
        if (items.length === 0) {
            buttonElement.disabled = true;
            buttonElement.textContent = 'Корзина пуста';
        } else {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Оформить';
            
            // Удалить старые обработчики
            const newButton = buttonElement.cloneNode(true) as HTMLButtonElement;
            buttonElement.parentNode?.replaceChild(newButton, buttonElement);
            
            // Добавить новый обработчик
            newButton.addEventListener('click', () => {
              console.log('📝 Нажата кнопка "Оформить"');
              // ВЫЗЫВАЕМ НАПРЯМУЮ, не генерируем событие
              openOrderForm();
            });
        }
    }
    
    // 7. Открыть модальное окно
    console.log('🛒 Открываю модальное окно...');
    modal.open(container);
    console.log('✅ Корзина открыта!');
}

function handleBasketChanged(data: { items: IProduct[], total: number, count: number }): void {
    console.log(`📊 Обновление корзины: ${data.count} товаров, ${data.total} синапсов`);
    
    // Обновляем счетчик в шапке
    pageView.setBasketCounter(data.count);
    console.log('✅ Счетчик корзины обновлен');
}

function handleAddToBasket(productId: string): void {
    console.log(`🛒 Добавление товара в корзину: ${productId}`);
    
    const product = gallery.getProduct(productId);
    if (product) {
        basket.addProduct(product);
        console.log(`✅ Товар "${product.title}" добавлен в корзину`);
    } else {
        console.error(`❌ Товар с ID ${productId} не найден`);
    }
}

function handleProductSelect(productId: string): void {
    console.log(`🔍 Выбор товара для просмотра: ${productId}`);
    
    const product = gallery.getProduct(productId);
    if (product) {
        // Сохраняем товар для детального просмотра
        gallery.setDetailedProduct(product);
        console.log(`✅ Товар "${product.title}" сохранен для превью`);
    } else {
        console.error(`❌ Товар с ID ${productId} не найден`);
    }
}

function handleToggleFromPreview(productId: string): void {
    console.log(`🔄 Обработка переключения товара из превью: ${productId}`);
    
    const product = gallery.getProduct(productId);
    if (!product) {
        console.error(`❌ Товар с ID ${productId} не найден`);
        return;
    }
    
    const isInBasket = basket.hasProduct(productId);
    
    if (isInBasket) {
        console.log(`🗑️ Удаление товара "${product.title}" из корзины`);
        basket.removeProduct(productId);
    } else {
        console.log(`➕ Добавление товара "${product.title}" в корзину`);
        basket.addProduct(product);
    }
}

function openOrderForm(): void {
    console.log('📋 Открытие формы заказа');
    
    const template = document.querySelector('#order') as HTMLTemplateElement;
    if (!template) return;
    
    const clonedTemplate = template.content.cloneNode(true) as HTMLElement;
    const container = clonedTemplate.firstElementChild as HTMLElement;
    
    const form = container.querySelector('form') as HTMLFormElement;
    const addressInput = container.querySelector('input[name="address"]') as HTMLInputElement;
    const onlineButton = container.querySelector('button[name="card"]') as HTMLButtonElement;
    const cashButton = container.querySelector('button[name="cash"]') as HTMLButtonElement;
    const nextButton = container.querySelector('.order__button') as HTMLButtonElement;
    
    // Используем текущие данные из buyer
    const currentData = buyer.getBuyerData();
    let selectedPayment: TPayment = currentData.payment || '';
    let address = currentData.address || '';
    
    // Установить текущие значения в форму
    if (addressInput && address) {
        addressInput.value = address;
    }
    
    // 1. Функция валидации
    const validateForm = (): void => {
        const isValid = selectedPayment !== '' && address.length > 5;
        
        if (nextButton) {
            nextButton.disabled = !isValid;
            console.log('Форма валидна?', isValid, 'payment:', selectedPayment, 'address:', address);
        }
    };
    
    // 2. Обработчики оплаты
    if (onlineButton) {
        onlineButton.addEventListener('click', () => {
            selectedPayment = 'card';
            console.log('Выбрана онлайн оплата (card)');
            
            const allPaymentButtons = container.querySelectorAll('.order__buttons .button');
            allPaymentButtons.forEach(btn => {
                btn.classList.remove('button_alt-active');
            });
            
            onlineButton.classList.add('button_alt-active');
            
            buyer.setBuyerData({ payment: 'card' });
            validateForm();
        });
    }
    
    if (cashButton) {
        cashButton.addEventListener('click', () => {
            selectedPayment = 'cash';
            console.log('Выбрана оплата при получении (cash)');
            
            const allPaymentButtons = container.querySelectorAll('.order__buttons .button');
            allPaymentButtons.forEach(btn => {
                btn.classList.remove('button_alt-active');
            });
            
            cashButton.classList.add('button_alt-active');
            
            buyer.setBuyerData({ payment: 'cash' });
            validateForm();
        });
    }
    
    // 3. Обработчик адреса
    if (addressInput) {
        if (address) addressInput.value = address;
        
        addressInput.addEventListener('input', () => {
            address = addressInput.value.trim();
            console.log('Адрес:', address);
            
            buyer.setBuyerData({ address });
            validateForm();
        });
    }
    
    console.log('🔍 openOrderForm вызван, форма:', form);
    if (form) {
        console.log('🔍 Form имеет action?:', form.action);
        console.log('🔍 Form method:', form.method);
        form.addEventListener('submit', function(event) {
            console.log('=== FORM SUBMIT ===');
            event.preventDefault();
            
            console.log('selectedPayment:', selectedPayment, 'address:', address);
            
            if (selectedPayment && address) {
                console.log('✅ Шаг 1 оформления завершен');
                
                modal.close();
                
                // ВЫЗЫВАЕМ НАПРЯМУЮ, не генерируем событие
                setTimeout(() => {
                    openContactsForm();
                }, 100);
            }          
            return false;
        });
    }
    // Инициализируем валидацию
    validateForm();
    
    console.log('=== ПРОВЕРКА КНОПОК ПЕРЕД ОТКРЫТИЕМ ===');
    console.log('Онлайн кнопка классы:', onlineButton?.className);
    console.log('Наличная кнопка классы:', cashButton?.className);

    modal.open(container);
}

function openContactsForm(): void {
    console.log('📞 Открытие формы контактов');
    
    const template = document.querySelector('#contacts') as HTMLTemplateElement;
    if (!template) return;
    
    const clonedTemplate = template.content.cloneNode(true) as HTMLElement;
    const container = clonedTemplate.firstElementChild as HTMLElement;
    
    const form = container.querySelector('form[name="contacts"]') as HTMLFormElement;
    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const phoneInput = container.querySelector('input[name="phone"]') as HTMLInputElement;
    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    // Используем текущие данные
    const currentData = buyer.getBuyerData();
    let email = currentData.email || '';
    let phone = currentData.phone || '';
    
    // Установить текущие значения
    if (emailInput && email) emailInput.value = email;
    if (phoneInput && phone) phoneInput.value = phone;
    
    // 1. Обработчик email
    if (emailInput) {
        emailInput.addEventListener('input', () => {
            email = emailInput.value.trim();
            console.log('Email:', email);
            
            // Сохраняем в buyer
            buyer.setBuyerData({ email });
            validateForm();
        });
    }
    
    // 2. Обработчик телефона
    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            phone = phoneInput.value.trim();
            console.log('Телефон:', phone);
            
            // Сохраняем в buyer
            buyer.setBuyerData({ phone });
            validateForm();
        });
    }
    
    // 3. Валидация (упрощенная)
    function validateForm(): void {
        const emailValid = email.includes('@') && email.includes('.');
        const phoneValid = phone.length >= 10;
        const isValid = emailValid && phoneValid;
        
        if (submitButton) {
            submitButton.disabled = !isValid;
            console.log('Форма контактов валидна?', isValid);
        }
    }
    
    // Инициализируем валидацию
    validateForm();
    
    // 4. Обработчик отправки
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            
            if (email && phone) {
                console.log('✅ Шаг 2 оформления завершен');
                
                const validation = buyer.validate();
                if (Object.keys(validation.errors).length === 0) {
                    // ВЫЗЫВАЕМ НАПРЯМУЮ
                    submitOrder();
                }
            }
        });
    }
    
    modal.open(container);
}

async function submitOrder(): Promise<void> {
    console.log('🚀 Отправка заказа...');
    
    // 1. Проверить валидность данных
    const validation = buyer.validate();
    if (Object.keys(validation.errors).length > 0) {
        console.error('❌ Данные невалидны:', validation.errors);
        return;
    }
    
    // 2. Собрать данные для заказа
    const buyerData = buyer.getBuyerData();
    
    // Проверяем, что payment точно 'card' или 'cash'
    if (buyerData.payment !== 'card' && buyerData.payment !== 'cash') {
        console.error('❌ Неверный способ оплаты:', buyerData.payment);
        return;
    }
    
    const orderData: IOrderData = {
        payment: buyerData.payment, // Теперь точно 'card' | 'cash'
        email: buyerData.email,
        phone: buyerData.phone,
        address: buyerData.address,
        total: basket.getTotalPrice(),
        items: basket.getSelectedProducts().map(item => item.id)
    };
    
    console.log('Данные для отправки:', orderData);
    console.log('Товары в заказе:', basket.getSelectedProducts().map(p => p.title));
    
    try {
        // 3. Отправка на сервер
        console.log('📤 Отправляю заказ на сервер...');
        const result = await api.submitOrder(orderData);
        console.log('✅ Заказ успешно отправлен:', result);
        
        // 4. Очистить корзину и данные покупателя
        basket.clearBasket();
        buyer.clearData();
        
        // 5. Показать окно успеха
        openSuccessModal(result.total);
        
    } catch (error) {
        console.error('❌ Ошибка при отправке заказа:', error);
    }
}

function openSuccessModal(total: number): void {
    console.log('🎉 Открытие окна успешного заказа, сумма:', total);
    
    const template = document.querySelector('#success') as HTMLTemplateElement;
    if (!template) {
        console.error('❌ Шаблон #success не найден');
        return;
    }
    
    const clonedTemplate = template.content.cloneNode(true) as HTMLElement;
    const container = clonedTemplate.firstElementChild as HTMLElement;
    
    // Найти элементы
    const description = container.querySelector('.order-success__description') as HTMLElement;
    const closeButton = container.querySelector('.order-success__close') as HTMLButtonElement;
    
    // Заполнить сумму
    if (description) {
        description.textContent = `Списано ${total} синапсов`;
    }
    
    // Обработчик закрытия
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            console.log('Закрытие окна успеха');
            modal.close();
        });
    }
    
    // Открыть модальное окно
    modal.open(container);
    console.log('✅ Окно успеха открыто');
}

// Запуск при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('Start Initialization');
    initializeApp();
});