    FROM node:22-slim

    WORKDIR /app

    RUN ["npm"  , "install" , "-g" , "pnpm@11.24.0"]

    COPY . /app

    RUN ["pnpm" , "install" , "--frozen-lockfile" , "--filter" , "@queueengine/broker..."]

    RUN ["pnpm" ,  "--filter" , "@queueengine/broker..." , "build"]

    EXPOSE 3000

    CMD ["node" , "packages/broker/dist/index.js"]