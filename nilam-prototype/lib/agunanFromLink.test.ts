import { describe, it, expect } from "vitest";
import { parseRumah123Html } from "./agunanFromLink";

describe("parseRumah123Html — harga", () => {
  it("reads a single Offer price (regular listing)", () => {
    const html = `{"@type":"Offer","priceCurrency":"IDR","price":1950000000,"availability":"x"}`;
    expect(parseRumah123Html(html).harga).toBe(1950000000);
  });

  it("falls back to lowPrice for a new-project AggregateOffer price range", () => {
    // "perumahan baru" listings have no single "price" — only a low/high range.
    const html = `{"@type":"AggregateOffer","priceCurrency":"IDR","lowPrice":1401269000,"highPrice":3741177000}`;
    expect(parseRumah123Html(html).harga).toBe(1401269000);
  });

  it("uses highPrice when only highPrice is present", () => {
    const html = `{"@type":"AggregateOffer","priceCurrency":"IDR","highPrice":677000000}`;
    expect(parseRumah123Html(html).harga).toBe(677000000);
  });

  it("tolerates a quoted price string", () => {
    const html = `{"priceCurrency":"IDR","price":"1950000000"}`;
    expect(parseRumah123Html(html).harga).toBe(1950000000);
  });
});
