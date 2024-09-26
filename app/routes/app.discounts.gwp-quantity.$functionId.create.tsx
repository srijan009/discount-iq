import { useEffect, useMemo, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useSubmit } from "@remix-run/react"
import { Page, Layout, PageActions, Card, BlockStack, InlineGrid, InlineStack, Text, TextField, RadioButton, Button } from "@shopify/polaris"
import {
  ActiveDatesCard,
  CombinationCard,
  DiscountClass,
  DiscountMethod,
  MethodCard,
  DiscountStatus,
  RequirementType,
  SummaryCard,
  UsageLimitsCard,
} from "@shopify/discount-app-components";
import { authenticate } from "../shopify.server";
import { useForm, useField } from "@shopify/react-form";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};
/**
 * Discount Form Variablews
 * @returns 
 */
export default function create() {
  const [collections, setCollections] = useState([])
  const submitForm = useSubmit()
  const todaysDate = useMemo(() => new Date(), []);
  const {
    fields: {
      discountTitle,
      discountCode,
      discountMethod,
      combinesWith,
      requirementType,
      requirementSubtotal,
      requirementQuantity,
      usageLimit,
      appliesOncePerCustomer,
      startDate,
      endDate,
      configuration,
    },
    submit,
  } = useForm({
    fields: {
      discountTitle: useField(""),
      discountMethod: useField(DiscountMethod.Code),
      discountCode: useField(""),
      combinesWith: useField({
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      }),
      requirementType: useField(RequirementType.None),
      requirementSubtotal: useField("0"),
      requirementQuantity: useField("0"),
      usageLimit: useField(null),
      appliesOncePerCustomer: useField(false),
      startDate: useField(todaysDate),
      endDate: useField(null),
      configuration: {
        max_quantity: useField('1'),
        threshold: useField("0"),
      },
    },
    onSubmit: async (form) => {
      const discount = {
        title: form.discountTitle,
        method: form.discountMethod,
        code: form.discountCode,
        combinesWith: form.combinesWith,
        usageLimit: form.usageLimit == null ? null : parseInt(form.usageLimit),
        appliesOncePerCustomer: form.appliesOncePerCustomer,
        startsAt: form.startDate,
        endsAt: form.endDate,
        configuration: {
          max_quantity: parseInt(form.configuration.max_quantity),
          threshold: parseFloat(form.configuration.threshold),
        },
      };

      submitForm({ discount: JSON.stringify(discount) }, { method: "post" });

      return { status: "success" };
    },
  });
  const openShopifyResourcePicker = async () => {
    const selectedCollections =  await shopify.resourcePicker({type: 'collection'})
    const selectedCollection = selectedCollections[0]
    setCollections( (prevCollections) => [...prevCollections,selectedCollection])
    return
  }
  useEffect( ()=>{
    console.log("collections",collections)
  },[collections])
  return (
    <Page title="Create GWP Quantity Promo">
      <Layout.Section>
        <Form method="post">
          <BlockStack align="space-around" gap="2">
            <MethodCard
              title="GWP"
              discountTitle={discountTitle}
              discountClass={DiscountClass.Product}
              discountCode={discountCode}
              discountMethod="AUTOMATIC"
              discountMethodHidden="true"
            />
            <Card>
              <BlockStack>
                <InlineGrid>
                  <Text as="h2" fontWeight="semibold">
                    Conditions
                  </Text>
                </InlineGrid>
                <InlineStack >
                    <Text as="p">Condition must match</Text>
                    <InlineStack>
                      <RadioButton label="any condition" name="condition"/>
                      <RadioButton label="all condition" name="condition"/>
                    </InlineStack>
                </InlineStack >
              </BlockStack>
              <BlockStack>
                <div>
                  <Button size="medium" onClick={openShopifyResourcePicker}>+ Add the Collection</Button>
                </div>
              </BlockStack>
            </Card>
            <Card>     
              <BlockStack gap="3">
                <Text variant="headingMd" as="h2">
                  GWP
                </Text>
                <TextField
                  label="Maximum quantity"
                  autoComplete="on"
                  {...configuration.max_quantity}
                />
                <TextField
                  label="GWP Threshold"
                  autoComplete="on"
                  {...configuration.threshold}
                  prefix="$"
                />
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
            // onAction: submit,
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