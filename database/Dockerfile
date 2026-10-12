# Container que roda as migrations e termina.
# No docker-compose ele é o serviço "migrate": sobe, aplica as migrations
# no banco e sai. As APIs só iniciam depois que ele termina com sucesso.
FROM python:3.12-slim

WORKDIR /app

# Copiar o requirements antes do resto aproveita o cache do Docker:
# se só o código mudar, o pip install não roda de novo.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["alembic", "upgrade", "head"]
