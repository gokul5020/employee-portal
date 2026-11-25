import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.account_provisioning import create_employee_account
from app.auth import verify_password
from app.database import Base
from app.models import User


@pytest.mark.asyncio
async def test_provisioned_employee_can_authenticate_with_hashed_password():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as db:
        user = await create_employee_account(
            db,
            email="  NEW.Employee@Example.com ",
            password="correct-horse-battery",
            full_name="  New Employee ",
            department=" IT ",
        )
        await db.commit()

        stored_user = await db.scalar(select(User).where(User.email == "new.employee@example.com"))
        assert stored_user is not None
        assert stored_user.full_name == "New Employee"
        assert stored_user.role == "ROLE_EMPLOYEE"
        assert stored_user.department == "IT"
        assert stored_user.password != "correct-horse-battery"
        assert verify_password("correct-horse-battery", stored_user.password)
        assert not verify_password("incorrect-password", stored_user.password)
        assert user.id == stored_user.id

    await engine.dispose()


@pytest.mark.asyncio
async def test_provisioning_rejects_duplicate_email_and_short_password():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as db:
        with pytest.raises(ValueError, match="at least 12 characters"):
            await create_employee_account(
                db, "employee@example.com", "short", "Employee"
            )

        await create_employee_account(
            db, "employee@example.com", "a-long-enough-password", "Employee"
        )
        await db.commit()

        with pytest.raises(ValueError, match="already exists"):
            await create_employee_account(
                db, "EMPLOYEE@example.com", "another-long-password", "Duplicate"
            )

    await engine.dispose()
