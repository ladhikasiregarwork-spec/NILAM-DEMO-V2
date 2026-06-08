export type NodeId =
  | "upload" | "ocr" | "validasi" | "fraud" | "identity" | "slik" | "income" | "thp";

export type NodeStatus = "idle" | "running" | "success";

export interface OrchestrationEvent {
  nodeId: NodeId;
  status: NodeStatus;
  label: string;
  progress?: number;
  reasoning?: string;
  output?: unknown;
  ts: number;
}
