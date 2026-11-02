"""Parâmetros da painel-api. Podem ser trocados pelo .env (seção 3 do guia)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Conexão SOMENTE LEITURA (role painel_leitura, só com SELECT).
    # Vem do docker-compose.yml como DATABASE_URL.
    database_url: str

    # Regras de negócio
    velocidade_media_kmh: float = 25.0
    qtd_atendimentos_media: int = 10
    tempo_padrao_min: float = 15.0
    limite_fila_baixa_min: float = 30.0
    limite_fila_moderada_min: float = 90.0
    dado_desatualizado_min: int = 10

    # Infra
    timezone: str = "America/Sao_Paulo"
    # Várias origens separadas por vírgula: "http://localhost:5173,http://outro.com"
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_lista(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
