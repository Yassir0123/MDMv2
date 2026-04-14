FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copier les fichiers Maven et le code source
COPY pom.xml .
COPY src ./src

# Construire le jar Spring Boot (sans les tests pour accélérer)
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copier le jar généré
COPY --from=build /app/target/mdm-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

