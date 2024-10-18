import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import { boundary } from "@shopify/shopify-app-remix/server";

export async function action({
  request,
}: ActionFunctionArgs) {
  try{
    const {admin} = await  authenticate.public.appProxy(request);
    console.log(request)
    return json({ status: "success" });
  }catch(error){
    console.log(error)
    return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
  }
  // console.log("admin",admin)
  // const response = await admin.graphql(`
  // query discountAll{
  //     discountNodes(first:250,query:"discount_type:app AND status:active"){
  //       edges{
  //         node{
  //           discount{
  //             __typename
  //             ... on DiscountAutomaticApp{
  //               discountId
  //               __typename
  //               appDiscountType{
  //                 appKey
  //                 functionId
  //                 discountClass
  //               }
  //               status
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // `)
  // const responseJson = await response.json();
  // console.log("responseJson", responseJson)
}
// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.


export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
