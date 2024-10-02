import type {
  ActionFunctionArgs,
} from "@remix-run/node";
import { json } from "@remix-run/node";
export async function action({
  request,
}: ActionFunctionArgs) {
  const cart = await request.json();
  console.log(cart)
  return json({ ok: true, cart });
}