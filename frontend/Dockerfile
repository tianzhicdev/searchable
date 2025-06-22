# Stage 1: Build the React app
FROM node:22.11.0-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Conditionally run different build commands based on REACT_APP_BRANDING
# Print the REACT_APP_BRANDING value for debugging
RUN echo "Building for branding: $REACT_APP_BRANDING"

ARG REACT_APP_BRANDING

RUN if [ "$REACT_APP_BRANDING" = "eccentricprotocol" ]; then \
    echo "Building for eccentricprotocol..." && \
    npm run build-eccentricprotocol; \
  elif [ "$REACT_APP_BRANDING" = "local" ]; then \
    echo "Building for local development..." && \
    npm run build-local; \
  else \
    echo "Building default version..." && \
    npm run build; \
  fi

# Stage 2: Just copy artifacts (no Nginx here)
FROM alpine:latest
WORKDIR /app
COPY --from=build-stage /app/build /app/build
