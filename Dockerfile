# Build the static site, serve it with nginx.
FROM node:20-alpine AS build
WORKDIR /site
COPY . .
RUN node build.js

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/docs /usr/share/nginx/html
EXPOSE 80
