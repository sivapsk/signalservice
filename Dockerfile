FROM node:20-alpine

RUN addgroup -S nonroot && adduser -S nonroot -G nonroot

RUN mkdir -p /node_modules
RUN mkdir -p /log
RUN chown nonroot /node_modules
RUN chown nonroot /log

COPY package*.json ./

RUN npm install

COPY ./app /app
COPY ./.env /.env
COPY ./app.js /app.js

EXPOSE 3000

USER nonroot

CMD [ "node", "app.js" ]

