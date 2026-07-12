provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "socratica_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "socratica-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "socratica_igw" {
  vpc_id = aws_vpc.socratica_vpc.id
  tags = {
    Name = "socratica-igw"
  }
}

# Subnet
resource "aws_subnet" "socratica_public_subnet" {
  vpc_id                  = aws_vpc.socratica_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"
  tags = {
    Name = "socratica-public-subnet"
  }
}

# Route Table
resource "aws_route_table" "socratica_public_rt" {
  vpc_id = aws_vpc.socratica_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.socratica_igw.id
  }
  tags = {
    Name = "socratica-public-rt"
  }
}

resource "aws_route_table_association" "socratica_public_rta" {
  subnet_id      = aws_subnet.socratica_public_subnet.id
  route_table_id = aws_route_table.socratica_public_rt.id
}

# Security Group
resource "aws_security_group" "socratica_sg" {
  name        = "socratica-sg"
  description = "Allow inbound SSH, HTTP, and HTTPS"
  vpc_id      = aws_vpc.socratica_vpc.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "socratica-sg"
  }
}

# Data source for latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# Key Pair
resource "aws_key_pair" "socratica_key" {
  key_name   = "socratica-deploy-key"
  public_key = file(var.public_key_path)
}

# EC2 Instance
resource "aws_instance" "socratica_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.socratica_public_subnet.id
  key_name      = aws_key_pair.socratica_key.key_name

  vpc_security_group_ids = [aws_security_group.socratica_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y ca-certificates curl gnupg lsb-release git unzip
              
              # Install Docker
              mkdir -m 0755 -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
                $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

              # Start Docker and enable on boot
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu

              # Create app directory
              mkdir -p /home/ubuntu/socratica
              chown -R ubuntu:ubuntu /home/ubuntu/socratica
              EOF

  tags = {
    Name = "socratica-production-server"
  }
}
