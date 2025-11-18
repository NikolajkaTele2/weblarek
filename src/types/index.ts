export type ApiPostMethods = 'POST' | 'PUT' | 'DELETE';
export type TPayment = 'card' | 'cash' | '';

export interface IApi {
    get<T extends object>(uri: string): Promise<T>;
    post<T extends object>(uri: string, data: object, method?: ApiPostMethods): Promise<T>;
}

// Товар

export interface IProduct {
  id: string; //Уникальный идентификатор продукта
  description: string; //Описание продукта
  image: string; //Ссылка на изображение продукта
  title: string; //Заголовок
  category: string; //Категория продукта
  price: number | null; //Цента продукта, может отсутствовать
}

// Покупатель

export interface IBuyer {
  payment: TPayment; //Способ оплаты карта или наличка (card/cash)
  email: string; //Электронная почта
  phone: string; //Номер телефона
  address: string; //Адрес
}

// ошибки в валидации
export type TBuyerErrors = Partial<Record<keyof IBuyer, string>>;

// Валидация покупателя
export interface IValidationResult { 
    errors: TBuyerErrors;
}

export interface ISuccessResponse {
    id: string;
    total: number;
}
// Заказ для API
export interface IOrderData extends IBuyer {
    total: number; 
    items: string[]; 
}

export interface IProductResponse {
    items: IProduct[];
    total: number;
}
