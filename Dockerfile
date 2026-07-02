# Multi-stage build for the static Astro site. BUILT, NOT DEPLOYED here.
# Stage 1: build the static output.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: tiny static file server image. The runtime is just the built files;
# in production Caddy (see infra/Caddyfile) serves /srv/site from this output.
FROM caddy:2-alpine AS runtime
# Run Caddy as a non-root user. It still binds :80/:443, so grant the binary
# CAP_NET_BIND_SERVICE rather than running as root. Caddy keeps ACME certs/state
# in /data and /config (XDG_*), which must be writable by the non-root user; a
# freshly created named volume inherits this ownership from the image dir.
# MIGRATION: a host that already has root-owned caddy_data/caddy_config volumes
# from a previous root-run container must chown them once before deploying this:
#   docker compose run --rm --user root site chown -R 10001:10001 /data /config
RUN apk add --no-cache libcap \
    && setcap cap_net_bind_service=+ep "$(command -v caddy)" \
    && adduser -D -u 10001 caddyapp \
    && mkdir -p /data /config /srv \
    && chown -R caddyapp:caddyapp /data /config /srv
COPY --from=build --chown=caddyapp:caddyapp /app/dist /srv/site
COPY --chown=caddyapp:caddyapp infra/Caddyfile /etc/caddy/Caddyfile
USER caddyapp
EXPOSE 80 443
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
