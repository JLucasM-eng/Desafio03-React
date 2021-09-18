import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {

     const storagedCart = localStorage.getItem('@RocketShoes:cart');
     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const ExistentProduct = updatedCart.find(product=>product.id ===productId)
      const stock = await api.get(`/stock/${productId}`)
      const newProduct = await api.get(`/products/${productId}`)
      if(ExistentProduct){
        if(ExistentProduct.amount<stock.data.amount) {
          updatedCart.forEach((product)=>{
            if(product.id===productId){
              product.amount=product.amount+1
            }
            return product
          })
          
        }else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      }else {

        const newProductAdding = {
          ...newProduct.data,
          amount:1
        }
        updatedCart.push(newProductAdding)

      }
      
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const currentCart = [...cart]
      const ExistentProduct = currentCart.find(product=>product.id ===productId)
      if(ExistentProduct){
        const newCart = currentCart.filter(product => {
          return product.id !== productId
        })
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }else {
        throw Error()
      }
      

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get(`/stock/${productId}`)
      const updatedCart = [...cart]
      if(amount > 0){

        if(amount <= stock.data.amount){
          updatedCart.forEach(product=>{
            if(product.id===productId){
              product.amount = amount
            }
            return product
          })
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

      }else {
        return;
      }
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
