import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Form, useSubmit, useActionData } from "@remix-run/react"
import { useMemo, useState } from "react";
/**
 * UI Components Imports 
 */
// import shopify from "../shopify.server";
import { Page, Layout, PageActions, Bleed, Card, BlockStack, InlineGrid, InlineStack, Text, TextField, RadioButton, Button, Box, Icon } from "@shopify/polaris"

import {
  ActiveDatesCard,
  DiscountClass,
  MethodCard,
  RequirementType,
} from "@shopify/discount-app-components";
import { useForm, useField, asChoiceField, useDynamicList } from "@shopify/react-form";
import ThresholdList from "../components/ThresholdList"
import GiftProductCard from "app/components/GiftProductCard";
import CustomValidationMessage from "app/components/CustomValidationMessage";
import SuccessBanner from "app/components/SuccessBanner";
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { functionId, id } = params;
  const { admin } = await authenticate.admin(request)
  const formData = await request.formData();
  if (formData.get('action') == 'UPDATE') {
    const {
      title,
      method,
      combinesWith,
      startsAt,
      endsAt,
      promoDetails,
    } = JSON.parse(formData.get("discount"));
    const promoQualifyingCollectionIds = promoDetails.thresholds.map((item: any) => item.collectionId)
    const functionPayload = {
      collectionIds: promoQualifyingCollectionIds
    }
    const baseDiscount = {
      functionId,
      title,
      combinesWith,
      startsAt: new Date(startsAt),
      endsAt: endsAt && new Date(endsAt),
      metafields: [
        {
          id: promoDetails.promoMetafieldId,
          value: JSON.stringify(promoDetails)
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
    return json({ status: 'success', promoDetail: responseJson.data, editedMessage: true })

  }else if(formData.get('action') == 'DELETE'){
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
    
    const data = await response.json();
    return json({ status: 'success', promoDeleted: data, editedMessage: true })
  }
}
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { id } = params;

  const message = new URL(request.url).searchParams.get('message');
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
  if (message && message == 'success') {
    return json({ status: 'success', promoDetail: responseJson.data, successMessage: true });
  }
  if(!responseJson.data){
    return redirect("/app")
  }

  return json({ status: 'success', promoDetail: responseJson.data, successMessage: false });

};
export default function edit() {
  const { promoDetail, successMessage } = useLoaderData<typeof loader>();
  const mainMetafieldId = promoDetail?.discountNode?.promoDetails.id
  const collectionMetafieldId = promoDetail?.discountNode?.promo_qualifying_collections.id
  const additionalDetails: any = JSON.parse(promoDetail?.discountNode?.promoDetails?.value || {})
  console.log("additionalDetails.giftVariantId",additionalDetails)
  const [giftProduct, setGiftProduct] = useState(JSON.parse(additionalDetails?.giftVariantId))
  const [customValidationMsgs, setCustomValidationMsgs] = useState({
    collectionUnchecked: false,
    productUnchecked: false
  })
  const submitForm = useSubmit()
  const actionData = useActionData()
  const todaysDate = useMemo(() => new Date(), []);
  const thresholdFactory = ({ collectionImage, collectionId, collectionTitle, quantity }: any): any => ({
    collectionImage, collectionId, collectionTitle, quantity: 0
  })
  const { fields, addItem, removeItem } = useDynamicList({
    list: additionalDetails?.thresholds,
    validates: {
      quantity: (quantity) => {
        if (quantity <= 0) {
          return "Threshold Must Be greater than 0"
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
        value: promoDetail?.discountNode?.discount?.title,
        validates: [
          (value) => {
            if (value == '') {
              return 'Discount Title is Required';
            }
          }
        ]
      }),
      combinesWith: useField({
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      }),
      requirementType: useField(RequirementType.None),
      requirementSubtotal: useField("0"),
      requirementQuantity: useField("0"),
      startDate: useField(promoDetail?.discountNode?.discount?.startsAt),
      endDate: useField(promoDetail?.discountNode?.discount?.endsAt),
      promoDetails: {
        promoType: 'gwp_quantity',
        promoMetafieldId: useField(mainMetafieldId),
        promoInputMetafieldId: useField(collectionMetafieldId),
        // promoInputMetafieldId: useField(inputMetafieldId),
        condition: useField(additionalDetails.condition),
        giftVariantId: useField(additionalDetails.giftVariantId),
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
        thresholds: fields
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
      if (promoDetails.thresholds.length <= 0) {
        setCustomValidationMsgs((prevValues: any) => {
          return {
            ...prevValues,
            collectionUnchecked: true
          }
        })
        return { status: "fail", errors: [] };
      }
      if (promoDetails.giftVariantId === '') {
        setCustomValidationMsgs((prevValues: any) => {
          return {
            ...prevValues,
            productUnchecked: true
          }
        })
        return { status: "fail", errors: [] };
      }
      //console.log("discount",discount)
      submitForm({ discount: JSON.stringify(discount), action: 'UPDATE' }, { method: "post" });

      return { status: "success" };
    },
  });
  const handleCollectionPicker = async () => {
    const selectedCollections = await shopify.resourcePicker({ type: 'collection' })
    if (selectedCollections) {
      const [selectedCollection] = selectedCollections
      const collectionImageUrl = (selectedCollection?.image?.originalSrc) ? selectedCollection?.image?.originalSrc : null
      addItem({ collectionId: selectedCollection.id, collectionImage: collectionImageUrl, collectionTitle: selectedCollection.title, quantity: 0 })
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
      const variant = selectedProduct.variants[0]
      //console.log(variant)
      setGiftProduct(selectedProduct)
      promoDetails.giftVariantId.value = JSON.stringify(selectedProduct)
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
  const handleDeleteDiscount = (discountId: string) => {
    console.log("Delete Discount", discountId)
    const formData = new FormData()
    formData.append("discountId",discountId)
    submitForm({ discountId, action: 'DELETE' }, { method: "post" });
  }
  return (
    <Page title="Edit GWP Quantity Promo">
      <Layout.Section>
        {successMessage && !actionData?.editedMessage && <SuccessBanner message="Promo Created Successfully" />}
        {actionData?.editedMessage && <SuccessBanner message="Promo Edited Successfully" />}
        <Form method="post">
          {/* {actionData?.errors ? JSON.stringify(actionData?.errors) : ''} */}
          <BlockStack align="space-around">
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
                  {customValidationMsgs.collectionUnchecked && <CustomValidationMessage message="Please choose the collection eligible for gift" />}
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
                  {customValidationMsgs.productUnchecked && <CustomValidationMessage message="Please select the gift product" />}
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
            content: "Edit Discount",
            onAction: submit,
            // loading: isLoading,
          }}
          secondaryActions={[
            {
              content: "Delete Discount",
              onAction: () => handleDeleteDiscount(promoDetail?.discountNode?.discount?.discountId),
            },
          ]}
        />
      </Layout.Section>
    </Page>
  )
}