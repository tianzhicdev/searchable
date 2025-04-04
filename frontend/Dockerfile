# Stage 1: Build the React app
FROM node:16-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build   # Outputs to /app/build

# Stage 2: Just copy artifacts (no Nginx here)
FROM alpine:latest
WORKDIR /app
COPY --from=build-stage /app/build /app/build
