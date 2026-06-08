"use client";

import { useMemo } from "react";
import type { OrchestrationEvent, NodeId, NodeStatus } from "@/types/orchestration";

export interface OrchestrationFeed {
  /** Newest event for each node, keyed by nodeId. */
  latest: Map<NodeId, OrchestrationEvent>;
  /** Returns the current NodeStatus for a given NodeId, or 'idle' if unseen. */
  statusOf: (id: NodeId) => NodeStatus;
  /** The reasoning string from the most recent event that carries one. */
  latestReasoning: string | undefined;
}

/**
 * Derives a read-optimised view of the raw `OrchestrationEvent[]` array.
 *
 * - `latest` is a stable Map rebuilt with `useMemo` so downstream components
 *   can look up any node in O(1) without scanning the full event log.
 * - `statusOf` is a closure over that Map — no state, no extra renders.
 * - `latestReasoning` scans the array right-to-left to find the most recent
 *   event that carries a reasoning string.
 *
 * The hook is a pure projection (no internal state); it re-computes only
 * when the `events` array reference changes.
 */
export function useOrchestrationFeed(events: OrchestrationEvent[]): OrchestrationFeed {
  return useMemo(() => {
    // Build latest-event map: later events overwrite earlier ones for the same
    // nodeId so the map always reflects the most recent status.
    const latest = new Map<NodeId, OrchestrationEvent>();
    for (const e of events) {
      latest.set(e.nodeId, e);
    }

    const statusOf = (id: NodeId): NodeStatus => {
      return latest.get(id)?.status ?? "idle";
    };

    // Find the most recent event with a reasoning string (right-to-left scan).
    let latestReasoning: string | undefined;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].reasoning) {
        latestReasoning = events[i].reasoning;
        break;
      }
    }

    return { latest, statusOf, latestReasoning };
  }, [events]);
}
