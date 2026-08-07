variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "project-d4899a6a-135b-4a98-b1b"
}

variable "region" {
  description = "GCP region for Cloud Run, VPC connector, and Artifact Registry"
  type        = string
  default     = "asia-south1"
}

variable "db_zone" {
  description = "Zone for the Mongo/Services VMs"
  type        = string
  default     = "asia-south1-a"
}

variable "sandbox_zone" {
  description = "Zone for the Docker sandbox VM"
  type        = string
  default     = "asia-south1-c"
}

variable "artifact_repo" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "socratica"
}

variable "sandbox_service_account" {
  description = "Service account attached to the sandbox VM (must have artifactregistry.writer)"
  type        = string
  default     = "897120847312-compute@developer.gserviceaccount.com"
}

variable "cloud_run_service_account" {
  description = "Runtime service account for the Cloud Run service (must have secretAccessor)"
  type        = string
  default     = "897120847312-compute@developer.gserviceaccount.com"
}
