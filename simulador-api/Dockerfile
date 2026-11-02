FROM python:3.12-slim

WORKDIR /app

# Copiar o requirements antes do código aproveita o cache do Docker:
# se só o código mudar, o pip install não roda de novo.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# --reload reinicia a API a cada arquivo salvo (só para desenvolvimento).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
