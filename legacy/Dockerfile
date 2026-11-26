# Build context: repository root (needs bff/data/seed.json)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY legacy/pom.xml legacy/pom.xml
COPY bff/data/seed.json bff/data/seed.json
COPY legacy/src legacy/src
RUN cd legacy && mvn -B -q -DskipTests package

FROM tomcat:10.1-jre21
RUN rm -rf /usr/local/tomcat/webapps/*
COPY --from=build /src/legacy/target/legacy.war /usr/local/tomcat/webapps/legacy.war
EXPOSE 8080
HEALTHCHECK CMD curl -fsS http://localhost:8080/legacy/healthz || exit 1
