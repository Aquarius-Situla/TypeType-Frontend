export class OfflinePlayerRecovery {
  private waitingForOnline = false;

  deferErrorUntilOnline(isOnline: boolean): boolean {
    if (isOnline) return false;
    this.waitingForOnline = true;
    return true;
  }

  resumeIfOnline(isOnline: boolean): boolean {
    if (!isOnline || !this.waitingForOnline) return false;
    this.waitingForOnline = false;
    return true;
  }

  reset(): void {
    this.waitingForOnline = false;
  }
}
