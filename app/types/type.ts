import { ReactNode } from "react";

export interface ActionData {
  status: string;
  action: string;
  data?: any;
  errors?: string[]
}
export interface SelectedCollection {
  image: {
    originalSrc: string
  }
  id: string
  title: string
}
interface GiftProduct{
  title:string;
  images:{
originalSrc:string
  }[]
}
export interface GiftProductCardProps {
  giftProduct: GiftProduct;
}
export interface ValidationMessage  {
  message: string
}
export interface DiscountProviderProps {
  children: ReactNode;
}
export interface FieldsProp{
  
  collectionImage:{
    value:string
  }
  collectionTitle:{
    value:string
  }

}