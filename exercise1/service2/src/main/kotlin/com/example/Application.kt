package com.example

import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.io.File
import java.lang.System.getenv
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.file.FileSystems
import java.lang.management.ManagementFactory
import java.time.Instant
import java.time.temporal.ChronoUnit

private fun getTimestamp(): String {
    return Instant.now().truncatedTo(ChronoUnit.SECONDS).toString()
}

private fun getUptimeHours(): Double {
    val ms = ManagementFactory.getRuntimeMXBean().uptime
    return ms.toDouble() / 3_600_000.0
}

private fun getFreeDiskMB(): Double {
    return try {
        val store = FileSystems.getDefault().fileStores.first()
        store.usableSpace.toDouble() / (1024 * 1024)
    } catch (_: Exception) { 0.0 }
}

private fun buildLogMessage(prefix: String): String =
    "%s: %s uptime %.2f hours, free disk in root: %.1f MBytes"
        .format(prefix, getTimestamp(), getUptimeHours(), getFreeDiskMB())

private fun saveToVstorage(path: String, line: String) {
    File(path).appendText(line + "\n")
}

private fun postToStorage(storageUrl: String, line: String) {
    try {
        val client = HttpClient.newHttpClient()
        val req = HttpRequest.newBuilder()
            .uri(URI.create("$storageUrl/log"))
            .header("Content-Type", "text/plain")
            .POST(HttpRequest.BodyPublishers.ofString(line))
            .build()
        val res = client.send(req, HttpResponse.BodyHandlers.discarding())
        if (res.statusCode() !in 200..299) println("POST /log failed with ${res.statusCode()}")
    } catch (e: Exception) {
        println("Failed to POST to storage: $e")
    }
}

fun main() {
    val port = getenv("SERVICE2_PORT")?.toIntOrNull() ?: 8188
    val storageUrl = getenv("STORAGE_URL") ?: "http://storage:8080"
    val vstoragePath = getenv("VSTORAGE_PATH") ?: "/vstorage"

    embeddedServer(Netty, port = port, host = "0.0.0.0") {
        routing {
            get("/status") {
                val rec = buildLogMessage("Timestamp2")
                saveToVstorage(vstoragePath, rec)
                postToStorage(storageUrl, rec)
                call.respondText(rec)
            }
        }
    }.start(wait = true)
}
