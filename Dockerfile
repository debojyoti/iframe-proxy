# pull the Node.js Docker image
FROM node:alpine

# create the directory inside the container
WORKDIR /usr/src/app

# copy the package.json files from local machine to the workdir in container
COPY package*.json ./
RUN apk add firefox
RUN which firefox
RUN apk add openjdk11 --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community
RUN npm install selenium-standalone -g

# install global and local packages
RUN npm install
RUN npm install pm2 -g

# copy the generated modules and all other files to the container
COPY . .

# our app is running on port 8080 within the container, so need to expose it
EXPOSE 8080

# the command that starts our app
#CMD ["pm2-runtime", "server.js"]
CMD ["/bin/sh", "start-script.sh"]
