from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from ..database import get_db
from ..models import LeaveRequest, User
from ..schemas import LeaveRequestCreate, LeaveRequestResponse, LeaveReviewRequest
from ..auth import get_current_user, require_manager

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])

@router.post("", response_model=LeaveRequestResponse)
async def create_request(
    leave_data: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if leave_data.start_date > leave_data.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date"
        )
        
    req = LeaveRequest(
        user_id=current_user.id,
        leave_type=leave_data.leave_type,
        start_date=leave_data.start_date,
        end_date=leave_data.end_date,
        reason=leave_data.reason,
        status="PENDING"
    )
    db.add(req)
    await db.commit()
    
    # Reload with joined load to fill relationships
    res = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user), joinedload(LeaveRequest.reviewer))
        .filter(LeaveRequest.id == req.id)
    )
    return res.scalars().first()

@router.get("", response_model=list[LeaveRequestResponse])
async def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user), joinedload(LeaveRequest.reviewer))
        .filter(LeaveRequest.user_id == current_user.id)
        .order_by(LeaveRequest.created_at.desc())
    )
    return res.scalars().all()

@router.get("/pending", response_model=list[LeaveRequestResponse])
async def get_pending_requests(
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == "ROLE_ADMIN":
        query = select(LeaveRequest).filter(LeaveRequest.status == "PENDING")
    else:
        sub_res = await db.execute(select(User.id).filter(User.manager_id == current_user.id))
        sub_ids = sub_res.scalars().all()
        query = select(LeaveRequest).filter(LeaveRequest.status == "PENDING", LeaveRequest.user_id.in_(sub_ids))
        
    res = await db.execute(
        query.options(joinedload(LeaveRequest.user), joinedload(LeaveRequest.reviewer))
        .order_by(LeaveRequest.created_at.asc())
    )
    return res.scalars().all()

@router.post("/{leave_id}/review", response_model=LeaveRequestResponse)
async def review_request(
    leave_id: int,
    review: LeaveReviewRequest,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user), joinedload(LeaveRequest.reviewer))
        .filter(LeaveRequest.id == leave_id)
    )
    req = res.scalars().first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
        
    if current_user.role != "ROLE_ADMIN":
        if req.user.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to review this request"
            )
            
    req.status = review.status
    req.reviewed_by = current_user.id
    # Map 'comments' key to 'manager_comments' in leave review schema
    req.manager_comments = review.manager_comments
    
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req
