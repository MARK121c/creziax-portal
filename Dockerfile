# Step 1: Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build the app inside the container
RUN npm run build

# Step 2: Production Stage
FROM nginx:stable-alpine

WORKDIR /app

# Copy the built dist from the build stage
COPY --from=build /app/dist /app/public_html

# Nginx config for SPA routing and Cache Control
RUN echo 'server { \
    listen 80; \
    location / { \
        root /app/public_html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location = /index.html { \
        root /app/public_html; \
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"; \
        add_header Pragma "no-cache"; \
        add_header Expires 0; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
