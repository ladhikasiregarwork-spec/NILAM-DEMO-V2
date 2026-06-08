import type { OrchestrationEvent } from "@/types/orchestration";
export type EventListener = (e: OrchestrationEvent) => void;
