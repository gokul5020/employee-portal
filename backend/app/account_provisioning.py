from pydantic import EmailStr, TypeAdapter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import get_password_hash
from .models import User

email_adapter = TypeAdapter(EmailStr)


async def create_employee_account(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str,
    department: str = "",
    position: str = "",
) -> User:
    normalized_email = str(email_adapter.validate_python(email.strip())).lower()
    normalized_name = full_name.strip()
    if not normalized_name:
        raise ValueError("Full name cannot be empty.")
    if len(password) < 12:
        raise ValueError("Password must contain at least 12 characters.")
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password cannot exceed 72 UTF-8 bytes.")

    existing_user = await db.scalar(select(User).where(User.email == normalized_email))
    if existing_user:
        raise ValueError("An account with that email address already exists.")

    user = User(
        email=normalized_email,
        password=get_password_hash(password),
        full_name=normalized_name,
        role="ROLE_EMPLOYEE",
        department=department.strip() or None,
        position=position.strip() or None,
    )
    db.add(user)
    await db.flush()
    return user
