FROM node:22-alpine

WORKDIR /app

# Copiar só o package.json e o lock antes do código aproveita o cache:
# se só o código mudar, o npm ci não roda de novo.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
