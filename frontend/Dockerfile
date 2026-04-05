FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

ARG REACT_APP_API_BASE_URL=http://localhost:8080/api
ARG REACT_APP_AI_BASE_URL=http://localhost:8001
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_AI_BASE_URL=$REACT_APP_AI_BASE_URL

COPY public ./public
COPY src ./src
COPY postcss.config.js tailwind.config.js ./

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
