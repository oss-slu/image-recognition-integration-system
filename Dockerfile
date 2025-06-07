# ---- Stage 1: Build the application ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies only (layer caching benefit)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy only needed files, thanks to .dockerignore
COPY . .

# Build the Next.js app
RUN yarn build

# ---- Stage 2: Production image ----
FROM node:20-alpine AS runner

WORKDIR /app

# Only copy essential runtime files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock

# Install only production dependencies
RUN yarn install --production

EXPOSE 3000

# Run the Next.js app
CMD ["yarn", "start"]
