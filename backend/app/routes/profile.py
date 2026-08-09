from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from ..models import User
from ..schemas import UserBase, ProfileUpdate
from ..auth import get_current_user
from ..cache import cache_manager

router = APIRouter(prefix="/api/profile", tags=["Profile"])

@router.get("", response_model=UserBase)
async def get_profile(current_user: User = Depends(get_current_user)):
    # Check cache first
    cache_key = f"user:profile:{current_user.id}"
    cached = cache_manager.get(cache_key)
    if cached:
        return cached
        
    user_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "department": current_user.department,
        "position": current_user.position,
        "salary": current_user.salary,
        "bank_name": current_user.bank_name,
        "bank_account_number": current_user.bank_account_number,
        "manager_id": current_user.manager_id,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }
    cache_manager.set(cache_key, user_dict, expire_seconds=600)
    return current_user

@router.put("", response_model=UserBase)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.bank_name = profile_data.bank_name
    current_user.bank_account_number = profile_data.bank_account_number
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    cache_key = f"user:profile:{current_user.id}"
    cache_manager.delete(cache_key)
    
    return current_user
