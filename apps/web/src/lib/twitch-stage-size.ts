// A 16:9 stage as wide as the column allows but never taller than the window, so the controls stay in view on wide
// screens; the same bound the YouTube watch page uses in cinema mode.
export const TWITCH_STAGE_SIZE = "mx-auto aspect-video w-[min(100%,calc((100svh-6rem)*16/9))]";
