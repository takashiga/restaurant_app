FROM python:3.12-slim

WORKDIR /app

RUN pip install poetry

# Copy the entire project first to ensure app directory is available
COPY . .

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --without dev --no-interaction --no-ansi

EXPOSE 8080

# Fly.io seems to be looking for this specific command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
