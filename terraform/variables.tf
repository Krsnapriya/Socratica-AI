variable "aws_region" {
  description = "The AWS region to deploy in"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "public_key_path" {
  description = "Path to the public SSH key to inject into the EC2 instance"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
