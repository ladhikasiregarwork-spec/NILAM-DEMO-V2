import { describe, it, expect } from "vitest";
import { PIPELINE_NODES, buildPipeline } from "./pipelines";
import { DEFAULT_PERSONA } from "@/data/personas";

const EXPECTED_ORDER = ["upload", "ocr", "validasi", "fraud", "identity", "slik", "income", "thp"];

describe("PIPELINE_NODES", () => {
  it("has exactly 8 nodes", () => {
    expect(PIPELINE_NODES).toHaveLength(8);
  });

  it("has nodes in the exact order: upload, ocr, validasi, fraud, identity, slik, income, thp", () => {
    expect(PIPELINE_NODES.map((n) => n.nodeId)).toEqual(EXPECTED_ORDER);
  });

  it("upload node has correct label", () => {
    expect(PIPELINE_NODES.find((n) => n.nodeId === "upload")?.label).toBe("Upload");
  });

  it("ocr node has correct label", () => {
    expect(PIPELINE_NODES.find((n) => n.nodeId === "ocr")?.label).toBe("OCR");
  });

  it("validasi node has correct label", () => {
    expect(PIPELINE_NODES.find((n) => n.nodeId === "validasi")?.label).toBe("Validasi Dokumen");
  });

  it("fraud node has correct label", () => {
    expect(PIPELINE_NODES.find((n) => n.nodeId === "fraud")?.label).toBe("Fraud Detection");
  });

  it("identity node has correct label", () => {
    expect(PIPELINE_NODES.find((n) => n.nodeId === "identity")?.label).toBe("Identity Check");
  });

  it("slik node has correct label", () => {
    expect(PIPELINE_NODES.find((n) => n.nodeId === "slik")?.label).toBe("SLIK Retrieval");
  });

  it("income node has correct label", () => {
    expect(PIPELINE_NODES.find((n) => n.nodeId === "income")?.label).toBe("Income Extraction");
  });

  it("thp node has correct label", () => {
    expect(PIPELINE_NODES.find((n) => n.nodeId === "thp")?.label).toBe("THP Engine");
  });
});

describe("buildPipeline", () => {
  it("returns the 8-node uniform pipeline for DEFAULT_PERSONA", () => {
    const nodes = buildPipeline(DEFAULT_PERSONA);
    expect(nodes.map((n) => n.nodeId)).toEqual(EXPECTED_ORDER);
  });

  it("returns PIPELINE_NODES reference for DEFAULT_PERSONA", () => {
    expect(buildPipeline(DEFAULT_PERSONA)).toBe(PIPELINE_NODES);
  });

  it("returns the 8-node uniform pipeline for nasabahPayroll=false, pasanganPayroll=false", () => {
    const nodes = buildPipeline({ nasabahPayroll: false, pasanganPayroll: false });
    expect(nodes.map((n) => n.nodeId)).toEqual(EXPECTED_ORDER);
  });

  it("returns the 8-node uniform pipeline for nasabahPayroll=true, pasanganPayroll=true", () => {
    const nodes = buildPipeline({ nasabahPayroll: true, pasanganPayroll: true });
    expect(nodes.map((n) => n.nodeId)).toEqual(EXPECTED_ORDER);
  });

  it("returns the 8-node uniform pipeline with no argument", () => {
    const nodes = buildPipeline();
    expect(nodes.map((n) => n.nodeId)).toEqual(EXPECTED_ORDER);
  });

  it("returns PIPELINE_NODES reference with no argument", () => {
    expect(buildPipeline()).toBe(PIPELINE_NODES);
  });
});
