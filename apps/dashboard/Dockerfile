FROM node:22-slim AS build

WORKDIR /app

RUN ["npm" , "install" , "-g" , "pnpm@11.24.0"]

COPY . /app

RUN ["pnpm" , "install" , "--frozen-lockfile" , "--filter" , "@queueengine/dashboard..."]

ARG VITE_BROKER_URL=http://localhost:3000

ENV VITE_BROKER_URL=$VITE_BROKER_URL

RUN ["pnpm" , "--filter" , "@queueengine/dashboard..." , "build"]

FROM nginx:alpine

COPY --from=build /app/apps/dashboard/dist /usr/share/nginx/html

EXPOSE 80

