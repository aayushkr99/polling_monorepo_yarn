FROM node:18

WORKDIR /
COPY ./package.json ./

COPY . .

RUN npm install
EXPOSE 5000
CMD ["npm", "start"]