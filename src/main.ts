import './scss/styles.scss';
import { Gallery } from './components/Models/Gallery';
import { Basket } from './components/Models/Basket';
import { Buyer } from './components/Models/Buyer';
import { IBuyer, IProduct } from './types';
import { apiProducts } from './utils/data'



const myGallery = new Gallery();
const myBasket = new Basket();
const myBuyer = new Buyer();

console.log("TEST GALLERY")

myGallery.setAllProducts(apiProducts.items)

console.log("all products", myGallery.getAllProducts())
console.log("count products", myGallery.getAllProducts().length)

const existingProduct = myGallery.getProduct('c101ab44-ed99-4a54-990d-47aa2bb4e7d9')
console.log("one item by id", existingProduct)
const noProduct = myGallery.getProduct('bla-bla-bla')
console.log("if no product with id", noProduct)

myGallery.setDetailedProduct(existingProduct!)
console.log("Detailed item", myGallery.getDetailedProduct())
myGallery.setDetailedProduct(noProduct!)
console.log("no item", myGallery.getDetailedProduct())

console.log("=========================================^_^==================================================")

console.log("TEST BASKET")

myBasket.addProduct(apiProducts.items[1])
myBasket.addProduct(apiProducts.items[2])

console.log("Check our basket")

console.log('Items in basket', myBasket.getSelectedProducts());
console.log('Count Items', myBasket.getItemsCount());
console.log('Total price', myBasket.getTotalPrice());
console.log('Check no item', myBasket.hasProduct('1'));
console.log('Check yes item', myBasket.hasProduct('c101ab44-ed99-4a54-990d-47aa2bb4e7d9'));

myBasket.removeProduct('c101ab44-ed99-4a54-990d-47aa2bb4e7d9')

console.log('Items in basket after remove', myBasket.getSelectedProducts());

myBasket.clearBasket()

console.log('Items in basket after clear', myBasket.getSelectedProducts());

console.log("=========================================^_^==================================================")

console.log('TEST BUYER')

myBuyer.setBuyerData({
  payment: 'card',
  address: 'Baker street 221B'
})

console.log('add payment and address', myBuyer.getBuyerData())

myBuyer.setEmail('IAmSherlocked@gmail.com')
console.log('add mail', myBuyer.getBuyerData())

myBuyer.setPhone('8-800-555-35-35')
console.log('add phone', myBuyer.getBuyerData())

console.log('validate', myBuyer.validate())

myBuyer.setAddress('')
console.log('delete address', myBuyer.getBuyerData())
console.log('validate', myBuyer.validate())

console.log('FINISH TEST')
console.log("=========================================^_^==================================================")

