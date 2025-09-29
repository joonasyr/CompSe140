FROM node:20-slim

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY index.js ./

EXPOSE 8080
ENV DATA_DIR=/data
CMD ["node", "index.js"]
