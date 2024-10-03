import {
  Box,
  InlineGrid,
  TextField,
  Thumbnail
} from '@shopify/polaris';
import {
  XIcon,
  ImageIcon
} from '@shopify/polaris-icons';
import { FieldsProp } from 'app/types/type';


const renderItems = (fields: FieldsProp[] , handleThresholdRemoval : any) => {
  //console.log("fields",fields)  
  if (fields.length === 0) {
    return
  }
  return fields.map((field: any, index: number) => (
    <Box key={index}>
      <div className="threshold-box">
      <InlineGrid columns={3} alignItems="center">
        <div>
          <div className="threshold-left">
            <div className="threshold-collection-counter">
            </div>
            <div className="threshold-wrapper">
              <div className="threshold-image-holder">
                {field.collectionImage.value ? <Thumbnail size="small" source={field.collectionImage.value} alt="collection-image" /> : <ImageIcon width="40" />}
              </div>
              <div className="threshold-text-holder">
                {field.collectionTitle.value}
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="threshold-quantity">
              <TextField
                placeholder="Quantity Threshold"
                label="Quantity Threshold"
                {...field.quantity}
                autoComplete="off"
                align="center"
              />

          </div>
        </div>
        <div className="action-wrapper">
          <div className="rm-threshold">
            <XIcon width="35" onClick={() => handleThresholdRemoval(index)} />
          </div>
        </div>
      </InlineGrid>
      </div>
    </Box>
  ))
}
export default function ThresholdList({ fields, handleThresholdRemoval }: any) {
  return (
    <Box>
      {
        renderItems(fields, handleThresholdRemoval)
      }
    </Box>
  );
}