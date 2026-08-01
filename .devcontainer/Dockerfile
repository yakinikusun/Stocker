FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# Install additional OS packages if needed
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
       git \
       curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set default working directory
WORKDIR /workspace
