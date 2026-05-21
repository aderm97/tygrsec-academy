FROM python:3.11-alpine

WORKDIR /app

RUN pip install flask gunicorn

COPY app.py .

EXPOSE 8080

CMD ["gunicorn", "-b", "0.0.0.0:8080", "-w", "1", "--timeout", "30", "app:app"]