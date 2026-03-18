# Stage 1: Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ .
ARG VITE_API_URL=""
ARG VITE_DEPLOY_MODE=selfhost
# Empty VITE_API_URL -> same-origin requests (no CORS needed)
RUN VITE_API_URL="$VITE_API_URL" VITE_DEPLOY_MODE="$VITE_DEPLOY_MODE" npm run build

# Stage 2: Python backend + serve frontend static
FROM python:3.11-slim
RUN groupadd -r app && useradd -r -g app -d /app app
WORKDIR /app

COPY requirements.txt requirements-migrate.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-migrate.txt

COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .
COPY data/common_words/ data/common_words/
COPY data/demo/ data/demo/
COPY data/worldpacks/ data/worldpacks/

COPY --from=frontend-build /web/dist/ /app/static/

RUN mkdir -p /data && chown app:app /data
USER app

ENV DEPLOY_MODE=selfhost
ENV SCNGS_DATA_DIR=/data
EXPOSE 8000

CMD ["sh", "-c", "python -m app.selfhost_db_bootstrap && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
