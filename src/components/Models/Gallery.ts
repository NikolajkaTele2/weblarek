import { IProduct } from '../../types';

export class Gallery {
  private _allProducts: IProduct[] = [];
  private _selectedProduct: IProduct | null = null;

  constructor(products?: IProduct[], selectedProduct?: IProduct) {
    this._allProducts = products || [];
    this._selectedProduct = selectedProduct || null;
  }

  // сохранение массива товаров полученного в параметрах метода
  public setAllProducts(products: IProduct[]) {
    this._allProducts = products;
  }

  // получение массива товаров из модели
  public getAllProducts(): IProduct[] {
    return this._allProducts;
  }

  // получение одного товара по его id
  public getProduct(id: string): IProduct | undefined {
    return this._allProducts.find(product => product.id === id);
  }

  // сохранение товара для подробного отображения
  public setDetailedProduct(product: IProduct) {
    this._selectedProduct = product;
  }

  // получение товара для подробного отображения
  public getDetailedProduct(): IProduct | null {
    return this._selectedProduct;
  }
}
