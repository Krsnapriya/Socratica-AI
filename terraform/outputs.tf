output "cloud_run_url" {
  description = "Public HTTPS URL of the Cloud Run API"
  value       = google_cloud_run_service.socratica_api.status[0].url
}

output "mongo_internal_ip" {
  description = "Internal IP of the hardened MongoDB VM"
  value       = google_compute_instance.socratica_mongo.network_interface[0].network_ip
}

output "services_internal_ip" {
  description = "Internal IP of the Services VM"
  value       = google_compute_instance.socratica_db.network_interface[0].network_ip
}

output "sandbox_internal_ip" {
  description = "Internal IP of the Docker sandbox VM (DOCKER_HOST)"
  value       = google_compute_instance.socratica_sandbox.network_interface[0].network_ip
}

output "vpc_connector_cidr" {
  description = "VPC connector range (allowed source for DB/Redis/Docker firewall rules)"
  value       = "10.8.0.0/28"
}
