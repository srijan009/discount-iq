export type Thresold = {
  collectionId : number
  collectionImage: string
  collectionTitle: string
  quantity: number,
}
export type PromoDetail = {
  promoType: string
  condition: string
  giftProduct: string
  maxQuantity: string
  thresholds: Thresold[] 
};
export interface Product {
  availablePublicationCount: number;
  createdAt:                 Date;
  descriptionHtml:           string;
  handle:                    string;
  hasOnlyDefaultVariant:     boolean;
  id:                        string;
  images:                    any[];
  options:                   Option[];
  productType:               string;
  publishedAt:               Date;
  tags:                      any[];
  templateSuffix:            null;
  title:                     string;
  totalInventory:            number;
  totalVariants:             number;
  tracksInventory:           boolean;
  updatedAt:                 Date;
  variants:                  Variant[];
  vendor:                    string;
  status:                    string;
}

export interface Option {
  id:       string;
  name:     string;
  position: number;
  values:   string[];
}

export interface Variant {
  availableForSale:    boolean;
  barcode:             null;
  compareAtPrice:      null;
  createdAt:           Date;
  displayName:         string;
  fulfillmentService:  FulfillmentService;
  id:                  string;
  inventoryItem:       InventoryItem;
  inventoryManagement: string;
  inventoryPolicy:     string;
  inventoryQuantity:   number;
  position:            number;
  price:               string;
  product:             InventoryItem;
  requiresShipping:    boolean;
  selectedOptions:     SelectedOption[];
  sku:                 string;
  taxable:             boolean;
  title:               string;
  updatedAt:           Date;
  weight:              number;
  weightUnit:          string;
}

export interface FulfillmentService {
  id:                  string;
  inventoryManagement: boolean;
  productBased:        boolean;
  serviceName:         string;
  type:                string;
}

export interface InventoryItem {
  __typename: string;
  id:         string;
}

export interface SelectedOption {
  __typename: string;
  value:      string;
}
