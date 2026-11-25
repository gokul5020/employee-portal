import os

class Settings:
    PROJECT_NAME: str = "Employee Self-Service Portal"
    
    # Database Configurations
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "191617")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "employee_portal")
    
    DB_URL_OVERRIDE: str = os.getenv("DATABASE_URL", "")

    @property
    def DATABASE_URL(self) -> str:
        if self.DB_URL_OVERRIDE:
            return self.DB_URL_OVERRIDE
        # aiomysql is used for async, pymysql is used for sync (migrations / seeding check)
        return f"mysql+aiomysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        
    @property
    def SYNC_DATABASE_URL(self) -> str:
        if self.DB_URL_OVERRIDE:
            return self.DB_URL_OVERRIDE.replace("sqlite+aiosqlite", "sqlite")
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    # JWT Configs
    JWT_SECRET: str = os.getenv("JWT_SECRET", "SuperSecureSecretKey12345678901234567890123456789012")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours
    
    # Redis Configurations
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))

    # Optional OpenAI-compatible provider configuration for the HR assistant
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openai").lower()
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_API_URL: str = os.getenv("AI_API_URL", "https://api.openai.com/v1/chat/completions")
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4o-mini")
    ANTHROPIC_BASE_URL: str = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
    ANTHROPIC_AUTH_TOKEN: str = os.getenv("ANTHROPIC_AUTH_TOKEN", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest")

settings = Settings()
