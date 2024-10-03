import {
  Thumbnail,
  Text
} from '@shopify/polaris'
import {
  ImageIcon
} from '@shopify/polaris-icons';
import { GiftProductCardProps } from 'app/types/type';

export default function GiftProductCard({ giftProduct }:GiftProductCardProps){
  
   const { title, images } = giftProduct
  return(
   <div className='gift-wrapper'>
    <Text as="p" fontWeight="bold">Selected Gift</Text>
    <div className="threshold-wrapper">
      <div className="threshold-image-holder">
      {images.length > 0 ? <Thumbnail size="small" source={images[0]?.originalSrc} alt="collection-image" /> : <ImageIcon width="40" />}
      </div>
      <div className="threshold-text-holder">
        {title}
      </div>
    </div>
   </div>
  )
}