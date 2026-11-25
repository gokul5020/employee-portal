from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, date, timezone
from ..database import get_db
from ..models import Attendance, User
from ..schemas import AttendanceResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

def utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

@router.get("/status", response_model=AttendanceResponse)
async def get_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Attendance)
        .filter(Attendance.user_id == current_user.id, Attendance.check_out_time.is_(None))
        .order_by(Attendance.check_in_time.desc())
    )
    active = result.scalars().first()
    if not active:
        # Return a dummy response with None check-out indicating checked out
        return {
            "id": 0,
            "user_id": current_user.id,
            "date": date.today(),
            "check_in_time": utc_now_naive(),
            "check_out_time": utc_now_naive(),
            "hours_worked": 0.0,
            "status": "CHECKED_OUT"
        }
    return active

@router.post("/check-in", response_model=AttendanceResponse)
async def check_in(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if already checked in
    result = await db.execute(
        select(Attendance)
        .filter(Attendance.user_id == current_user.id, Attendance.check_out_time.is_(None))
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already checked in"
        )
        
    new_log = Attendance(
        user_id=current_user.id,
        date=date.today(),
        check_in_time=utc_now_naive(),
        status="PRESENT"
    )
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    return new_log

@router.post("/check-out", response_model=AttendanceResponse)
async def check_out(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Attendance)
        .filter(Attendance.user_id == current_user.id, Attendance.check_out_time.is_(None))
        .order_by(Attendance.check_in_time.desc())
    )
    active = result.scalars().first()
    if not active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active check-in session found"
        )
        
    active.check_out_time = utc_now_naive()
    duration = active.check_out_time - active.check_in_time
    active.hours_worked = max(0.0, duration.total_seconds() / 3600.0)
    
    db.add(active)
    await db.commit()
    await db.refresh(active)
    return active

@router.get("/history", response_model=list[AttendanceResponse])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Attendance)
        .filter(Attendance.user_id == current_user.id)
        .order_by(Attendance.date.desc())
    )
    return result.scalars().all()
