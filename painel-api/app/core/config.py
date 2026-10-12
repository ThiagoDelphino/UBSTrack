"""Configurações da painel-api.

Cada atributo aqui é lido de uma variável de ambiente com o mesmo nome
em maiúsculas (database_url <- DATABASE_URL). Se a variável não existir,
vale o valor padrão escrito aqui.

Os números das regras de negócio ficam TODOS aqui, nunca espalhados
pelo código. Assim, para testar "e se a velocidade for 20 km/h?",
basta mudar a variável no .env.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Fora do Docker, lê também um arquivo .env nesta pasta (se existir).
    model_config = SettingsConfigDict(env_file=".env")

    # Conexão (usuário de banco SOMENTE LEITURA)
    database_url: str

    # Endereços dos frontends que podem chamar esta API (separados por vírgula)
    cors_origins: str = "http://localhost:5173"

    # Regras de negócio (seção 6 do guia de arquitetura)
    velocidade_media_kmh: float = 25.0
    atendimentos_para_media: int = 10
    tempo_padrao_atendimento_min: float = 15.0
    limite_situacao_baixa_min: float = 30.0
    limite_situacao_alta_min: float = 90.0
    limite_dado_desatualizado_min: float = 10.0

    @property
    def cors_origins_lista(self) -> list[str]:
        return [origem.strip() for origem in self.cors_origins.split(",") if origem.strip()]


settings = Settings()
