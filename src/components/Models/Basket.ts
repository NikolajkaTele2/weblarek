import { IProduct } from '../../types';

export class Basket {
  private _selectedProducts: IProduct[];

  constructor(initialProducts: IProduct[] = []) {
    this._selectedProducts = initialProducts;
  }

  // получение массива товаров, которые находятся в корзине
  public getSelectedProducts(): IProduct[] {
    return this._selectedProducts;
  }

  // добавление товара, который был получен в параметре, в массив корзины
  public addProduct(product: IProduct): void {
    this._selectedProducts.push(product);
  }

  // удаление товара, полученного в параметре из массива корзины
  public removeProduct(productId: string): void {
    this._selectedProducts = this._selectedProducts.filter(
      product => product.id !== productId
    );
  }

  // очистка корзины
  public clearBasket(): void {
    this._selectedProducts = [];
  }

  // получение стоимости всех товаров в корзине
  public getTotalPrice(): number {
    return this._selectedProducts.reduce((total, product) => {
      return total + (product.price || 0);
    }, 0);
  }

  // получение количества товаров в корзине
  public getItemsCount(): number {
    return this._selectedProducts.length;
  }

  // проверка наличия товара в корзине по его id, полученного в параметр метода
  public hasProduct(productId: string): boolean {
    return this._selectedProducts.some(product => product.id === productId);
  }
}