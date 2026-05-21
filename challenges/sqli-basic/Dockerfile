FROM python:3.11-alpine

WORKDIR /app

# Install dependencies
RUN pip install flask gunicorn

# Copy application
COPY app.py .

# Expose port
EXPOSE 8080

# Run with gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8080", "-w", "1", "--timeout", "30", "app:app"]