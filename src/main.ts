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
import { IProduct } from './types';

// Объявляем переменные состояния
let gallery: Gallery;
let basket: Basket;
let buyer: Buyer;
let pageView: PageView;
let modal: Modal;
let api: BuyApi;


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
    // 1. Подписываемся на событие изменения корзины
    events.on('basket:changed', (data: { items: IProduct[], total: number, count: number }) => {
        console.log('📦 Событие: basket:changed');
        handleBasketChanged(data);
    });

    console.log('Main: подписываюсь на basket:open');
    events.on('basket:open', () => {
        console.log('✅ Main: получено basket:open - ОТКРЫВАЮ КОРЗИНУ');
        openBasketModal();
    });
    
    // 2. Подписываемся на добавление товара в корзину
    events.on('product:add-to-basket', (data: { id: string }) => {
        console.log('➕ Событие: product:add-to-basket', data.id);
        handleAddToBasket(data.id);
    });
    
    // 3. Подписываемся на выбор товара для просмотра
    events.on('product:select', (data: { id: string }) => {
        console.log('👁️ Событие: product:select', data.id);
        handleProductSelect(data.id);
    });
    // 4. 
    events.on('gallery:selected', (data: { product: IProduct }) => {
        console.log('👁️ Событие: gallery:selected получено');
        if (data && data.product) {
            openProductPreview(data.product);
        } else {
            console.error('❌ Нет данных о товаре в событии gallery:selected');
        }
    });
    events.on('product:toggle-from-preview', (data: { id: string }) => {
      console.log('🔄 Main: получено событие product:toggle-from-preview', data.id);
      handleToggleFromPreview(data.id);
    });
}

function openBasketModal(): void {
    console.log('🛒 openBasketModal вызван!');
    
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
                
                // Добавить обработчик удаления
                if (deleteButton) {
                    deleteButton.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        console.log(`🗑️ Удаление товара из корзины: ${item.id}`);
                        basket.removeProduct(item.id);
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
                events.emit('order:start');
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

// Запуск при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('Start Initialization');
    initializeApp();
});