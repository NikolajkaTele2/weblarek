import { IProduct } from '../../types';
import { events } from '../base/Events';

export class Basket {
  private selectedProducts: IProduct[];

  constructor(initialProducts: IProduct[] = []) {
    this.selectedProducts = initialProducts;
  }

  // получение массива товаров, которые находятся в корзине
  public getSelectedProducts(): IProduct[] {
    return this.selectedProducts;
  }

  // добавление товара, который был получен в параметре, в массив корзины
  public addProduct(product: IProduct): void {
    
    if (this.hasProduct(product.id)) {
        console.log(`🛒 Товар "${product.title}" уже в корзине, не добавляю повторно`);
        return;
    }

    this.selectedProducts.push(product);
    events.emit('basket:changed', {
      items: this.selectedProducts,
      total: this.getTotalPrice(),
      count: this.getItemsCount()
    });
    events.emit('basket:item-added', {
      product,
      basket: this.selectedProducts
    });
  }

  // удаление товара, полученного в параметре из массива корзины
  public removeProduct(productId: string): void {
    const product = this.selectedProducts.find(p => p.id === productId);
    this.selectedProducts = this.selectedProducts.filter(
      product => product.id !== productId
    );
    events.emit('basket:changed', {
      items: this.selectedProducts,
      total: this.getTotalPrice(),
      count: this.getItemsCount()
    });
    if (product) {
      events.emit('basket:item-removed', {
        productId,
        product,
        basket: this.selectedProducts
      });
    }
  }

  // очистка корзины
  public clearBasket(): void {
    this.selectedProducts = [];
    events.emit('basket:changed', {
      items: this.selectedProducts,
      total: this.getTotalPrice(),
      count: this.getItemsCount()
    });
    events.emit('basket:cleared', {});
  }

  // получение стоимости всех товаров в корзине
  public getTotalPrice(): number {
    return this.selectedProducts.reduce((total, product) => {
      return total + (product.price || 0);
    }, 0);
  }

  // получение количества товаров в корзине
  public getItemsCount(): number {
    return this.selectedProducts.length;
  }

  // проверка наличия товара в корзине по его id, полученного в параметр метода
  public hasProduct(productId: string): boolean {
    return this.selectedProducts.some(product => product.id === productId);
  }
}