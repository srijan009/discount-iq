
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useMemo, useEffect } from "react"
import { Form, useSubmit, useActionData, useNavigate } from "@remix-run/react"
// import shopify from "../shopify.server";
import { Page, Layout, PageActions, Bleed, Card, BlockStack, InlineGrid, InlineStack, Text, TextField, RadioButton, Button, Box } from "@shopify/polaris"
import {
  ActiveDatesCard,
  DiscountClass,
  DiscountMethod,
  DiscountStatus,
  MethodCard,
  SummaryCard,
} from "@shopify/discount-app-components";
import { useForm, useField, asChoiceField, useDynamicList } from "@shopify/react-form";
import ThresholdList from "../components/ThresholdList"
import GiftProductCard from "app/components/GiftProductCard";
import CustomValidationMessage from "app/components/CustomValidationMessage";
//import shopify from "app/shopify.server";
import { authenticate } from "../shopify.server";
import { ActionData, SelectedCollection } from "app/types/type";
import ErrorMessage from "app/components/ErrorMessage";
import { removeUnwantedKeys } from "app/data.util";
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { functionId } = params;
  const { admin } = await authenticate.admin(request)
  const formData = await request.formData();
  const result: string | any = formData.get("discount")
  const {
    title,
    combinesWith,
    startsAt,
    endsAt,
    promoDetails,
  } = JSON.parse(result);
  const baseDiscount = {
    functionId,
    title,
    combinesWith,
    startsAt: new Date(startsAt),
    endsAt: endsAt && new Date(endsAt),
  };
  const promoQualifyingCollectionIds = promoDetails.thresholds.map((item: any) => item.collectionId)
  const functionPayload = {
    collectionIds: promoQualifyingCollectionIds
  }
  const promoDetailPayload = removeUnwantedKeys(promoDetails, ['collectionAdded'])
  const response = await admin.graphql(
    `#graphql
        mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
          discountCreate: discountAutomaticAppCreate(automaticAppDiscount: $discount) {
            automaticAppDiscount{
              discountId
            }
            userErrors {
              code
              message
              field
            }
          }
        }`,
    {
      variables: {
        discount: {
          ...baseDiscount,
          metafields: [
            {
              namespace: "$app:gwp-promotions",
              key: "promoDetails",
              type: "json",
              value: JSON.stringify(promoDetailPayload),
            },
            {
              namespace: "$app:gwp-promotions",
              key: "promo_qualifying_collections",
              type: "json",
              value: JSON.stringify(functionPayload),
            },
          ],
        },
      },
    }
  );
  const responseJson = await response.json();
  //console.log(JSON.stringify(responseJson))
  const errors = responseJson.data.discountCreate?.userErrors;
  if (errors.length > 0) {
    return json({ status: 'failed', data: errors });
  }
  const discountGid: string = responseJson.data.discountCreate?.automaticAppDiscount.discountId
  const discountGidArr = discountGid.split('/')
  const discountId = discountGidArr[discountGidArr.length - 1]
  const targetUrl = `/app/discounts/gwp-quantity/${functionId}/${discountId}/edit`
  return { status: 'success', data: targetUrl }

}

/**
 * Discount Form Variables
 * @returns 
 */
type Threshold = {
  collectionImage: string,
  collectionId: string,
  collectionTitle: string,
  quantity: string,

}

export default function create() {
  const submitForm = useSubmit()
  const actionData: ActionData | undefined = useActionData()
  const navigate = useNavigate()
  const todaysDate = useMemo(() => new Date(), []);
  const thresholdFactory = ({ collectionImage, collectionId, collectionTitle, quantity }: Threshold): any => ({
    collectionImage, collectionId, collectionTitle, quantity: 1
  })
  const { fields, addItem, removeItem } = useDynamicList({
    list: [
    ],
    validates: {
      quantity: (quantity) => {
        if (quantity <= 0) {
          return "Threshold must be greater than 0"
        }
      }
    }
  }, thresholdFactory)
  const {
    fields: {
      discountTitle,
      startDate,
      endDate,
      promoDetails,
    },
    submit,
  } = useForm<any>({
    fields: {
      discountTitle: useField({
        value: '',
        validates: [
          (value) => {
            if (value == '') {
              return 'Discount title is required';
            }
          }
        ]
      }),
      combinesWith: useField({
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: true,
      }),
      startDate: useField(todaysDate),
      endDate: useField(null),
      promoDetails: {
        promoType: 'gwp_quantity',
        condition: useField('OR'),
        giftProduct: useField({
          value: '',
          validates: [
            (value) => {
              if (value == '') {
                return 'Please choose the gift product'
              }
            }
          ]
        }),
        maxQuantity: useField({
          value: 1,
          validates: [
            (value: number) => {
              if (value <= 0) {
                return "Gift quantity must be greater than 0"
              }
            }
          ]
        }),
        thresholds: fields,
        collectionAdded: useField({
          value: false,
          validates: [
            (value) => {
              if (!value) {
                return 'Please choose the collection'
              }
            }
          ]
        })
      },
    }
    ,
    onSubmit: async (form) => {
      const discount = {
        title: form.discountTitle,
        combinesWith: form.combinesWith,
        startsAt: form.startDate,
        endsAt: form.endDate,
        promoDetails: form.promoDetails
      };
      if (fields.length === 0) {
        return { status: 'fail', errors: [] }
      }
      submitForm({ discount: JSON.stringify(discount) }, { method: "post" });
      return { status: "success" };
    },
  });
  useEffect(() => {
    if (actionData?.status == 'success') {
      shopify.toast.show('Promo gift with purchased is saved successfully', {
        duration: 5000,
      });
      //console.log("actionData?.data", actionData?.data)
      if (actionData?.data) {
        navigate(actionData?.data)
      }
    }
  }, [actionData])
  const handleCollectionPicker = async () => {
    const response: any = await shopify.resourcePicker({ type: 'collection' })
    const [selectedCollection]: SelectedCollection[] = response
    if (selectedCollection) {
      const collectionImageUrl = (selectedCollection?.image?.originalSrc) ? selectedCollection?.image?.originalSrc : null
      addItem({ collectionId: selectedCollection.id, collectionImage: collectionImageUrl, collectionTitle: selectedCollection.title, quantity: 1 })
      promoDetails.collectionAdded.onChange(true)
    }
    return
  }
  const handleProductSelector = async () => {
    const selectedProducts = await shopify.resourcePicker({
      type: 'product', filter: {
        variants: false
      }
    })
    if (selectedProducts) {
      const selectedProduct = selectedProducts[0]
      promoDetails.giftProduct.onChange(JSON.stringify(selectedProduct))
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
    //console.log(removeThresholdIndex, fields)
  }
  const handleBackBtn = () => {
    //console.log("Handle Back Btn")
    open('shopify://admin/discounts', '_top');
  }
  return (
    <Page title="Create GWP Quantity Promo" backAction={{ content: 'Discounts', onAction: () => handleBackBtn() }}>
      <Layout>
        <Layout.Section>
          <Layout.Section>
            {actionData?.status == 'failed' && <ErrorMessage errors={actionData?.data} />}
          </Layout.Section>
          <Layout.Section>
            <Form method="post" onSubmit={submit}>
              {actionData?.errors ? JSON.stringify(actionData?.errors) : ''}
              <BlockStack align="space-around">
                <MethodCard
                  title="GWP"
                  discountTitle={discountTitle}
                  discountClass={DiscountClass.Product}
                  // discountMethod={DiscountMethod.Automatic}
                  discountMethod={{
                    value: DiscountMethod.Automatic,
                    onChange: () => { }
                  }}
                  discountCode={{
                    value: "",
                    onChange: () => { }
                  }}
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
                      {promoDetails.collectionAdded.allErrors.length > 0 && <CustomValidationMessage message="Please choose the collection eligible for gift" />}
                    </BlockStack>
                    {/* Collection List starts */}
                    <Bleed>
                      {(fields.length > 0 ? <ThresholdList fields={fields} handleThresholdRemoval={handleThresholdRemoval} /> : '')}
                    </Bleed>
                    {/* Collection List  ends*/}
                  </Card>
                </div>
                <div className="gift-section">
                  <Card>
                    <BlockStack>
                      <Text variant="headingMd" as="h2">
                        Gift Section
                      </Text>
                      <div>
                        <InlineGrid>
                          <TextField
                            {...promoDetails.maxQuantity}
                          />
                          <div className="product-selector-cta">
                            <Button onClick={handleProductSelector}>Browse Product</Button>
                          </div>
                          {promoDetails.giftProduct.allErrors.length > 0 ? <CustomValidationMessage message="Please choose the gift product" /> : ''}
                        </InlineGrid>
                      </div>
                      <Box>
                        {promoDetails.giftProduct.value != '' &&
                          <Box>
                            <GiftProductCard giftProduct={JSON.parse(promoDetails.giftProduct.value)} />
                          </Box>
                        }
                        <div className="hidden">
                          <TextField
                            {...promoDetails.giftProduct}
                          />
                        </div>
                      </Box>
                    </BlockStack>
                  </Card>
                </div>
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
                  content: "Back",
                  onAction: () => handleBackBtn(),
                },
              ]}
            />
          </Layout.Section>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Layout.Section>
            <SummaryCard
              header={{
                discountMethod: DiscountMethod.Automatic,
                discountDescriptor: discountTitle.value,
                appDiscountType: "GWP",
                isEditing: false,
              }}
              performance={{
                status: DiscountStatus.Active,
                usageCount: 0,
              }}
              combinations={{
                combinesWith: {
                  orderDiscounts: true,
                  productDiscounts: false,
                  shippingDiscounts: false,
                },
              }}
              activeDates={{
                startDate: startDate.value,
                endDate: endDate.value,
              }}
            />
          </Layout.Section>
        </Layout.Section>
      </Layout>
    </Page>
  )
}