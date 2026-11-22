// What the player shows for a SABR video's time and duration. While a seek opens a new session, the element is
// detached for a moment and reads 0 for both: the last position (or the seek target) and the last duration stay.
export class SabrMediaReadout {
  #position = 0;
  #duration = Number.NaN;

  time(elementTime: number, transient: boolean): number {
    if (transient) return this.#position;
    this.#position = elementTime;
    return elementTime;
  }

  duration(elementDuration: number, transient: boolean): number {
    if (transient) return this.#duration;
    if (Number.isFinite(elementDuration) && elementDuration > 0) this.#duration = elementDuration;
    return elementDuration;
  }

  target(seconds: number): void {
    if (Number.isFinite(seconds)) this.#position = Math.max(0, seconds);
  }
}
