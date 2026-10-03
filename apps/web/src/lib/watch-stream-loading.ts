export function shouldLoadFullWatchStream(streamEnabled: boolean): boolean {
  return streamEnabled;
}

export function shouldLoadSabrBootstrap(streamEnabled: boolean, previewIsLive: boolean): boolean {
  return streamEnabled && !previewIsLive;
}

export function isWatchStreamPending(
  streamLoading: boolean,
  bootstrapLoading: boolean,
  placeholderData: boolean,
): boolean {
  return streamLoading || bootstrapLoading || placeholderData;
}
