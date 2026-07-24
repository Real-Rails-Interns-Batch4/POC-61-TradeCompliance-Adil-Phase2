# Use a lightweight Python base image
FROM python:3.11-slim

# Prevent Python from writing .pyc files and ensure output is not buffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the necessary application directories
COPY backend/ ./backend/
COPY adapters/ ./adapters/

# Set working directory to backend so that imports match the local execution structure
WORKDIR /app/backend

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
