import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Form, useSubmit, useActionData } from "@remix-run/react"
/**
 * UI Components Imports 
 */
// import shopify from "../shopify.server";
import { Page, Layout, PageActions, Bleed, Card, BlockStack, InlineGrid, InlineStack, Text, TextField, RadioButton, Button, Box, Icon } from "@shopify/polaris"

import {
  ActiveDatesCard,
  DiscountClass,
  DiscountMethod,
  DiscountStatus,
  MethodCard,
  RequirementType,
  SummaryCard,
} from "@shopify/discount-app-components";
import { useForm, useField, asChoiceField, useDynamicList } from "@shopify/react-form";
import ThresholdList from "../components/ThresholdList"
import GiftProductCard from "app/components/GiftProductCard";
import CustomValidationMessage from "app/components/CustomValidationMessage";
import { removeUnwantedKeys } from "app/data.util";
import { ActionData, SelectedCollection } from "app/types/type";
import Dialog from "app/components/Dialog";
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { functionId, id } = params;
  const { admin } = await authenticate.admin(request)
  const formData = await request.formData();
  if (formData.get('action') == 'UPDATE') {
    const result: string | any = formData.get("discount")
    const {
      title,
      combinesWith,
      startsAt,
      endsAt,
      promoDetails,
    } = JSON.parse(result);
    const promoQualifyingCollectionIds = promoDetails.thresholds.map((item: any) => item.collectionId)
    const functionPayload = {
      collectionIds: promoQualifyingCollectionIds
    }
    const promoDetailPayload = removeUnwantedKeys(promoDetails, ['promoMetafieldId', 'promoInputMetafieldId'])

    const baseDiscount = {
      functionId,
      title,
      combinesWith,
      startsAt: new Date(startsAt),
      endsAt: endsAt && new Date(endsAt),
      metafields: [
        {
          id: promoDetails.promoMetafieldId,
          value: JSON.stringify(promoDetailPayload)
        },
        {
          id: promoDetails.promoInputMetafieldId,
          value: JSON.stringify(functionPayload)
        }
      ]
    };
    const response = await admin.graphql(
      `#graphql
      mutation discountAutomaticAppUpdate($automaticAppDiscount: DiscountAutomaticAppInput!, $id: ID!) {
        discountAutomaticAppUpdate(automaticAppDiscount: $automaticAppDiscount, id: $id) {
          automaticAppDiscount {
            discountId
            title
            startsAt
            endsAt
            status
            appDiscountType {
              appKey
              functionId
            }
            combinesWith {
              orderDiscounts
              productDiscounts
              shippingDiscounts
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
      {
        variables: {
          "id": "gid://shopify/DiscountAutomaticNode/" + id,
          "automaticAppDiscount": baseDiscount
        },
      },
    );

    const responseJson = await response.json();
    //console.log(responseJson?.data, 'responseJson?.data')
    return json({ status: 'success', data: responseJson.data, action: 'UPDATE' })

  } else if (formData.get('action') == 'DELETE') {
    const discountId = formData.get('discountId')
    const response = await admin.graphql(
      `#graphql
      mutation discountAutomaticDelete($id: ID!) {
        discountAutomaticDelete(id: $id) {
          deletedAutomaticDiscountId
          userErrors {
            field
            code
            message
          }
        }
      }`,
      {
        variables: {
          "id": discountId
        },
      },
    );
    const responseJson = await response.json();
    return json({ status: 'success', data: responseJson.data, action: 'DELETE' })
  }
}
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { id } = params;

  const response = await admin.graphql(`
      query PromoDetail{
        discountNode(id: "gid://shopify/DiscountAutomaticNode/${id}") {
          discount{
            ... on DiscountAutomaticApp{
              discountId
              title
              combinesWith{
                orderDiscounts
                productDiscounts
                shippingDiscounts          
              }
              startsAt
              endsAt
              createdAt
              status
            }
          }
          promoDetails:metafield(namespace:"$app:gwp-promotions", key:"promoDetails"){
            id
            key
            value
          }
          promo_qualifying_collections:metafield(namespace:"$app:gwp-promotions", key:"promo_qualifying_collections"){
            id
            key
            value
          }
        }
      }
    
    `)
  const responseJson = await response.json();
  if (!responseJson?.data?.discountNode) {
    return redirect("/app")
  }

  return json({ status: 'success', data: responseJson.data, action: 'DELETE' });

};
export default function edit() {
  const { data } = useLoaderData<typeof loader>();
  const mainMetafieldId = data?.discountNode?.promoDetails.id
  const collectionMetafieldId = data?.discountNode?.promo_qualifying_collections.id
  const additionalDetails: any = JSON.parse(data?.discountNode?.promoDetails?.value || {})



  const submitForm = useSubmit()
  const actionData: ActionData | undefined = useActionData()
  const thresholdFactory = ({ collectionImage, collectionId, collectionTitle, quantity }: any): any => ({
    collectionImage, collectionId, collectionTitle, quantity: 1
  })
  const { fields, addItem, removeItem } = useDynamicList({
    list: additionalDetails?.thresholds,
    validates: {
      quantity: (quantity) => {
        if (quantity <= 0) {
          return "Threshold must be greater than 0"
        }
      }
    }
  }, thresholdFactory)
  //console.log(additionalDetails.thresholds)
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
        value: data?.discountNode?.discount?.title,
        validates: [
          (value) => {
            if (value == '') {
              return 'Discount Title is Required';
            }
          }
        ]
      }),
      combinesWith: useField({
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: true,
      }),
      requirementType: useField(RequirementType.None),
      requirementSubtotal: useField("0"),
      requirementQuantity: useField("0"),
      startDate: useField(data?.discountNode?.discount?.startsAt),
      endDate: useField(data?.discountNode?.discount?.endsAt),
      promoDetails: {
        promoType: 'gwp_quantity',
        promoMetafieldId: useField(mainMetafieldId),
        promoInputMetafieldId: useField(collectionMetafieldId),
        // promoInputMetafieldId: useField(inputMetafieldId),
        condition: useField(additionalDetails.condition),
        giftProduct: useField({
          value: additionalDetails.giftProduct,
          validates: [
            (value) => {
              if (value == '') {
                return 'Please choose the gift product'
              }
            }
          ]
        }),
        maxQuantity: useField({
          value: additionalDetails.maxQuantity,
          validates: [
            (value: number) => {
              if (value <= 0) {
                return "Gift Quantity must be greater than 0"
              }
            }
          ]
        }),
        thresholds: fields,
        collectionAdded: useField({
          value: fields.length > 0 ? true :  false,
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
      //console.log("discount",discount)
      submitForm({ discount: JSON.stringify(discount), action: 'UPDATE' }, { method: "post" });

      return { status: "success" };
    },
  });
  useEffect(() => {
    if (actionData?.status == 'success' && actionData?.action == 'UPDATE') {
      shopify.toast.show('Promo is edited successfully', {
        duration: 5000,
      });
      open('shopify://admin/discounts', '_top');
    } else if (actionData?.status == 'success' && actionData?.action == 'DELETE') {
      shopify.toast.show('Promo is deleted successfully', {
        duration: 5000,
      });
      open('shopify://admin/discounts', '_top');
    }
  }, [actionData])

  const handleCollectionPicker = async () => {
    // const selectedCollections:SelectedCollection[]  = await shopify.resourcePicker({ type: 'collection' })
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
      type: 'product',
      filter: {
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
  const handleShowModal = () => {
    shopify.modal.show('show-modal')
  }
  const handleDeleteDiscount = (discountId: string) => {
    submitForm({ discountId, action: 'DELETE' }, { method: "post" });
  }
  const handleBackBtn = () => {
    //console.log("Handle Back Btn")
    open('shopify://admin/discounts', '_top');
  }

  return (
    <Page title="Edit GWP Quantity Promo" backAction={{ content: 'Discounts', onAction: () => handleBackBtn() }}>
      <Layout>
        <Layout.Section>
          <Layout.Section>
            <Form method="post" onSubmit={submit}>
              {/* {actionData?.errors ? JSON.stringify(actionData?.errors) : ''} */}
              <BlockStack align="space-around">
                <MethodCard
                  title="GWP"
                  discountTitle={discountTitle}
                  discountClass={DiscountClass.Product}
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
                            label="Maximum quantity"
                            autoComplete="on"
                            {...promoDetails.maxQuantity}
                          />
                          <div className="product-selector-cta">
                            <Button onClick={handleProductSelector}>Browse Product</Button>
                          </div>
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
                      {/* {customValidationMsgs.productUnchecked && <CustomValidationMessage message="Please select the gift product" />} */}
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
                content: "Save",
                onAction: submit,
                // loading: isLoading,
              }}
              secondaryActions={[
                {
                  content: "Delete",
                  destructive: true,
                  onAction: () => handleShowModal(),
                },
              ]}
            />
          </Layout.Section>
          <Layout.Section>
            <Dialog discountTitle={discountTitle.value} discountId={data?.discountNode?.discount?.discountId} handleDeleteDiscount={handleDeleteDiscount} />
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