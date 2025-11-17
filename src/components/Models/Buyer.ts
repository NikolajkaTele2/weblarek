import { IBuyer, IValidationResult, TPayment } from '../../types';

export class Buyer {
  private _buyerData: Partial<IBuyer>

  constructor(initialData: Partial<IBuyer> = {}) {
    this._buyerData = initialData;
  }

  // сохранение данных в модели
  public setBuyerData(data: Partial<IBuyer>): void {
    // Фильтруем payment, чтобы допускать только валидные значения
    const filteredData: Partial<IBuyer> = { ...data };
    
    if (data.payment && data.payment !== 'card' && data.payment !== 'cash') {
        // Если payment невалидный, не сохраняем его
        delete filteredData.payment;
    }
    
    this._buyerData = { ...this._buyerData, ...filteredData };
  }

  // отдельное сохранение способа оплаты
  public setPayment(payment: TPayment): void {
    this._buyerData.payment = payment;
  }

  // отдельное сохранение почты
  public setEmail(email: string): void {
    this._buyerData.email = email;
  }

  // отдельное сохранение телефона
  public setPhone(phone: string): void {
      this._buyerData.phone = phone;
  }

  // отдельное сохранение адреса
  public setAddress(address: string): void {
    this._buyerData.address = address;
  }

  // получение всех данных покупателя
  public getBuyerData(): Partial<IBuyer> {
    return { ...this._buyerData };
  }

  // очистка данных покупателя
  public clearData(): void {
    this._buyerData = {};
  }

  // проверка валидности полей
  public validate(): IValidationResult {
    const errors: IValidationResult['errors'] = {};
    
    if (!this._buyerData.payment) {
        errors.payment = 'Способ оплаты обязателен для заполнения';
    }
    
    if (!this._buyerData.email?.trim()) {
        errors.email = 'Email обязателен для заполнения';
    }
    
    if (!this._buyerData.phone?.trim()) {
        errors.phone = 'Телефон обязателен для заполнения';
    }
    
    if (!this._buyerData.address?.trim()) {
        errors.address = 'Адрес обязателен для заполнения';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // проверка валидности отдельного поля
  public validateField(field: keyof IBuyer): { isValid: boolean; error?: string } {
    const value = this._buyerData[field];
    
    if (field === 'payment') {
      if (!value || value === '') {
        return { 
          isValid: false, 
          error: 'Способ оплаты обязателен для заполнения' 
        };
      } else if (value !== 'card' && value !== 'cash') {
        return { 
          isValid: false, 
          error: 'Способ оплаты должен быть "card" или "cash"' 
        };
      }
    } else {
      if (!(value as string)?.trim()) {
        return { 
          isValid: false, 
          error: `${this.getFieldName(field)} обязателен для заполнения` 
        };
      }
    }
    
    return { isValid: true };
  }


  // вспомогательная функция для validateField, которая возвращает запрашиваемое поле
  private getFieldName(field: keyof IBuyer): string {
    const names = {
        payment: 'Способ оплаты',
        email: 'Email',
        phone: 'Телефон',
        address: 'Адрес'
    };
    return names[field];
  }
}