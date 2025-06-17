FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5007

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5007", "--workers", "2", "--timeout", "120", "app:app"]