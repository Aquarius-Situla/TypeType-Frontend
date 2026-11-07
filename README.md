<div align="center">
  <img src="https://raw.githubusercontent.com/TypeType-Video/TypeType/main/assets/banner.svg" alt="TypeType" width="100%">
  <h1>TypeType Frontend</h1>
  <p>The React web client for TypeType.</p>
</div>

You want to know the current position of TypeType about AI ? Go check [this](https://github.com/TypeType-Video/TypeType/blob/dev/AI_TRANSPARENCY.md).

[![Translation status](https://translate.typetype.video/widgets/typetype/-/svg-badge.svg)](https://translate.typetype.video/engage/typetype/)

This repository contains the browser application and its nginx container. It owns the user interface, routing, settings, account flows, library views, and integration with the TypeType API and playback package.

If you want to install or update a complete TypeType instance, use the [central TypeType repository](https://github.com/TypeType-Video/TypeType) and the [self-hosting documentation](https://typetype-video.github.io/Docs-TypeType/self-hosting/introduction).

## Responsibilities

- Responsive desktop and mobile interface
- Search, channels, watch pages, playlists, subscriptions, and history
- Account, administration, import, and instance settings flows
- HTTP integration with TypeType-Server
- Playback UI around `@typetype/mse`, Vidstack, DASH, and HLS providers
- Theme, accessibility, and browser behavior

Playback engine internals belong in [TypeType-Player](https://github.com/TypeType-Video/TypeType-Player). Extraction and user data belong in [TypeType-Server](https://github.com/TypeType-Video/TypeType-Server).

## Stack

| Area | Technology |
| --- | --- |
| UI | React 19 and TypeScript |
| Build | Vite 8 |
| Routing and server state | TanStack Router and TanStack Query |
| Local state | Zustand |
| Styling | Tailwind CSS 4 |
| Playback shell | Vidstack, `@typetype/mse`, dash.js, and hls.js |
| Tooling | Bun, Biome, Knip, and Sherif |

## Development

Requirements:

- Bun 1.4.4
- A running [TypeType-Server](https://github.com/TypeType-Video/TypeType-Server)

```sh
bun install --frozen-lockfile
cp apps/web/.env.example apps/web/.env
bun run dev
```

The development server starts at `http://localhost:5173` by default.

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API URL embedded in the frontend |
| `VITE_DEV_PROXY_TARGET` | API target used by the Vite development proxy |

## Project structure

| Path | Contents |
| --- | --- |
| `apps/web/src/routes` | Application routes |
| `apps/web/src/components` | Shared interface and player components |
| `apps/web/src/hooks` | Query and behavior hooks |
| `apps/web/src/lib` | API clients, helpers, and integration code |
| `apps/web/src/settings` | Settings definitions and controls |
| `apps/web/src/stores` | Client-side state stores |
| `apps/web/tests` | Frontend tests |

## Checks

```sh
bun run check
bun run test
bun run knip
bun run sherif
bun run build
```

Translation contributors can use [Weblate](https://translate.typetype.video/engage/typetype/)
without editing code. The current catalog status can also be inspected locally
with `bun run localization:report -- --markdown`. See
[LOCALIZATION.md](LOCALIZATION.md) for the source catalog, Weblate sync rules,
and the contributor workflow.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Bug reports and feature requests belong in the [central issue tracker](https://github.com/TypeType-Video/TypeType/issues).

## License

TypeType Frontend is licensed under the [MIT License](LICENSE). TypeType is not affiliated with, authorized by, or endorsed by YouTube, Google, NicoNico, BiliBili, or their affiliates.
