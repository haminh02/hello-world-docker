FROM node:18
WORKDIR /lottery
COPY . .
RUN npm install
CMD ["npm", "start"]
EXPOSE 3000
