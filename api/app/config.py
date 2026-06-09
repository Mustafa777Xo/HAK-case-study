from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./hak_approval.db"
    upload_dir: str = "uploads"
    max_upload_mb: int = 10

    class Config:
        env_file = ".env"


settings = Settings()
