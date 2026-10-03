export class OfflinePlayerRecovery {
  private waitingForOnline = false;

  waitForOnline(): void {
    this.waitingForOnline = true;
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
