import type {
  RunInput,
  FunctionRunResult,
  CartOperation,
} from "../generated/api";


export function run(input: RunInput): FunctionRunResult {
  const operations = input.cart.lines.reduce((ops, line) => {
    if (line.gwp?.value === 'FREE') { 
      // If the line item has a GWP attribute with a value of "FREE", add an operation to the array
      ops.push({
        update: {
          cartLineId: line.id,
          price: {
            adjustment: {
              fixedPricePerUnit: {
                amount: 0, // Set the price to 0
              },
            },
          },          
        },
      });
    }
    return ops;
  }, [] as CartOperation[]);
  return {
    operations,
  };
};