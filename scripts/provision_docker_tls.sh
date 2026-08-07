#!/bin/bash
set -euo pipefail

# provision_docker_tls.sh — generate a Docker daemon mTLS PKI for the sandbox VM.
#
# The sandbox VM (socratica-sandbox) runs dockerd on tcp://0.0.0.0:2376 with
# --tlsverify. Cloud Run reaches it through the VPC connector using the client
# certificate stored in Secret Manager (socratica-docker-ca/cert/key).
#
# Usage:
#   ./scripts/provision_docker_tls.sh <SANDBOX_INTERNAL_IP> [<SANDBOX_EXTERNAL_IP>]

SANDBOX_IP="${1:?usage: provision_docker_tls.sh <sandbox-internal-ip> [external-ip]}"
EXTERNAL_IP="${2:-}"
REGION="${REGION:-asia-south1}"
PROJECT="${PROJECT:-$(gcloud config get-value project)}"
SECRET_PREFIX="socratica-docker"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

cd "$WORKDIR"

# ── CA ────────────────────────────────────────────────────────────────────
openssl genrsa -out ca-key.pem 4096
openssl req -new -x509 -days 1825 -key ca-key.pem -sha256 \
  -subj "/CN=socratica-ca" -out ca.pem

# ── Server cert (daemon, on the sandbox VM) ────────────────────────────────
openssl genrsa -out server-key.pem 4096
cat > server-ext.cnf <<EOF
[req]
distinguished_name = dn
[dn]
[v3_req]
subjectAltName = DNS:localhost,IP:10.160.0.4,IP:${SANDBOX_IP}
extendedKeyUsage = serverAuth
EOF
openssl req -new -key server-key.pem -subj "/CN=socratica-sandbox" -out server.csr
openssl x509 -req -days 1825 -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem \
  -CAcreateserial -out server-cert.pem -extensions v3_req -extfile server-ext.cnf

# ── Client cert (Cloud Run / dockerode) ────────────────────────────────────
openssl genrsa -out client-key.pem 4096
openssl req -new -key client-key.pem -subj "/CN=cloudrun-client" -out client.csr
cat > client-ext.cnf <<EOF
[v3_req]
extendedKeyUsage = clientAuth
EOF
openssl x509 -req -days 1825 -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem \
  -CAcreateserial -out client-cert.pem -extensions v3_req -extfile client-ext.cnf

# ── Ship server certs to the sandbox VM ─────────────────────────────────────
gcloud compute ssh socratica-sandbox --zone "${REGION}-c" --command \
  "sudo mkdir -p /etc/docker/tls" --quiet
gcloud compute scp ca.pem server-cert.pem server-key.pem socratica-sandbox:/tmp/ \
  --zone "${REGION}-c" --quiet
gcloud compute ssh socratica-sandbox --zone "${REGION}-c" --command \
  "sudo mv /tmp/ca.pem /tmp/server-cert.pem /tmp/server-key.pem /etc/docker/tls/ && sudo chmod 600 /etc/docker/tls/server-key.pem" \
  --quiet

# ── Store client certs in Secret Manager for Cloud Run ──────────────────────
for entry in "ca:ca.pem" "cert:client-cert.pem" "key:client-key.pem"; do
  name="${entry%%:*}"
  file="${entry##*:}"
  gcloud secrets versions add "${SECRET_PREFIX}-${name}" --data-file="$file" --quiet
done

echo "TLS PKI provisioned. Restart dockerd on the sandbox VM to apply."
