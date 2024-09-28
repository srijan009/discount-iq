import { useEffect, useMemo, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useSubmit } from "@remix-run/react"
// import shopify from "../shopify.server";
import { Page, Layout, PageActions, Bleed, Card, BlockStack, InlineGrid, InlineStack, Text, TextField, RadioButton, Button, Box } from "@shopify/polaris"
import {
  ActiveDatesCard,
  CombinationCard,
  DiscountClass,
  MethodCard,
  RequirementType,
} from "@shopify/discount-app-components";
import { useForm, useField, asChoiceField, useDynamicList } from "@shopify/react-form";
import ThresholdList from "../components/ThresholdList"
import GiftProductCard from "app/components/GiftProductCard";
export const action = async ( { params, request}) => {
  const { functionId } = params;
  //const { admin } = await shopify.authenticate.admin(request);
  const formData = await request.formData();
  const {
    title,
    method,
    combinesWith,
    startsAt,
    endsAt,
    promoDetails,
  } = JSON.parse(formData.get("discount"));
  const baseDiscount = {
    functionId,
    title,
    combinesWith,
    startsAt: new Date(startsAt),
    endsAt: endsAt && new Date(endsAt),
  };
  console.log("baseDiscount",baseDiscount)
  return null

}
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};
/**
 * Discount Form Variablews
 * @returns 
 */
type Threshold = {
  collectionImage: string,
  collectionId: string,
  collectionTitle: string,
  thresholdQuantity: number,

}

export default function create() {
  const [giftProduct, setGiftProduct] = useState(null)
  const submitForm = useSubmit()
  const todaysDate = useMemo(() => new Date(), []);
  const thresholdFactory = ({ collectionImage, collectionId, collectionTitle, thresholdQuantity }: Threshold): Threshold => ({ collectionImage, collectionId, collectionTitle, thresholdQuantity })
  const { fields, addItem, removeItem } = useDynamicList([], thresholdFactory)
  const {
    fields: {
      discountTitle,
      combinesWith,
      startDate,
      endDate,
      promoDetails,
    },
    submit,
  } = useForm<any>({
    fields: {
      discountTitle: useField(""),
      combinesWith: useField({
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      }),
      requirementType: useField(RequirementType.None),
      requirementSubtotal: useField("0"),
      requirementQuantity: useField("0"),
      startDate: useField(todaysDate),
      endDate: useField(null),
      promoDetails: {
        condition: useField('OR'),
        giftVariantId: useField(''),
        maxQuantity:useField(''),
        threshold: fields
      },
    }
    ,
    onSubmit: async (form) => {
      const discount = {
        title: form.discountTitle,
        combinesWith: form.combinesWith,
        startsAt: form.startDate,
        endsAt: form.endDate,
      };
      console.log("form", form)
      submitForm({ discount: JSON.stringify(discount) }, { method: "post" });

      return { status: "success" };
    },
  });
  const handleCollectionPicker = async () => {
    const selectedCollections = await shopify.resourcePicker({ type: 'collection' })
    if (selectedCollections) {
      const [selectedCollection] = selectedCollections
      console.log(selectedCollection)
      const collectionImageUrl = (selectedCollection?.image?.originalSrc) ? selectedCollection?.image?.originalSrc : null
      addItem({ collectionId: selectedCollection.id, collectionImage: collectionImageUrl, collectionTitle: selectedCollection.title, thresholdQuantity: 0 })
    }
    return
  }
  const handleProductSelector = async () => {
    const selectedProducts = await shopify.resourcePicker({
      type: 'product', filter: {
        variants: false
      }
    })
    if(selectedProducts){
      const selectedProduct = selectedProducts[0]
      const variant = selectedProduct.variants[0]
      console.log(selectedProduct)
      setGiftProduct(selectedProduct)
      promoDetails.giftVariantId.value = variant.id
    }
  }
  const handleThresholdRemoval = (removeThresholdIndex: number) => {
    if (removeThresholdIndex == 0) {
      removeItem(0)
      return
    }
    if (removeThresholdIndex) {
      removeItem(removeThresholdIndex)
    }
    console.log(removeThresholdIndex, fields)
  }
  return (
    <Page title="Create GWP Quantity Promo">
      <Layout.Section>
        <Form method="post">
          <BlockStack align="space-around" gap="2">
            <MethodCard
              title="GWP"
              discountTitle={discountTitle}
              discountClass={DiscountClass.Product}
              discountMethod="AUTOMATIC"
              discountMethodHidden={true}
            />
            <div className="condition-section">
              <Card>
                <BlockStack align="center">
                  <div className="conditions-wrapper">
                    <InlineGrid>
                      <Text as="h2" fontWeight="semibold">
                        Conditions
                      </Text>
                    </InlineGrid>
                    <div className="condition-wrapper">
                      <InlineStack blockAlign="center">
                        <Text as="p">Condition must match</Text>
                        <InlineStack>
                          <RadioButton label="any condition" name="condition" {...asChoiceField(promoDetails.condition, 'OR')} />
                          <RadioButton label="all condition" name="condition" {...asChoiceField(promoDetails.condition, 'AND')} />
                        </InlineStack>
                      </InlineStack >
                    </div>
                  </div>
                </BlockStack>
                <BlockStack>
                  <div>
                    <Button size="medium" onClick={handleCollectionPicker}>+ Add the Collection</Button>
                  </div>
                </BlockStack>
                {/* Collection List starts */}
                <Bleed>
                  {(fields.length > 0 ? <ThresholdList fields={fields} handleThresholdRemoval={handleThresholdRemoval} /> : '')}
                </Bleed>
                {/* Collection List  ends*/}
              </Card>
            </div>
            <Card>
              <BlockStack gap="3">
                <Text variant="headingMd" as="h2">
                  Gift Section
                </Text>
                <div>
                  <InlineGrid>
                    <TextField
                      label="Maximum quantity"
                      autoComplete="on"
                      {...promoDetails.maxQuantity}
                    />
                    <div className="product-selector-cta">
                      <Button onClick={handleProductSelector}>Browse Product</Button>
                    </div>
                  </InlineGrid>
                </div>
                {giftProduct &&
                  <Box>
                    <GiftProductCard giftProduct={giftProduct} />
                    <div className="hidden">
                      <TextField
                        {...promoDetails.giftVariantId}
                      />
                    </div>
                  </Box>}
              </BlockStack>
            </Card>
            <CombinationCard
              combinableDiscountTypes={combinesWith}
              discountClass={DiscountClass.Product}
              discountDescriptor={"Discount"}
            />
            <ActiveDatesCard
              startDate={startDate}
              endDate={endDate}
              timezoneAbbreviation="EST"
            />
          </BlockStack>
        </Form>
      </Layout.Section>
      <Layout.Section>
        <PageActions
          primaryAction={{
            content: "Save discount",
            onAction: submit,
            // loading: isLoading,
          }}
          secondaryActions={[
            {
              content: "Discard",
              // onAction: () => onBreadcrumbAction(redirect, true),
            },
          ]}
        />
      </Layout.Section>
    </Page>
  )
}