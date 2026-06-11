from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://fittrack:fittrack@postgres:5432/fittrack"
    redis_url: str = "redis://redis:6379"
    jwt_secret: str = "change-me"
    jwt_refresh_secret: str = "change-me-too"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    frontend_url: str = "http://localhost:3000"
    anthropic_api_key: Optional[str] = None
    claude_model: str = "claude-sonnet-4-20250514"
    environment: str = "development"

    model_config = {"env_file": "../.env", "case_sensitive": False, "extra": "ignore"}


settings = Settings()
