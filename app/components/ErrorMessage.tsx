import { BlockStack, Box, InlineStack, Text, List, Banner } from "@shopify/polaris";

const renderListItems = ( errors: any[]) => {
  if(errors.length > 0 ){
    return (
      errors.map( (error: any) => <List.Item>{error.message}</List.Item>)
    )
  }
}
export default function ErrorMessage( { errors} : any) {
  let title: string = errors.length > 1 ? `There are ${errors.length} errors with this discount`:`There is ${errors.length} error with this discount`
  return (
    <>
      <Banner tone="critical" title={title}>
        <Box>
          <BlockStack>
            {renderListItems(errors)}
          </BlockStack>
        </Box>
      </Banner>
    </>
  )
}