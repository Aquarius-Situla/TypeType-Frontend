import type { FinaleFrame } from "../corridor/finale";
import type { AlarmFrame } from "../corridor/fire-alarm";
import type { Toy } from "../corridor/toys-behind";
import type { NurseryView } from "./nursery-room";
import type { WatcherView } from "./watcher-director";

export type FrameState = {
  eye: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  lamp: number;
  now: number;
  watcher: WatcherView | null;
  focus: number;
  stairDoor: number;
  sealed: boolean;
  shake: number;
  screen: number | null;
  finale: FinaleFrame | null;
  alarm: AlarmFrame | null;
  fade: number;
  nursery: NurseryView | null;
  toys: Toy[];
};
