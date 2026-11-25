import asyncio
from getpass import getpass

from sqlalchemy.exc import IntegrityError

from .account_provisioning import create_employee_account
from .database import AsyncSessionLocal, async_engine


async def provision_employee() -> None:
    email = input("Work email: ")
    full_name = input("Full name: ")
    department = input("Department (optional): ")
    position = input("Position (optional): ")
    password = getpass("Password (minimum 12 characters): ")
    confirmation = getpass("Confirm password: ")

    if password != confirmation:
        raise ValueError("Passwords do not match.")

    async with AsyncSessionLocal() as db:
        try:
            user = await create_employee_account(
                db,
                email=email,
                password=password,
                full_name=full_name,
                department=department,
                position=position,
            )
            await db.commit()
        except IntegrityError as error:
            await db.rollback()
            raise ValueError("An account with that email address already exists.") from error

    print("Employee account created for " + user.email)


async def main() -> None:
    try:
        await provision_employee()
    finally:
        await async_engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (ValueError, TypeError) as error:
        raise SystemExit(str(error)) from error
