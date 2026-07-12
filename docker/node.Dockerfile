FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Delete default node user to free up UID/GID 1000
RUN userdel -r node && \
    groupadd -r sandbox --gid=1000 && \
    useradd -r -g sandbox --uid=1000 --home-dir=/home/sandbox --shell=/bin/bash sandbox

WORKDIR /opt/socratica
COPY sandbox/entrypoint.sh ./
RUN chmod +x entrypoint.sh && chown -R sandbox:sandbox /opt/socratica

USER sandbox
ENTRYPOINT ["/opt/socratica/entrypoint.sh"]
