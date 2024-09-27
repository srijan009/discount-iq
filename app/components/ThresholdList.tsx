import react from "react"
import {
  Card,
  ResourceList,
  Avatar,
  ResourceItem,
  Text,
  BlockStack,
  Box,
  InlineGrid,
  Button,
  InlineStack,
  TextField,
  Thumbnail
} from '@shopify/polaris';
import {
  XIcon,
  ImageIcon
} from '@shopify/polaris-icons';
const renderItems = (fields: any , handleThresholdRemoval : any) => {
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
              {/* {++index} */}
            </div>
            <div className="threshold-collection-wrapper">
              <div>
                {field.collectionImage.value ? <Thumbnail size="small" source={field.collectionImage.value} alt="collection-image" /> : <ImageIcon width="40" />}
              </div>
              <div>
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
                value={field.thresholdQuantity.value}
                onChange={field.thresholdQuantity.onChange}
                autoComplete="off"
                align="center"
              />

          </div>
        </div>
        <div className="action-wrapper">
          <div>
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