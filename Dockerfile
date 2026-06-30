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
COPY --from=build /app/dist /srv/site
COPY infra/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
