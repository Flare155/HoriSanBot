# use the official node image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM node AS base

WORKDIR /usr/src/app

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install necessary dependencies for Puppeteer and Chromium
RUN apt-get update \
    && apt-get install -y gnupg wget ca-certificates --no-install-recommends \
    && wget -qO - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable chromium-driver \
    && google-chrome --version && chromedriver --version

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json package-lock.json /temp/dev/
RUN cd /temp/dev && npm install --frozen-lockfile

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
ENV TZ='America/Montreal'
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENTRYPOINT ["node", "index.js"]