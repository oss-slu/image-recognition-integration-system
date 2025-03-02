# ---- Stage 1: Build the application ----
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /app

# Copy only package.json and yarn.lock to install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the project
COPY . .

# Build the Next.js application
RUN yarn build

# ---- Stage 2: Production image ----
FROM node:20-alpine AS runner

WORKDIR /app

# Copy the build artifacts from the builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Start the Next.js server
CMD ["yarn", "start"]
