# Use the Puppeteer base image (which already includes Chromium)
FROM ghcr.io/puppeteer/puppeteer:22

USER root

# Add user so we don't need --no-sandbox.
RUN mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

# Install Puppeteer under /node_modules so it's available system-wide
COPY package.json /app/
RUN cd /app/ && npm install
COPY . /app/

ENTRYPOINT ["/usr/local/bin/node", "/app/index.js"]