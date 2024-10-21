import type {
  LoaderFunctionArgs,
} from "@remix-run/node";
import { authenticate } from "app/shopify.server";
export async function loader({ request, params }: LoaderFunctionArgs) {
  const {admin} =  await authenticate.public.appProxy(request);
  const response = await admin?.graphql(`
  query discountAll{
      discountNodes(first:250,query:"discount_type:app AND status:active"){
        edges{
          node{
            discount{
              __typename
              ... on DiscountAutomaticApp{
                discountId
                __typename
                appDiscountType{
                  appKey
                  functionId
                  discountClass
                }
                status
              }
            }
          metafield(namespace: "$app:gwp-promotions", key: "promoDetails") {
            value
          }
          }
        }
      }
    }
  `)
  const result = await response?.json()
  return { status: "success", data: result?.data}
}


