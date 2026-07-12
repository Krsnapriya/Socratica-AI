FROM python:3.11-slim

RUN groupadd -r sandbox --gid=1000 && \
    useradd -r -g sandbox --uid=1000 --home-dir=/home/sandbox --shell=/bin/bash sandbox

WORKDIR /opt/socratica
COPY sandbox/tracer.py sandbox/entrypoint.sh ./
RUN chmod +x entrypoint.sh && chown -R sandbox:sandbox /opt/socratica

USER sandbox
ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["/opt/socratica/entrypoint.sh"]
