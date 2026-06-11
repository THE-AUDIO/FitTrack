from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://fittrack:fittrack@postgres:5432/fittrack"
    jwt_secret: str = "change-me"
    jwt_refresh_secret: str = "change-me-too"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    frontend_url: str = "http://localhost:3001"
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.0-flash"
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"
    environment: str = "development"

    model_config = {"env_file": "../.env", "case_sensitive": False, "extra": "ignore"}


settings = Settings()
