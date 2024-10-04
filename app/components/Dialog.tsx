import { Modal, TitleBar, SaveBar } from '@shopify/app-bridge-react';
import { Box, Text } from '@shopify/polaris';
export default function Dialog ({ discountTitle , discountId , handleDeleteDiscount } : any) {
  return (
    <>
      <Modal id="show-modal">
        <Box padding="300">
          <Text as="p">
            Are you sure you want to delete {discountTitle}? This can’t be undone.
          </Text>
        </Box>
        <TitleBar title={discountTitle}>
          <button onClick={() => shopify.modal.hide('show-modal')}>Cancel</button>
          <button variant="primary" tone="critical" onClick={() => handleDeleteDiscount(discountId)}>Delete Discount</button>
        </TitleBar>
      </Modal>
    </>
  );
}