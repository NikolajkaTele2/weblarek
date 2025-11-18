import { IApi, IProduct, IOrderData, ISuccessResponse, IProductResponse } from '../../types'; 

 
export class BuyApi { 
    constructor(private _api: IApi) {} 
 
    async getProductList(): Promise<IProduct[]> { 
        const response = await this._api.get<IProductResponse>('/product/'); 
        return response.items;
    } 
 
    async submitOrder(orderData: IOrderData): Promise<ISuccessResponse> { 
        return await this._api.post<ISuccessResponse>('/order/', orderData); 
    } 
}