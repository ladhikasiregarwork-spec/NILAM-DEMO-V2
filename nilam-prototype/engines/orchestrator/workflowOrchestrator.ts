import type { PersonaConfig } from "@/types/flow";
import type { NodeId } from "@/types/orchestration";
import { buildPipeline } from "./pipelines";
import type { EventListener } from "./events";

const REASONING: Record<NodeId, string> = {
  upload:   "Memuat dokumen yang diunggah ke pipeline pemrosesan…",
  ocr:      "Mengekstrak data dari Slip Gaji & Mutasi…",
  validasi: "Memverifikasi kelengkapan mutasi ≥ 12 bulan & konsistensi periode…",
  fraud:    "Memeriksa keaslian & konsistensi dokumen…",
  identity: "Verifikasi identitas pasangan via KTP…",
  slik:     "Menarik data biro kredit SLIK OJK…",
  income:   "Menstrukturkan komponen pendapatan…",
  thp:      "Menghitung THP…",
};

export class WorkflowOrchestrator {
  private cancelled = false;

  cancel() {
    this.cancelled = true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Runs the 8-node pipeline sequentially, emitting lifecycle events.
   * `outputs` is keyed by NodeId and attached to each success event.
   * Cancellable: after cancel(), no further events are emitted.
   * cancel() is reset at the start of each run() so the same instance is reusable.
   */
  async run(
    persona: PersonaConfig | undefined,
    outputs: Partial<Record<NodeId, unknown>>,
    emit: EventListener,
  ): Promise<void> {
    // Reset so each run() starts fresh.
    this.cancelled = false;
    const nodes = buildPipeline(persona);

    for (const node of nodes) {
      if (this.cancelled) return;

      const base = { nodeId: node.nodeId, label: node.label };

      // Emit running with reasoning
      emit({ ...base, status: "running", progress: 0.15, reasoning: REASONING[node.nodeId], ts: Date.now() });
      await this.delay(360);
      if (this.cancelled) return;

      // Emit progress tick
      emit({ ...base, status: "running", progress: 0.7, ts: Date.now() });
      await this.delay(340);
      if (this.cancelled) return;

      // Emit success with node output
      emit({
        ...base,
        status: "success",
        progress: 1,
        output: outputs[node.nodeId],
        ts: Date.now(),
      });
      await this.delay(140);
    }
  }
}
