FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.cache/pip pip install --timeout 300 --retries 10 ".[test]"
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

