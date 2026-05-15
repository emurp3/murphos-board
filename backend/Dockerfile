FROM python:3.11-slim

WORKDIR /app

# Install system deps needed for cryptography, psycopg2, and other compiled packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libssl-dev \
    libffi-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Shell form expands $PORT at runtime
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
