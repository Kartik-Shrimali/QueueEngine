FROM node:22-slim

WORKDIR /app

RUN ["npm" , "install" , "-g" , "pnpm@11.24.0"]

COPY . /app

RUN ["pnpm" , "install" , "--frozen-lockfile" , "--filter" , "demo-worker..."]

RUN ["pnpm" , "--filter" , "@queueengine/worker..." , "build"]

CMD ["pnpm" , "--filter" , "demo-worker" , "dev"]