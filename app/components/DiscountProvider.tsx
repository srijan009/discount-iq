import { AppProvider } from "@shopify/discount-app-components";
import "@shopify/discount-app-components/build/esm/styles.css";
import { DiscountProviderProps } from "app/types/type";

export function DiscountProvider({ children }:DiscountProviderProps) {
  return (
    <AppProvider locale="en-US" ianaTimezone="America/Denver">
      {children}
    </AppProvider>
  );
}