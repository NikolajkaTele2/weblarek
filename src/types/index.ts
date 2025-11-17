export type ApiPostMethods = 'POST' | 'PUT' | 'DELETE';

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
  payment: string; //Способ оплаты карта или наличка (card/cash)
  email: string; //Электронная почта
  phone: string; //Номер телефона
  address: string; //Адрес
}

// Валидация покупателя

export interface IValidationResult {
    isValid: boolean;
    errors: {
        payment?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
}
