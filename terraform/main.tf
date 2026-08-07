# Socratica AI — Google Cloud Platform infrastructure (Asia-South1)
#
# NOTE: The previous AWS-only terraform was removed. It referenced EC2/VPC/AMI
# resources that do not exist in this deployment and had no module wiring — the
# real infrastructure runs on GCP (Cloud Run + Compute Engine + Artifact
# Registry + Secret Manager). This file is the authoritative, GCP-accurate IaC
# and matches the resources provisioned for production.

terraform {
  required_version = ">= 1.3"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0, < 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  connector_cidr = "10.8.0.0/28"
  image_base     = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_repo}"
}

# ── VPC (existing "default" network is used by all VMs/connector) ───────────
data "google_compute_network" "default" {
  name = "default"
}

# ── Serverless VPC connector (Cloud Run -> private services) ────────────────
resource "google_vpc_access_connector" "socratica_connector" {
  name             = "socratica-connector"
  region           = var.region
  network          = data.google_compute_network.default.name
  ip_cidr_range    = local.connector_cidr
  machine_type     = "e2-micro"
  min_instances    = 2
  max_instances    = 10
  max_throughput   = 1000
  min_throughput   = 200
}

# ── Firewall: DB/sandbox ports only reachable from the VPC connector ────────
resource "google_compute_firewall" "allow_mongo" {
  name          = "allow-mongo"
  network       = data.google_compute_network.default.name
  direction     = "INGRESS"
  priority      = 1000
  source_ranges = [local.connector_cidr]
  allow {
    protocol = "tcp"
    ports    = ["27017"]
  }
}

resource "google_compute_firewall" "allow_redis" {
  name          = "allow-redis"
  network       = data.google_compute_network.default.name
  direction     = "INGRESS"
  priority      = 1000
  source_ranges = [local.connector_cidr]
  allow {
    protocol = "tcp"
    ports    = ["6379"]
  }
}

# Docker daemon TLS (2376) — reachable ONLY from the connector range.
resource "google_compute_firewall" "allow_sandbox_docker" {
  name          = "allow-sandbox-docker"
  network       = data.google_compute_network.default.name
  direction     = "INGRESS"
  priority      = 1000
  source_ranges = [local.connector_cidr]
  allow {
    protocol = "tcp"
    ports    = ["2376"]
  }
}

# ── Snapshot schedule (Mongo/DB disks, 7-day retention) ─────────────────────
resource "google_compute_resource_policy" "socratica_db_daily" {
  name        = "socratica-db-daily"
  region      = var.region
  snapshot_schedule_policy {
    schedule {
      daily {
        start_time = "02:00"
      }
    }
    retention_policy {
      max_retention_days    = 7
      on_source_disk_delete = "KEEP_AUTO_SNAPSHOTS"
    }
  }
}

resource "google_compute_disk_resource_policy_attachment" "mongo_snapshots" {
  name = google_compute_resource_policy.socratica_db_daily.name
  disk = google_compute_instance.socratica_mongo.boot_disk[0].source
  zone = var.db_zone
}

resource "google_compute_disk_resource_policy_attachment" "db_snapshots" {
  name = google_compute_resource_policy.socratica_db_daily.name
  disk = google_compute_instance.socratica_db.boot_disk[0].source
  zone = var.db_zone
}

# ── MongoDB VM (internal IP only) ────────────────────────────────────────────
resource "google_compute_instance" "socratica_mongo" {
  name                      = "socratica-mongo"
  machine_type              = "e2-small"
  zone                      = var.db_zone
  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 20
    }
  }

  network_interface {
    network    = data.google_compute_network.default.name
    subnetwork = "default"
    # No access_config => internal IP only (hardened; SSH via IAP)
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io
    docker run -d --name socratica-mongo --restart unless-stopped -p 27017:27017 -v mongo-data:/data/db mongo:7
    docker run -d --name socratica-redis --restart unless-stopped -p 6379:6379 redis:7-alpine
  EOT

  tags = ["db-server"]
}

# ── Services VM (Mongo replica / app services) ───────────────────────────────
resource "google_compute_instance" "socratica_db" {
  name                      = "socratica-db"
  machine_type              = "e2-small"
  zone                      = var.db_zone
  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 20
    }
  }

  network_interface {
    network    = data.google_compute_network.default.name
    subnetwork = "default"
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io
    docker run -d --name socratica-mongo --restart unless-stopped -p 27017:27017 -v mongo-data:/data/db mongo:7
  EOT

  tags = ["db-server"]
}

# ── Sandbox VM (Docker daemon with mTLS on 2376) ────────────────────────────
resource "google_compute_instance" "socratica_sandbox" {
  name                      = "socratica-sandbox"
  machine_type              = "e2-medium"
  zone                      = var.sandbox_zone
  allow_stopping_for_update = true

  service_account {
    email  = var.sandbox_service_account
    scopes = ["cloud-platform"]
  }

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 30
    }
  }

  network_interface {
    network    = data.google_compute_network.default.name
    subnetwork = "default"
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg openssl
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io google-cloud-cli
    mkdir -p /etc/docker/tls /etc/systemd/system/docker.service.d
    # TLS certs are provisioned out-of-band (see scripts/provision_docker_tls.sh) and
    # their public counterparts stored in Secret Manager for the Cloud Run client.
    printf '%s\n' '{"tlsverify": true, "tlscacert": "/etc/docker/tls/ca.pem", "tlscert": "/etc/docker/tls/server-cert.pem", "tlskey": "/etc/docker/tls/server-key.pem"}' > /etc/docker/daemon.json
    printf '%s\n' '[Service]' 'ExecStart=' 'ExecStart=/usr/bin/dockerd -H fd:// -H tcp://0.0.0.0:2376 --containerd=/run/containerd/containerd.sock' > /etc/systemd/system/docker.service.d/docker-tls.conf
    systemctl daemon-reload
    systemctl enable docker
    systemctl restart docker
    gcloud auth configure-docker ${var.region}-docker.pkg.dev --quiet
  EOT

  tags = ["sandbox-server"]
}

# ── Artifact Registry (sandbox images + api image) ──────────────────────────
resource "google_artifact_registry_repository" "socratica" {
  location      = var.region
  repository_id = var.artifact_repo
  format        = "DOCKER"
}

resource "google_artifact_registry_repository_iam_binding" "sandbox_writer" {
  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.socratica.name
  role       = "roles/artifactregistry.writer"
  members    = ["serviceAccount:${var.sandbox_service_account}"]
}

# ── Secret Manager ───────────────────────────────────────────────────────────
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "socratica-jwt-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "mongo_uri" {
  secret_id = "socratica-mongo-uri"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "redis_url" {
  secret_id = "socratica-redis-url"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "openrouter_key" {
  secret_id = "socratica-openrouter-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "nvidia_key" {
  secret_id = "socratica-nvidia-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "docker_ca" {
  secret_id = "socratica-docker-ca"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "docker_cert" {
  secret_id = "socratica-docker-cert"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "docker_key" {
  secret_id = "socratica-docker-key"
  replication {
    auto {}
  }
}

# Cloud Run runtime SA needs read access to all secrets.
resource "google_secret_manager_secret_iam_binding" "run_access" {
  provider = google
  project  = var.project_id
  for_each = {
    for s in [
      google_secret_manager_secret.jwt_secret,
      google_secret_manager_secret.mongo_uri,
      google_secret_manager_secret.redis_url,
      google_secret_manager_secret.openrouter_key,
      google_secret_manager_secret.nvidia_key,
      google_secret_manager_secret.docker_ca,
      google_secret_manager_secret.docker_cert,
      google_secret_manager_secret.docker_key,
    ] : s.secret_id => s.id
  }
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  members   = ["serviceAccount:${var.cloud_run_service_account}"]
}

# ── Cloud Run (socratica-api) ────────────────────────────────────────────────
resource "google_cloud_run_service" "socratica_api" {
  name     = "socratica-api"
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"         = "20"
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.socratica_connector.name
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
        "run.googleapis.com/startup-cpu-boost"    = "true"
      }
    }

    spec {
      container_concurrency = 20
      service_account_name  = var.cloud_run_service_account

      containers {
        image = "${local.image_base}/socratica-api:latest"

        resources {
          limits = {
            memory = "512Mi"
            cpu    = "1"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "CORS_ORIGIN"
          value = "https://socratica-server.vercel.app"
        }
        env {
          name  = "DOCKER_HOST"
          value = "tcp://10.160.0.4:2376"
        }

        dynamic "env" {
          for_each = {
            JWT_SECRET       = google_secret_manager_secret.jwt_secret.id
            MONGO_URI        = google_secret_manager_secret.mongo_uri.id
            REDIS_URL        = google_secret_manager_secret.redis_url.id
            OPENROUTER_API_KEY = google_secret_manager_secret.openrouter_key.id
            NVIDIA_API_KEY   = google_secret_manager_secret.nvidia_key.id
            DOCKER_CA        = google_secret_manager_secret.docker_ca.id
            DOCKER_CERT      = google_secret_manager_secret.docker_cert.id
            DOCKER_KEY       = google_secret_manager_secret.docker_key.id
          }
          content {
            name = env.key
            value_from {
              secret_key_ref {
                secret = env.value
                key    = "latest"
              }
            }
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_secret_manager_secret_iam_binding.run_access]
}

# Allow unauthenticated (public HTTPS) invocation of the API.
resource "google_cloud_run_service_iam_member" "public" {
  location = google_cloud_run_service.socratica_api.location
  project  = google_cloud_run_service.socratica_api.project
  service  = google_cloud_run_service.socratica_api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
