export type TensionInput = {
  focus: number;
  watched: boolean;
  alarm: boolean;
  shaking: boolean;
  onStairs: boolean;
  blind: boolean;
  screenOn: boolean;
  faceShown: boolean;
};

export function tension(input: TensionInput): number {
  if (input.watched || input.alarm) return 1;
  if (input.faceShown) return 0.9;
  if (input.shaking) return 0.8;
  if (input.blind && !input.screenOn) return 0.62;
  return Math.max(input.focus * 0.85, input.screenOn ? 0.55 : input.onStairs ? 0.3 : 0.08);
}

export const HEART_FROM = 0.45;
