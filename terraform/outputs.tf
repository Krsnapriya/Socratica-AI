output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.socratica_server.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.socratica_server.public_dns
}

output "ssh_command" {
  description = "Command to SSH into the server"
  value       = "ssh ubuntu@${aws_instance.socratica_server.public_ip}"
}
