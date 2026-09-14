FROM node:22-alpine AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /src/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Run as the image's built-in unprivileged user rather than root — nginx's
# own master process would otherwise start as root even though it only
# listens on the unprivileged port 8080 below. The image ships an "nginx"
# user already; it just isn't activated by default. Only these directories
# need to be writable at runtime (cache dirs nginx opens on start, and the
# pid file) — everything else served is read-only.
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid
USER nginx

EXPOSE 8080
