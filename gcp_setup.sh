#!/bin/bash

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y \
    docker.io \
    docker-compose \
    git \
    curl \
    wget \
    gnupg2 \
    software-properties-common

# Install Minikube
wget https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# Enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER

# Configure Minikube
minikube config set memory 8192
minikube config set cpus 4

# Start Minikube
minikube start --driver=none

# Enable necessary addons
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard

# Configure Docker to use Minikube's Docker daemon
eval $(minikube docker-env)

# Clone your GitHub repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git project

echo "Setup complete!"
echo "Please restart your shell to apply group changes: exec $SHELL -l"
