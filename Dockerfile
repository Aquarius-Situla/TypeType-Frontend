FROM --platform=$BUILDPLATFORM oven/bun:1.4.3-alpine AS builder

WORKDIR /app

RUN apk upgrade --no-cache libcrypto3 libssl3

COPY bun.lock package.json ./
COPY apps/web/package.json ./apps/web/

RUN bun install --frozen-lockfile

COPY apps/web ./apps/web

RUN bun run --cwd apps/web build
RUN find apps/web/dist -type f \
        \( -name '*.css' -o -name '*.html' -o -name '*.js' -o -name '*.json' -o -name '*.svg' \) \
        -exec gzip -9 -k '{}' \;

FROM nginx:1.31.6-alpine AS runner
ARG BUILD_VERSION=0.1.0
ARG BUILD_REVISION=development
ARG BUILD_TIME=unknown

# Let the official entrypoint derive the resolver from the runtime network.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    TYPETYPE_SERVER_HOST=typetype-server \
    TYPETYPE_SERVER_PORT=8080 \
    TYPETYPE_TOKEN_HOST=typetype-token \
    TYPETYPE_TOKEN_PORT=8081 \
    TYPETYPE_DOWNLOADER_HOST=typetype-downloader \
    TYPETYPE_DOWNLOADER_PORT=18093

RUN apk upgrade --no-cache

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
RUN short_revision="$(printf '%s' "$BUILD_REVISION" | cut -c1-12)" \
    && printf '{"service":"typetype","version":"%s","revision":"%s","shortRevision":"%s","buildTime":"%s"}\n' \
        "$BUILD_VERSION" "$BUILD_REVISION" "$short_revision" "$BUILD_TIME" \
        > /usr/share/nginx/html/version.json \
    && printf '{"service":"web","version":"%s","revision":"%s","shortRevision":"%s","buildTime":"%s"}\n' \
        "$BUILD_VERSION" "$BUILD_REVISION" "$short_revision" "$BUILD_TIME" \
        > /usr/share/nginx/html/version-web.json

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
