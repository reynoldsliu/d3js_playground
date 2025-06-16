# Kubernetes Deployment Configuration

This directory contains the Kubernetes configuration files for deploying multiple projects with both frontend and backend services.

## Project Structure
```
k8s/
├── config/
│   ├── namespaces.yml
│   └── secrets.yml
├── frontend/
│   ├── deployment.yml
│   ├── service.yml
│   └── ingress.yml
├── backend/
│   ├── deployment.yml
│   ├── service.yml
│   └── configmap.yml
└── monitoring/
    ├── prometheus.yml
    └── grafana.yml
```

## Prerequisites
- Minikube with VirtualBox driver
- Google Cloud SDK
- kubectl
- Docker

## Setup Instructions
1. Initialize Minikube:
```bash
minikube start --driver=virtualbox
```

2. Enable necessary addons:
```bash
minikube addons enable ingress
minikube addons enable metrics-server
```

3. Set up Google Cloud credentials:
```bash
gcloud auth login
```

4. Configure Docker to use Minikube's Docker daemon:
```bash
eval $(minikube docker-env)
```

## Deployment Steps
1. Build and push Docker images
2. Create namespaces
3. Deploy secrets and configmaps
4. Deploy backend services
5. Deploy frontend services
6. Set up monitoring

## Accessing Services
- Frontend: http://frontend.local
- Backend API: http://api.local
- Prometheus: http://prometheus.local
- Grafana: http://grafana.local
