FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instala pnpm e dependências
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copia o código da aplicação
COPY . .

# Expõe a porta
EXPOSE 3000

# Comando para iniciar
CMD ["pnpm", "start"]