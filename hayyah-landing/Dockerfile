# Hayyah marketing landing — static site served by nginx.
# Build from repository root:
#   docker build -f hayyah-landing/Dockerfile -t hayyah-landing:latest .

FROM nginx:1.27-alpine

ARG APP_URL=https://hayyah.me
ARG AUTH_URL=https://hayyah.me/auth/realms/hayyah/protocol/openid-connect/auth

COPY hayyah-landing/nginx.conf /etc/nginx/conf.d/default.conf

COPY hayyah-landing/public /usr/share/nginx/html

COPY artifacts/hayyah-crm/public/images/hayyah-wordmark-blue.png /usr/share/nginx/html/images/hayyah-wordmark-blue.png
COPY artifacts/hayyah-crm/public/images/hayyah-icon-blue.png /usr/share/nginx/html/images/hayyah-icon-blue.png

RUN sed -i "s|__APP_URL__|${APP_URL}|g" /usr/share/nginx/html/index.html \
  && sed -i "s|__AUTH_URL__|${AUTH_URL}|g" /usr/share/nginx/html/index.html

EXPOSE 80
