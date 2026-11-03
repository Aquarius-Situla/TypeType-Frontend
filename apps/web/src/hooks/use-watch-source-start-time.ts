import type { MutableRefObject } from "react";
import { useRef } from "react";

type Args = {
  streamId: string;
  sourceKey: string;
  sourceIdentity: string;
  retryKey: number;
  startTime: number;
  positionRef: MutableRefObject<number>;
};

export type SourceState = {
  streamId: string;
  sourceKey: string;
  sourceIdentity: string;
  retryKey: number;
  revision: number;
  startTime: number;
};

type SourceInput = Omit<SourceState, "revision" | "startTime"> & {
  requestedStartTime: number;
  currentPosition: number;
};

function validPosition(position: number) {
  return Number.isFinite(position) ? Math.max(0, position) : 0;
}

export function nextSourceState(state: SourceState | null, input: SourceInput): SourceState {
  const { requestedStartTime, currentPosition, ...source } = input;
  if (!state || state.streamId !== source.streamId || state.retryKey !== source.retryKey) {
    return { ...source, revision: 0, startTime: requestedStartTime };
  }
  if (state.sourceKey === source.sourceKey && state.sourceIdentity === source.sourceIdentity) {
    return state;
  }
  return {
    ...source,
    revision: state.revision + 1,
    startTime: currentPosition > 0 ? currentPosition : requestedStartTime,
  };
}

export function useWatchSourceStartTime({
  streamId,
  sourceKey,
  sourceIdentity,
  retryKey,
  startTime,
  positionRef,
}: Args) {
  const stateRef = useRef<SourceState | null>(null);
  const current = nextSourceState(stateRef.current, {
    streamId,
    sourceKey,
    sourceIdentity,
    retryKey,
    requestedStartTime: validPosition(startTime),
    currentPosition: validPosition(positionRef.current),
  });
  stateRef.current = current;
  return {
    keyPart: `${current.sourceKey}:${current.revision}`,
    startTime: current.startTime,
  };
}
