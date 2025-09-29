plugins {
    kotlin("jvm") version "1.9.24"
    application
}

repositories {
    mavenCentral()
}

val ktorVersion = "2.3.12"

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-client-java:$ktorVersion")
    runtimeOnly("org.slf4j:slf4j-simple:2.0.13")
}

application {
    mainClass.set("com.example.ApplicationKt")
}

kotlin {
    jvmToolchain(17)
}
