import { IBuyer, IValidationResult, TPayment } from '../../types'; 

export class Buyer {
  private payment: TPayment;
  private address: string;
  private email: string;
  private phone: string;

  constructor(initialData: Partial<IBuyer> = {}) {
    // Инициализируем поля с дефолтными значениями
    this.payment = initialData.payment || '';
    this.email = initialData.email || '';
    this.phone = initialData.phone || '';
    this.address = initialData.address || '';
  }

  // сохранение данных в модели
  public setBuyerData(data: Partial<IBuyer>): void {

    if (data.payment !== undefined) {
      this.payment = data.payment;
    }
    if (data.email !== undefined) {
      this.email = data.email;
    }
    if (data.phone !== undefined) {
      this.phone = data.phone;
    }
    if (data.address !== undefined) {
      this.address = data.address;
    }
  }

  // получение всех данных покупателя
  public getBuyerData(): IBuyer {
    return {
      payment: this.payment,
      email: this.email,
      phone: this.phone,
      address: this.address
    };
  }

  // очистка данных покупателя
  public clearData(): void {
    this.payment = '';
    this.email = '';
    this.phone = '';
    this.address = '';
  }

  // проверка валидности полей
  public validate(): IValidationResult {
    const errors: IValidationResult['errors'] = {};
    
    // Проверка способа оплаты
    if (!this.payment) {
      errors.payment = 'Способ оплаты обязателен для заполнения';
    } else if (this.payment !== 'card' && this.payment !== 'cash') {
      errors.payment = 'Способ оплаты должен быть "card" или "cash"';
    }
    
    // Проверка email
    if (!this.email.trim()) {
      errors.email = 'Email обязателен для заполнения';
    }
    
    // Проверка телефона
    if (!this.phone.trim()) {
      errors.phone = 'Телефон обязателен для заполнения';
    }
    
    // Проверка адреса
    if (!this.address.trim()) {
      errors.address = 'Адрес обязателен для заполнения';
    }

    return { errors } ;
  }
}