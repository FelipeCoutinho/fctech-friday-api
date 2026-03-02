# build
FROM node:18-alpine AS base
USER root
ARG PORT

WORKDIR /usr/src/app

COPY ./app . 

ENV PORT=${PORT}

RUN apk add --no-cache openssl libc6-compat
RUN npm ci && npm run prisma:generate

FROM base AS build
RUN npm install && npm run build

FROM base AS production
RUN npm prune --production

# release
FROM base

COPY --from=production /usr/src/app/package.json ./ 
COPY --from=build /usr/src/app/dist ./dist
COPY --from=production /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE $PORT

CMD ["node", "dist/src/main.js"]
