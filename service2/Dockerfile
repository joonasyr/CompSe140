# build
FROM gradle:8-jdk17 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN gradle --no-daemon clean installDist

#run
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/install/service2/ /app/
EXPOSE 8188
ENV STORAGE_URL=http://storage:8080 VSTORAGE_PATH=/vstorage/status.log SERVICE2_PORT=8188
CMD ["/app/bin/service2"]
