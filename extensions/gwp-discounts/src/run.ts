import type {
  RunInput,
  FunctionRunResult
} from "../generated/api";
import {
  DiscountApplicationStrategy,
} from "../generated/api";

import { PromoDetail, Product } from "./types/global"

const EMPTY_DISCOUNT: FunctionRunResult = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};


export function run(input: RunInput): FunctionRunResult {
  console.log("GWP Promotion Running")
  const lineItems = input.cart.lines
  let promoDetail: PromoDetail = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  const giftProduct : Product = JSON.parse(promoDetail.giftProduct)
  let quantityPromo: boolean = false 
  //console.log("promoDetail",promoDetail.promoType)
  if(promoDetail.promoType == 'gwp_quantity'){
    let results = []
    for(let threshold of promoDetail.thresholds){
      let totalQuantity = 0
      for(let lineItem of lineItems){
        if(lineItem.merchandise.__typename == 'ProductVariant'){
          //lineItem.merchandise.product.inCollections
          const lineItemCols = lineItem.merchandise.product.inCollections
          for(let lineItemCol of lineItemCols){
            if(lineItemCol.isMember && lineItemCol.collectionId === `${threshold.collectionId}`){
              totalQuantity += lineItem.quantity
            }
          }
        }
      }
      const qualifies = totalQuantity >= threshold.quantity
      results.push({
        collectionId: threshold.collectionId,
        totalQuantity,
        qualifies
      })
    }
    if(promoDetail.condition === 'OR'){
      quantityPromo = results.some( result => result.qualifies )
    }
    if(promoDetail.condition === 'AND'){
      quantityPromo = results.every( result => result.qualifies )
    }
  }
  const targets = []
  for(let lineItem of lineItems){
    if(lineItem.gwp?.value && lineItem.gwp?.value == 'FREE' && quantityPromo){
      if(lineItem.merchandise.__typename == 'ProductVariant' && lineItem.merchandise.product.id == giftProduct.id ){
        targets.push({
          cartLine:{
            id: lineItem.id,
            quantity: parseInt(promoDetail.maxQuantity)
          }
        })
      }
    }
  }
  const APPLY_DISCOUNT = {
    discounts: [
      {
        targets,
        value:{
          percentage:{
            value: "100.00"
          }
        }
      }
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First
  }
  if(targets.length === 0){
    return EMPTY_DISCOUNT;
  }
  return APPLY_DISCOUNT
};