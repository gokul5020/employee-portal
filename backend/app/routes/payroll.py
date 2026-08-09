from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from ..database import get_db
from ..models import Payslip, LeaveRequest, Attendance, User
from ..schemas import PayslipResponse
from ..auth import get_current_user, require_manager
from ..reports import generate_payslip_pdf, generate_leave_report, generate_attendance_report

router = APIRouter(prefix="/api/reports", tags=["Payroll and Reports"])

@router.get("/payslips", response_model=list[PayslipResponse])
async def get_payroll_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Payslip)
        .filter(Payslip.user_id == current_user.id)
        .order_by(Payslip.year.desc(), Payslip.month.desc())
    )
    return res.scalars().all()

@router.get("/payslips/download/{payslip_id}")
async def download_payslip(
    payslip_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Payslip)
        .filter(Payslip.id == payslip_id)
    )
    payslip = res.scalars().first()
    if not payslip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payslip not found"
        )
        
    if current_user.role != "ROLE_ADMIN" and payslip.user_id != current_user.id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to download this payslip"
         )
         
    user_res = await db.execute(select(User).filter(User.id == payslip.user_id))
    payslip_user = user_res.scalars().first()
    
    pdf_bytes = generate_payslip_pdf(payslip, payslip_user)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=payslip-{payslip.month:02d}-{payslip.year}.pdf"
        }
    )

@router.get("/attendance/excel")
async def download_my_attendance_excel(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Attendance)
        .options(joinedload(Attendance.user))
        .filter(Attendance.user_id == current_user.id)
        .order_by(Attendance.date.desc())
    )
    logs = res.scalars().all()
    excel_bytes = generate_attendance_report(logs)
    
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=my_attendance_history.xlsx"
        }
    )

@router.get("/leaves/excel")
async def download_my_leaves_excel(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user))
        .filter(LeaveRequest.user_id == current_user.id)
        .order_by(LeaveRequest.created_at.desc())
    )
    leaves = res.scalars().all()
    excel_bytes = generate_leave_report(leaves)
    
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=my_leave_history.xlsx"
        }
    )

@router.get("/admin/leaves/excel")
async def download_leaves_report(
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == "ROLE_ADMIN":
        query = select(LeaveRequest)
    else:
        sub_res = await db.execute(select(User.id).filter(User.manager_id == current_user.id))
        sub_ids = sub_res.scalars().all()
        query = select(LeaveRequest).filter(LeaveRequest.user_id.in_(sub_ids))
        
    res = await db.execute(
        query.options(joinedload(LeaveRequest.user))
        .order_by(LeaveRequest.created_at.desc())
    )
    leaves = res.scalars().all()
    
    excel_bytes = generate_leave_report(leaves)
    
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=all_leaves_history.xlsx"
        }
    )

@router.get("/admin/attendance/excel")
async def download_attendance_report(
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == "ROLE_ADMIN":
        query = select(Attendance)
    else:
        sub_res = await db.execute(select(User.id).filter(User.manager_id == current_user.id))
        sub_ids = sub_res.scalars().all()
        query = select(Attendance).filter(Attendance.user_id.in_(sub_ids))
        
    res = await db.execute(
        query.options(joinedload(Attendance.user))
        .order_by(Attendance.date.desc())
    )
    logs = res.scalars().all()
    
    excel_bytes = generate_attendance_report(logs)
    
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=all_attendance_history.xlsx"
        }
    )
