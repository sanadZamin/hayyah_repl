/**
 * Hayyah CRM (web) — build & push Docker image, then SSH deploy on remote host.
 *
 * Credentials: dockerhub-deploy (Docker Hub username + token/password)
 * Deploy key: mount /var/jenkins_home/.ssh/id_deploy or set DEPLOY_SSH_CREDENTIALS_ID
 *
 * Server: compose file in DEPLOY_DIR must use ${IMAGE_TAG} and ${DOCKER_REPO}
 * (see deploy/docker-compose.yaml).
 *
 * Bind Secret text env var VITE_CLIENT_SECRET on the Jenkins job for web builds.
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
        string(name: 'COMPOSE_SERVICE', defaultValue: 'web', description: 'Compose service name to pull/up (must exist in compose file)')
        booleanParam(name: 'SYNC_COMPOSE_FILE', defaultValue: true, description: 'Upload deploy/docker-compose.yaml to the server before deploy')
        string(name: 'DEPLOY_SSH_CREDENTIALS_ID', defaultValue: '', description: 'Optional Jenkins SSH credential ID')
        string(name: 'DEPLOY_SSH_KEY', defaultValue: '/var/jenkins_home/.ssh/id_deploy', description: 'SSH private key file (if no credential ID)')
        string(name: 'VITE_API_BASE_URL', defaultValue: 'https://hayyah.me', description: 'Web build: API origin')
        string(name: 'VITE_AUTH_BASE_URL', defaultValue: 'https://hayyah.me', description: 'Web build: auth origin')
        string(name: 'VITE_AUTH_TOKEN_URL', defaultValue: '', description: 'Web build: token URL (empty = derive from auth base)')
        string(name: 'VITE_AUTH_REFRESH_URL', defaultValue: '', description: 'Web build: refresh URL (optional)')
    }

    environment {
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        DOCKER_REPO = "${params.DOCKER_REPO}"
        IMAGE = "${params.DOCKER_REPO}:${IMAGE_TAG}"
        PUSH_LATEST = "${params.PUSH_LATEST}"
        DEPLOY_HOST = "${params.DEPLOY_HOST}"
        DEPLOY_USER = "${params.DEPLOY_USER}"
        DEPLOY_DIR = "${params.DEPLOY_DIR?.trim() ?: '/hayyah'}"
        COMPOSE_FILE = "${params.COMPOSE_FILE?.trim() ?: 'docker-compose.yaml'}"
        COMPOSE_SERVICE = "${params.COMPOSE_SERVICE?.trim() ?: 'web'}"
        SYNC_COMPOSE_FILE = "${params.SYNC_COMPOSE_FILE}"
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
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-deploy',
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_TOKEN'
                )]) {
                    sh '''#!/usr/bin/env bash
set -euo pipefail
command -v docker >/dev/null || { echo "ERROR: docker not in PATH"; exit 127; }
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USER" --password-stdin
docker buildx inspect --bootstrap >/dev/null 2>&1 || docker buildx create --use --name jenkins-builder

API_BASE="${VITE_API_BASE_URL:-https://hayyah.me}"
AUTH_BASE="${VITE_AUTH_BASE_URL:-https://hayyah.me}"
TOKEN_URL="${VITE_AUTH_TOKEN_URL:-}"
if [ -z "$TOKEN_URL" ]; then
  TOKEN_URL="${AUTH_BASE%/}/auth/realms/hayyah/protocol/openid-connect/token"
fi
REFRESH_URL="${VITE_AUTH_REFRESH_URL:-}"
if [ -z "$REFRESH_URL" ]; then
  REFRESH_URL="${AUTH_BASE%/}/auth/realms/hayyah/protocol/openid-connect/token"
fi

tags="-t ${IMAGE}"
[ "${PUSH_LATEST}" = "true" ] && tags="$tags -t ${DOCKER_REPO}:latest"
echo "Building Hayyah web → ${IMAGE}"
docker buildx build --platform linux/amd64 $tags -f Dockerfile.web --push . \
  --build-arg VITE_CLIENT_SECRET="${VITE_CLIENT_SECRET:-}" \
  --build-arg VITE_API_BASE_URL="$API_BASE" \
  --build-arg VITE_AUTH_BASE_URL="$AUTH_BASE" \
  --build-arg VITE_AUTH_TOKEN_URL="$TOKEN_URL" \
  --build-arg VITE_AUTH_REFRESH_URL="$REFRESH_URL"
echo "Push complete."
'''
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
SCP=(scp -o StrictHostKeyChecking=no -o BatchMode=yes)
if [ -n "${SSH_AUTH_SOCK:-}" ] && ssh-add -l >/dev/null 2>&1; then
  echo "SSH: using agent"
elif [ -f "${DEPLOY_SSH_KEY}" ]; then
  echo "SSH: using key ${DEPLOY_SSH_KEY}"
  SSH+=(-i "${DEPLOY_SSH_KEY}")
  SCP+=(-i "${DEPLOY_SSH_KEY}")
else
  echo "ERROR: no SSH key at ${DEPLOY_SSH_KEY} and no ssh-agent key"
  exit 1
fi

TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
echo "Deploy web → ${TARGET}:${DEPLOY_DIR} (IMAGE_TAG=${IMAGE_TAG} service=${COMPOSE_SERVICE})"

"${SSH[@]}" "$TARGET" "mkdir -p '${DEPLOY_DIR}'"

if [ "${SYNC_COMPOSE_FILE}" = "true" ]; then
  COMPOSE_SRC="${WORKSPACE:-.}/deploy/docker-compose.yaml"
  if [ ! -f "$COMPOSE_SRC" ]; then
    echo "ERROR: missing $COMPOSE_SRC — cannot SYNC_COMPOSE_FILE"
    exit 1
  fi
  echo "Uploading compose → ${DEPLOY_DIR}/${COMPOSE_FILE}"
  "${SCP[@]}" "$COMPOSE_SRC" "${TARGET}:${DEPLOY_DIR}/${COMPOSE_FILE}"
fi

"${SSH[@]}" "$TARGET" env \
  DEPLOY_DIR="${DEPLOY_DIR}" \
  IMAGE_TAG="${IMAGE_TAG}" \
  DOCKER_REPO="${DOCKER_REPO}" \
  COMPOSE_FILE="${COMPOSE_FILE}" \
  COMPOSE_SERVICE="${COMPOSE_SERVICE}" \
  bash -s <<'REMOTE'
set -e
echo "cd ${DEPLOY_DIR}"
cd "$DEPLOY_DIR" || { echo "ERROR: cannot cd to ${DEPLOY_DIR}"; exit 1; }
echo "Deploy directory: $(pwd)"
ls -la
export IMAGE_TAG="$IMAGE_TAG"
export DOCKER_REPO="$DOCKER_REPO"
echo "IMAGE_TAG=${IMAGE_TAG} DOCKER_REPO=${DOCKER_REPO} COMPOSE_FILE=${COMPOSE_FILE}"
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
else
  COMPOSE="docker-compose"
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: $COMPOSE_FILE not found in $DEPLOY_DIR"
  exit 1
fi

SERVICES=$($COMPOSE -f "$COMPOSE_FILE" config --services 2>/dev/null || true)
echo "Compose services: ${SERVICES:-<none>}"

if echo "$SERVICES" | grep -Fxq "$COMPOSE_SERVICE"; then
  $COMPOSE -f "$COMPOSE_FILE" pull "$COMPOSE_SERVICE"
  # Replace the same service container (new image tag), drop services removed from compose.
  $COMPOSE -f "$COMPOSE_FILE" up -d --remove-orphans --force-recreate --no-deps "$COMPOSE_SERVICE"
else
  echo "ERROR: service '$COMPOSE_SERVICE' not in $COMPOSE_FILE"
  echo "Set Jenkins parameter COMPOSE_SERVICE to one of the names above, or enable SYNC_COMPOSE_FILE."
  exit 1
fi
$COMPOSE -f "$COMPOSE_FILE" ps
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
            echo 'Failed — check dockerhub-deploy, SSH key, DEPLOY_DIR, compose file, and VITE_CLIENT_SECRET.'
        }
    }
}
