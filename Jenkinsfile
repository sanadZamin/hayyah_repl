/**
 * Hayyah CRM (web) — build & push Docker image, then SSH deploy on remote host.
 *
 * Credentials: dockerhub-deploy (Docker Hub username + token/password)
 * Deploy key: mount /var/jenkins_home/.ssh/id_deploy or set DEPLOY_SSH_CREDENTIALS_ID
 *
 * Server: use the existing compose file in DEPLOY_DIR (not uploaded from git).
 * That file must reference ${IMAGE_TAG} and ${DOCKER_REPO} for the web image.
 *
 * Credentials: KEYCLOAK_CLIENT_SECRET_CRED_ID — Secret text → VITE_CLIENT_SECRET; auth URL → Keycloak /auth/realms/...
 */
pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 60, unit: 'MINUTES')
        timestamps()
    }

    parameters {
        string(name: 'DOCKER_REPO', defaultValue: 'altshiftcreative/hayyah-web', description: 'Docker Hub image (no tag)')
        booleanParam(name: 'PUSH_LATEST', defaultValue: true, description: 'Also push :latest')
        string(name: 'DEPLOY_HOST', defaultValue: '149.102.140.178', description: 'Deploy host')
        string(name: 'DEPLOY_USER', defaultValue: 'root', description: 'SSH user')
        string(name: 'DEPLOY_DIR', defaultValue: '/hayyah/frontend', description: 'Directory with docker-compose on host')
        string(name: 'COMPOSE_FILE', defaultValue: 'docker-compose.yaml', description: 'Compose filename in DEPLOY_DIR')
        string(name: 'COMPOSE_SERVICE', defaultValue: 'web', description: 'Compose service name to pull/up (must exist in server compose file)')
        string(name: 'COMPOSE_PROJECT_NAME', defaultValue: 'hayyah-web', description: 'Compose project name (-p). Must not match your API/Keycloak stack project (e.g. hayyah)')
        string(name: 'DEPLOY_SSH_CREDENTIALS_ID', defaultValue: '', description: 'Optional Jenkins SSH credential ID')
        string(name: 'DEPLOY_SSH_KEY', defaultValue: '/var/jenkins_home/.ssh/id_deploy', description: 'SSH private key file (if no credential ID)')
        string(name: 'VITE_API_BASE_URL', defaultValue: 'https://hayyah.me', description: 'Web build: API origin')
        string(name: 'VITE_AUTH_BASE_URL', defaultValue: 'https://hayyah.me', description: 'Web build: auth origin')
        string(name: 'VITE_AUTH_TOKEN_URL', defaultValue: '', description: 'Web build: token URL (empty = derive from auth base)')
        string(name: 'VITE_AUTH_REFRESH_URL', defaultValue: '', description: 'Web build: refresh URL (optional)')
        string(name: 'KEYCLOAK_CLIENT_SECRET_CRED_ID', defaultValue: 'hayyah-keycloak-client-secret', description: 'Jenkins Secret text credential ID (web_client secret for VITE_CLIENT_SECRET build-arg)')

    }

    environment {
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        DOCKER_REPO = "${params.DOCKER_REPO}"
        IMAGE = "${params.DOCKER_REPO}:${IMAGE_TAG}"
        PUSH_LATEST = "${params.PUSH_LATEST}"
        DEPLOY_HOST = "${params.DEPLOY_HOST}"
        DEPLOY_USER = "${params.DEPLOY_USER}"
        DEPLOY_DIR = "${params.DEPLOY_DIR?.trim() ?: '/hayyah/frontend'}"
        COMPOSE_FILE = "${params.COMPOSE_FILE?.trim() ?: 'docker-compose.yaml'}"
        COMPOSE_SERVICE = "${params.COMPOSE_SERVICE?.trim() ?: 'web'}"
        COMPOSE_PROJECT_NAME = "${params.COMPOSE_PROJECT_NAME?.trim() ?: 'hayyah-web'}"
        DEPLOY_SSH_KEY = "${params.DEPLOY_SSH_KEY}"
        VITE_API_BASE_URL = "${params.VITE_API_BASE_URL}"
        VITE_AUTH_BASE_URL = "${params.VITE_AUTH_BASE_URL}"
        VITE_AUTH_TOKEN_URL = "${params.VITE_AUTH_TOKEN_URL}"
        VITE_AUTH_REFRESH_URL = "${params.VITE_AUTH_REFRESH_URL}"
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Build & Push Web') {
            steps {
                script {
                    def secretCredId = params.KEYCLOAK_CLIENT_SECRET_CRED_ID?.trim() ?: 'hayyah-keycloak-client-secret'
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub-deploy',
                            usernameVariable: 'DOCKERHUB_USER',
                            passwordVariable: 'DOCKERHUB_TOKEN'
                        ),
                        string(
                            credentialsId: secretCredId,
                            variable: 'VITE_CLIENT_SECRET'
                        ),
                    ]) {
                        sh '''#!/usr/bin/env bash
set -euo pipefail
command -v docker >/dev/null || { echo "ERROR: docker not in PATH"; exit 127; }
if [ -z "${VITE_CLIENT_SECRET:-}" ]; then
  echo "ERROR: VITE_CLIENT_SECRET is empty — check Jenkins Secret text credential binding"
  exit 1
fi
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USER" --password-stdin
docker buildx inspect --bootstrap >/dev/null 2>&1 || docker buildx create --use --name jenkins-builder

# Relative path: nginx on the web host proxies /auth/ → hayyah.me (see nginx.conf).
TOKEN_URL="${VITE_AUTH_TOKEN_URL:-/auth/realms/hayyah/protocol/openid-connect/token}"
REFRESH_URL="${VITE_AUTH_REFRESH_URL:-/auth/realms/hayyah/protocol/openid-connect/token}"

tags="-t ${IMAGE}"
[ "${PUSH_LATEST}" = "true" ] && tags="$tags -t ${DOCKER_REPO}:latest"
echo "Building Hayyah web → ${IMAGE} (client_secret from Jenkins credential, not logged)"
docker buildx build --platform linux/amd64 $tags -f Dockerfile.web --push . \
  --build-arg VITE_CLIENT_SECRET="$VITE_CLIENT_SECRET" \
  --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL:-}" \
  --build-arg VITE_AUTH_BASE_URL="${VITE_AUTH_BASE_URL:-}" \
  --build-arg VITE_AUTH_TOKEN_URL="$TOKEN_URL" \
  --build-arg VITE_AUTH_REFRESH_URL="$REFRESH_URL"
echo "Push complete."
'''
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def credId = params.DEPLOY_SSH_CREDENTIALS_ID?.trim()
                    def run = {
                        sh '''#!/usr/bin/env bash
set -euo pipefail

SSH=(ssh -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=15)
if [ -n "${SSH_AUTH_SOCK:-}" ] && ssh-add -l >/dev/null 2>&1; then
  echo "SSH: using agent"
elif [ -f "${DEPLOY_SSH_KEY}" ]; then
  echo "SSH: using key ${DEPLOY_SSH_KEY}"
  SSH+=(-i "${DEPLOY_SSH_KEY}")
else
  echo "ERROR: no SSH key at ${DEPLOY_SSH_KEY} and no ssh-agent key"
  exit 1
fi

TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
echo "Deploy web → ${TARGET}:${DEPLOY_DIR} (IMAGE_TAG=${IMAGE_TAG} service=${COMPOSE_SERVICE})"
echo "Using existing compose on server (not uploaded from Jenkins)"

"${SSH[@]}" "$TARGET" env \
  DEPLOY_DIR="${DEPLOY_DIR}" \
  IMAGE_TAG="${IMAGE_TAG}" \
  DOCKER_REPO="${DOCKER_REPO}" \
  COMPOSE_FILE="${COMPOSE_FILE}" \
  COMPOSE_SERVICE="${COMPOSE_SERVICE}" \
  COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME}" \
  bash -s <<'REMOTE'
set -e
echo "cd ${DEPLOY_DIR}"
cd "$DEPLOY_DIR" || { echo "ERROR: cannot cd to ${DEPLOY_DIR}"; exit 1; }
echo "Deploy directory: $(pwd)"
ls -la
export IMAGE_TAG="$IMAGE_TAG"
export DOCKER_REPO="$DOCKER_REPO"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-hayyah-web}"
echo "IMAGE_TAG=${IMAGE_TAG} DOCKER_REPO=${DOCKER_REPO} COMPOSE_FILE=${COMPOSE_FILE} COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME}"
if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose -p "$COMPOSE_PROJECT_NAME")
else
  COMPOSE=(docker-compose -p "$COMPOSE_PROJECT_NAME")
fi

compose_ps_all() {
  echo "=== docker ps -a (all containers on host) ==="
  docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' || true
}

compose_ps_project() {
  echo "=== compose ps (project ${COMPOSE_PROJECT_NAME} only) ==="
  "${COMPOSE[@]}" -f "$COMPOSE_FILE" ps -a || true
}

compose_ps_all
compose_ps_project

if [ ! -f "$COMPOSE_FILE" ]; then
  if [ -f docker-compose.yml ] && [ "$COMPOSE_FILE" != docker-compose.yml ]; then
    echo "WARN: $COMPOSE_FILE missing; using docker-compose.yml"
    COMPOSE_FILE=docker-compose.yml
  elif [ -f docker-compose.yaml ] && [ "$COMPOSE_FILE" != docker-compose.yaml ]; then
    echo "WARN: $COMPOSE_FILE missing; using docker-compose.yaml"
    COMPOSE_FILE=docker-compose.yaml
  else
    echo "ERROR: compose file not found in $(pwd)"
    echo "Expected: $COMPOSE_FILE — maintain this file on the server under ${DEPLOY_DIR}"
    ls -la
    exit 1
  fi
fi
echo "Using server compose file: $(pwd)/$COMPOSE_FILE"

SERVICES=$("${COMPOSE[@]}" -f "$COMPOSE_FILE" config --services 2>/dev/null || true)
echo "Compose services in file: ${SERVICES:-<none>}"
echo "Top-level compose project name from file:"
grep -E '^[[:space:]]*name:' "$COMPOSE_FILE" 2>/dev/null || echo "(no name: key — project is -p ${COMPOSE_PROJECT_NAME})"

if echo "$SERVICES" | grep -Fxq "$COMPOSE_SERVICE"; then
  # Fixed container_name in compose (e.g. hayyah_frontend) blocks up if an old container
  # still exists under a different compose project (e.g. hayyah vs hayyah-web).
  FIXED_NAME=$(
    grep -A40 "^[[:space:]]*${COMPOSE_SERVICE}:" "$COMPOSE_FILE" \
      | grep -m1 'container_name:' \
      | sed -E 's/^[[:space:]]*container_name:[[:space:]]*//' \
      | tr -d "\"'" \
      | xargs \
      || true
  )
  if [ -n "${FIXED_NAME:-}" ]; then
    echo "compose container_name for ${COMPOSE_SERVICE}: ${FIXED_NAME}"
    CID=$(docker ps -aq -f "name=^/${FIXED_NAME}$" 2>/dev/null | head -1 || true)
    if [ -n "${CID:-}" ]; then
      OLD_PROJECT=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$CID" 2>/dev/null || echo "")
      echo "Existing container /${FIXED_NAME} → compose project=${OLD_PROJECT:-<none>} (deploy uses ${COMPOSE_PROJECT_NAME})"
      if [ "$OLD_PROJECT" != "$COMPOSE_PROJECT_NAME" ]; then
        echo "Removing /${FIXED_NAME} so deploy can recreate under project ${COMPOSE_PROJECT_NAME}"
        docker rm -f "$FIXED_NAME"
      fi
    fi
  fi

  echo "Pulling and recreating service=${COMPOSE_SERVICE} only (no --remove-orphans)"
  "${COMPOSE[@]}" -f "$COMPOSE_FILE" pull "$COMPOSE_SERVICE"
  "${COMPOSE[@]}" -f "$COMPOSE_FILE" rm -sf "$COMPOSE_SERVICE" 2>/dev/null || true
  # --no-deps: do not start/stop linked services. No --remove-orphans (that deletes other containers in this project).
  "${COMPOSE[@]}" -f "$COMPOSE_FILE" up -d --force-recreate --no-deps "$COMPOSE_SERVICE"
else
  echo "ERROR: service '$COMPOSE_SERVICE' not in $COMPOSE_FILE"
  echo "Set Jenkins parameter COMPOSE_SERVICE to one of the service names listed above."
  exit 1
fi
echo "=== After deploy ==="
compose_ps_project
compose_ps_all
REMOTE
'''
                    }
                    if (credId) {
                        sshagent(credentials: [credId]) { run() }
                    } else {
                        run()
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deployed ${IMAGE} (web) to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}"
        }
        failure {
            echo 'Failed — check dockerhub-deploy, KEYCLOAK_CLIENT_SECRET_CRED_ID, SSH key, DEPLOY_DIR, and compose file.'
        }
    }
}
