"""Configurações da simulador-api.

Cada atributo é lido de uma variável de ambiente com o mesmo nome em
maiúsculas (database_url <- DATABASE_URL).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Fora do Docker, lê também um arquivo .env nesta pasta (se existir).
    model_config = SettingsConfigDict(env_file=".env")

    # Conexão (usuário de banco COM ESCRITA na tabela atendimento)
    database_url: str

    # Endereços dos frontends que podem chamar esta API (separados por vírgula)
    cors_origins: str = "http://localhost:5174"

    @property
    def cors_origins_lista(self) -> list[str]:
        return [origem.strip() for origem in self.cors_origins.split(",") if origem.strip()]


settings = Settings()
