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
  TextField
} from '@shopify/polaris';
import {
  XIcon
} from '@shopify/polaris-icons';

export default function CollectionList({ collections, removeCollection }) {
  console.log(collections)
  return (
    <Box >
      <ResourceList
        resourceName={{ singular: 'collection', plural: 'collections' }}
        items={collections}
        renderItem={(item) => {
          const { id, title, image } = item;
          const media = <Avatar customer size="md" name={title} />;

          return (
            <ResourceItem
              id={id}
              accessibilityLabel={`View details for ${name}`}
            >
              <InlineGrid columns="3" alignItems="center">
                <Text variant="bodyMd" fontWeight="bold" as="h3">
                  {title}
                </Text>
                <div>
                  <InlineStack direction="row" align="center" gap="200" blockAlign="center">
                    <TextField
                      label="Min Threshold Quantity"
                      type="number"
                      autoComplete="off"
                    />
                  </InlineStack>
                </div>
                <InlineStack direction="row" align="end" gap="200" blockAlign="end">
                  <XIcon source="XIcon" width="15" tone="base" onClick={ () => removeCollection(item)} />
                </InlineStack>
              </InlineGrid>
            </ResourceItem>
          );
        }}
      />
    </Box>
  );
}