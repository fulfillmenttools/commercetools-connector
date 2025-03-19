FROM node:20.19.0 AS builder
ENV TINI_VERSION=v0.19.0
RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
  && case "${dpkgArch##*-}" in \
  amd64) ARCH='amd64';; \
  arm64) ARCH='arm64';; \
  *) echo "unsupported architecture"; exit 1;; \
  esac \
  && curl -fsSLO --retry 3 --compressed "https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${ARCH}" \
  && curl -fsSLO --retry 3 --compressed "https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${ARCH}.sha256sum" \
  && sha256sum -c tini-${ARCH}.sha256sum \
  && mv tini-${ARCH} /tini \
  && chmod +x /tini
WORKDIR /home/node
USER node
COPY --chown=node:node service/ ./service/
COPY --chown=node:node shared/ ./shared/
RUN npm ci --prefix shared --ignore-scripts --progress=false --fund=false --fetch-retries=5
RUN npm ci --prefix service --ignore-scripts --progress=false --fund=false --fetch-retries=5
RUN npm --prefix shared run build
RUN npm --prefix service run build

FROM node:20.19.0-slim
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NO_COLOR=true
ARG SHORT_SHA=0
ENV SHORT_SHA=${SHORT_SHA}
COPY --from=builder /tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]
WORKDIR /home/node
USER node
COPY --chown=node:node shared/package*.json shared/
COPY --chown=node:node service/package*.json service/
COPY --chown=node:node --from=builder /home/node/service/build service/dist
COPY --chown=node:node --from=builder /home/node/shared/lib shared/lib
RUN npm ci --prefix shared --ignore-scripts --only=production --progress=false --fund=false --fetch-retries=5 && npm cache clean --force
RUN npm ci --prefix service --ignore-scripts --only=production --progress=false --fund=false --fetch-retries=5 && npm cache clean --force
CMD [ "node", "service/dist/index" ]
