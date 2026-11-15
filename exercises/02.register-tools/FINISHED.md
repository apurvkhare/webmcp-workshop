# ✅ Section 2 done

The page now offers four tools: `search_products`, `view_cart`, `add_to_cart` and `apply_coupon`. An agent can find a product and put it in the cart with two calls.

## Talk it over

- `search_products` returns eight products. What should it do when forty match? Who should decide: the tool, or the agent?
- Chrome doesn't validate input against the schema. If it did, which of your checks could you delete, and which would you keep?
- Every tool calls the same `shop` functions the buttons call. What would go wrong if a tool talked to a different endpoint from the UI?

**Next:** section 3, `npm run go 3.1`
