FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r sandbox --gid=1000 && \
    useradd -r -g sandbox --uid=1000 --home-dir=/home/sandbox --shell=/bin/bash sandbox

WORKDIR /opt/socratica
COPY sandbox/entrypoint.sh ./
RUN chmod +x entrypoint.sh && chown -R sandbox:sandbox /opt/socratica

USER sandbox
ENTRYPOINT ["/opt/socratica/entrypoint.sh"]
