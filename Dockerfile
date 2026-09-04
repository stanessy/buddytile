# Build the static site, serve it with nginx.
FROM node:20-alpine AS build
WORKDIR /site
COPY . .
# Pull the latest published posts/projects/reviews from the platform API, then
# build. Each fetch keeps the committed JSON if the API is unreachable.
RUN node scripts/fetch-projects.js; node scripts/fetch-reviews.js; node scripts/fetch-posts.js; node build.js

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/docs /usr/share/nginx/html
EXPOSE 80
