import { useAuthStore } from "../stores/auth-store";
import { BILIBILI_FLV_BLOB_TYPE } from "./bilibili-flv-source";
import { toAbsoluteApiUrl } from "./env";
import type { MediaContext, MediaProviderLoader, MediaType, Src, VideoProvider } from "./vidstack";
import { VideoProviderLoader } from "./vidstack";

type MpegtsPlayer = ReturnType<typeof import("mpegts.js").default.createPlayer>;

class BilibiliFlvVideoProviderLoader implements MediaProviderLoader<VideoProvider> {
  private readonly videoLoader = new VideoProviderLoader();
  private currentTarget: HTMLElement | null = null;
  readonly name = "typetype-bilibili-flv";

  get target(): HTMLElement | null {
    return this.currentTarget;
  }

  set target(target: HTMLElement | null) {
    this.currentTarget = target;
    if (target instanceof HTMLVideoElement) this.videoLoader.target = target;
  }

  canPlay(src: Src): boolean {
    return (
      src.type === "video/object" &&
      src.src instanceof Blob &&
      src.src.type === BILIBILI_FLV_BLOB_TYPE
    );
  }

  mediaType(): MediaType {
    return "video";
  }

  async load(ctx: MediaContext): Promise<VideoProvider> {
    const provider = await this.videoLoader.load(ctx);
    const loadNativeSource = provider.loadSource.bind(provider);
    const destroyableProvider = provider as VideoProvider & { destroy?: () => void };
    const destroyNativeProvider = destroyableProvider.destroy?.bind(provider);
    let generation = 0;
    let flvPlayer: MpegtsPlayer | null = null;

    const destroyFlvPlayer = () => {
      flvPlayer?.destroy();
      flvPlayer = null;
    };
    const disposeProviderScope = provider.scope.dispose.bind(provider.scope);
    provider.scope.dispose = () => {
      generation += 1;
      destroyFlvPlayer();
      disposeProviderScope();
    };

    provider.loadSource = async (src, preload) => {
      const requestGeneration = ++generation;
      destroyFlvPlayer();

      if (!(src.src instanceof Blob) || src.src.type !== BILIBILI_FLV_BLOB_TYPE) {
        await loadNativeSource(src, preload);
        return;
      }

      const mediaHandleUrl = (await src.src.text()).trim();
      if (!mediaHandleUrl || requestGeneration !== generation) return;

      try {
        const mpegts = (await import("mpegts.js")).default;
        if (requestGeneration !== generation) return;
        if (!mpegts.isSupported()) {
          provider.video.dispatchEvent(new Event("error"));
          return;
        }

        const token = useAuthStore.getState().token;
        const player = mpegts.createPlayer(
          { type: "flv", isLive: true, url: toAbsoluteApiUrl(mediaHandleUrl) },
          {
            autoCleanupSourceBuffer: true,
            ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
          },
        );
        let errorDispatched = false;
        player.on(mpegts.Events.ERROR, () => {
          if (errorDispatched || requestGeneration !== generation) return;
          errorDispatched = true;
          provider.video.dispatchEvent(new Event("error"));
        });
        flvPlayer = player;
        player.attachMediaElement(provider.video);
        player.load();
      } catch {
        if (requestGeneration === generation) provider.video.dispatchEvent(new Event("error"));
      }
    };

    destroyableProvider.destroy = () => {
      generation += 1;
      destroyFlvPlayer();
      destroyNativeProvider?.();
    };
    return provider;
  }
}

export const BILIBILI_FLV_VIDEO_PROVIDER_LOADERS = [BilibiliFlvVideoProviderLoader];
