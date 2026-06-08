import type { PersonaConfig } from "@/types/flow";
import type { NodeId } from "@/types/orchestration";

export const PIPELINE_NODES: { nodeId: NodeId; label: string }[] = [
  { nodeId: "upload",   label: "Upload" },
  { nodeId: "ocr",      label: "OCR" },
  { nodeId: "validasi", label: "Validasi Dokumen" },
  { nodeId: "fraud",    label: "Fraud Detection" },
  { nodeId: "identity", label: "Identity Check" },
  { nodeId: "slik",     label: "SLIK Retrieval" },
  { nodeId: "income",   label: "Income Extraction" },
  { nodeId: "thp",      label: "THP Engine" },
];

export function buildPipeline(_p?: PersonaConfig) {
  return PIPELINE_NODES;
}
