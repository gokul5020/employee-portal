"""
AI Insights API endpoints
Provides AI-powered analytics and recommendations across all modules
"""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, date, timedelta, timezone
from typing import Optional, List
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Attendance, LeaveRequest, Payslip, TrainingCourse
from ..auth import get_current_user, require_manager
from ..config import settings
from ..services.ai_service import (
    AttendanceAIService,
    LeaveAIService,
    PayrollAIService,
    PerformanceAIService,
    SmartNotificationService,
)

router = APIRouter(prefix="/api/ai", tags=["AI Insights"])


# ── Response models ──────────────────────────────────────────────────────────

class AttendanceInsightsResponse(BaseModel):
    enabled: bool
    summary: Optional[str] = None
    strengths: Optional[list] = None
    suggestions: Optional[list] = None
    productivity_score: Optional[int] = None
    risk_flags: Optional[list] = None
    weekly_pattern_insight: Optional[str] = None
    burnout_risk: Optional[str] = None
    optimal_schedule: Optional[dict] = None
    forecast: Optional[dict] = None


class LeaveInsightsResponse(BaseModel):
    enabled: bool
    suggested_periods: Optional[list] = None
    tips: Optional[list] = None
    work_life_balance_score: Optional[int] = None
    recommendation_summary: Optional[str] = None


class LeaveAnalysisResponse(BaseModel):
    enabled: bool
    risk_level: Optional[str] = None
    considerations: Optional[list] = None
    recommendation: Optional[str] = None
    reasoning: Optional[str] = None
    approval_confidence: Optional[int] = None
    suggested_manager_response: Optional[str] = None


class LeaveDraftResponse(BaseModel):
    enabled: bool
    draft: Optional[str] = None
    tone: Optional[str] = None
    alternative_drafts: Optional[list] = None


class PayrollInsightsResponse(BaseModel):
    enabled: bool
    insights: Optional[list] = None
    savings_tips: Optional[list] = None
    budget_recommendation: Optional[str] = None
    financial_health_score: Optional[int] = None
    estimated_monthly_savings_potential: Optional[float] = None
    tax_optimization_tips: Optional[list] = None
    market_comparison: Optional[dict] = None
    forecast: Optional[dict] = None


class PerformanceInsightsResponse(BaseModel):
    enabled: bool
    overall_score: Optional[int] = None
    grade: Optional[str] = None
    strengths: Optional[list] = None
    areas_for_improvement: Optional[list] = None
    career_path_suggestions: Optional[list] = None
    next_steps: Optional[list] = None
    promotion_readiness: Optional[str] = None
    recognition_message: Optional[str] = None
    recommended_courses: Optional[list] = None
    learning_path_summary: Optional[str] = None
    quarterly_goals: Optional[list] = None


class DailyBriefingResponse(BaseModel):
    enabled: bool
    greeting: Optional[str] = None
    priorities: Optional[list] = None
    reminders: Optional[list] = None
    motivational_tip: Optional[str] = None
    focus_suggestion: Optional[str] = None
    wellness: Optional[dict] = None


class WorkSummaryResponse(BaseModel):
    as_of: datetime
    attendance: dict
    leave: dict
    payroll: dict
    learning: dict


class LeaveDraftRequest(BaseModel):
    leave_type: str
    start_date: str
    end_date: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/work-summary", response_model=WorkSummaryResponse)
async def get_work_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return factual, personal work metrics without requiring an AI provider."""
    today = date.today()
    period_start = today - timedelta(days=30)
    attendance_logs = (
        await db.execute(
            select(Attendance)
            .filter(
                Attendance.user_id == current_user.id,
                Attendance.date >= period_start,
            )
            .order_by(Attendance.check_in_time.desc())
        )
    ).scalars().all()
    completed_logs = [log for log in attendance_logs if log.check_out_time]
    hours_by_day: dict[date, float] = {}
    for log in completed_logs:
        hours = log.hours_worked
        if hours is None:
            hours = max(
                0.0,
                (log.check_out_time - log.check_in_time).total_seconds() / 3600,
            )
        hours_by_day[log.date] = hours_by_day.get(log.date, 0.0) + hours
    total_hours = sum(hours_by_day.values())
    active_log = next((log for log in attendance_logs if not log.check_out_time), None)

    leave_requests = (
        await db.execute(
            select(LeaveRequest)
            .filter(LeaveRequest.user_id == current_user.id)
            .order_by(LeaveRequest.start_date.asc())
        )
    ).scalars().all()
    leave_counts = {
        status_name.lower(): sum(1 for leave in leave_requests if leave.status == status_name)
        for status_name in ("PENDING", "APPROVED", "REJECTED")
    }
    next_approved_leave = next(
        (
            leave
            for leave in leave_requests
            if leave.status == "APPROVED" and leave.end_date >= today
        ),
        None,
    )

    latest_payslip = (
        await db.execute(
            select(Payslip)
            .filter(Payslip.user_id == current_user.id)
            .order_by(Payslip.year.desc(), Payslip.month.desc())
            .limit(1)
        )
    ).scalars().first()
    payslip_count = await db.scalar(
        select(func.count(Payslip.id)).filter(Payslip.user_id == current_user.id)
    )

    courses = (
        await db.execute(
            select(TrainingCourse)
            .filter(TrainingCourse.user_id == current_user.id)
            .order_by(TrainingCourse.title.asc())
        )
    ).scalars().all()
    completed_courses = [course for course in courses if course.status == "COMPLETED"]

    active_check_in = None
    if active_log:
        check_in_time = active_log.check_in_time
        if check_in_time.tzinfo is None:
            check_in_time = check_in_time.replace(tzinfo=timezone.utc)
        else:
            check_in_time = check_in_time.astimezone(timezone.utc)
        active_check_in = check_in_time

    return {
        "as_of": datetime.now(timezone.utc),
        "attendance": {
            "days_recorded": len(hours_by_day),
            "total_hours": round(total_hours, 2),
            "average_hours": round(total_hours / len(hours_by_day), 2)
            if hours_by_day
            else None,
            "active_check_in_at": active_check_in,
        },
        "leave": {
            "total_requests": len(leave_requests),
            **leave_counts,
            "next_approved": {
                "start_date": next_approved_leave.start_date,
                "end_date": next_approved_leave.end_date,
            }
            if next_approved_leave
            else None,
        },
        "payroll": {
            "payslip_count": payslip_count or 0,
            "latest_payslip": {
                "month": latest_payslip.month,
                "year": latest_payslip.year,
                "net_salary": latest_payslip.net_salary,
            }
            if latest_payslip
            else None,
        },
        "learning": {
            "total_courses": len(courses),
            "completed_courses": len(completed_courses),
            "completed_hours": sum(course.hours for course in completed_courses),
            "in_progress_courses": [
                course.title for course in courses if course.status == "IN_PROGRESS"
            ],
            "courses": [
                {"title": course.title, "status": course.status, "hours": course.hours}
                for course in courses
            ],
        },
    }


@router.get("/attendance/insights", response_model=AttendanceInsightsResponse)
async def get_attendance_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """AI-powered attendance pattern analysis, burnout risk and forecast"""
    if not settings.AI_API_KEY:
        return {"enabled": False}

    thirty_days_ago = date.today() - timedelta(days=30)
    result = await db.execute(
        select(Attendance)
        .filter(
            Attendance.user_id == current_user.id,
            Attendance.date >= thirty_days_ago,
            Attendance.check_out_time != None,
        )
        .order_by(Attendance.date.desc())
    )
    logs = result.scalars().all()

    if not logs:
        return {
            "enabled": True,
            "summary": "Not enough attendance data to analyse yet.",
            "suggestions": ["Start tracking your attendance regularly to unlock AI insights."],
        }

    pattern_analysis, optimal_hours, forecast = await asyncio.gather(
        AttendanceAIService.analyze_attendance_pattern(logs),
        AttendanceAIService.predict_optimal_work_hours(logs),
        AttendanceAIService.generate_attendance_forecast(logs),
        return_exceptions=True,
    )

    def safe(v):
        return v if isinstance(v, dict) else {}

    pa = safe(pattern_analysis)
    oh = safe(optimal_hours)
    fc = safe(forecast)

    return {
        "enabled": True,
        "summary": pa.get("summary"),
        "strengths": pa.get("strengths"),
        "suggestions": pa.get("suggestions"),
        "productivity_score": pa.get("productivity_score"),
        "risk_flags": pa.get("risk_flags"),
        "weekly_pattern_insight": pa.get("weekly_pattern_insight"),
        "burnout_risk": pa.get("burnout_risk"),
        "optimal_schedule": oh or None,
        "forecast": fc or None,
    }


@router.get("/leave/suggestions", response_model=LeaveInsightsResponse)
async def get_leave_suggestions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """AI leave planning suggestions with work-life balance score"""
    if not settings.AI_API_KEY:
        return {"enabled": False}

    result = await db.execute(
        select(LeaveRequest)
        .filter(LeaveRequest.user_id == current_user.id)
        .order_by(LeaveRequest.created_at.desc())
    )
    leave_history = result.scalars().all()

    team_leaves = []
    if current_user.manager_id:
        team_result = await db.execute(
            select(LeaveRequest)
            .join(User, LeaveRequest.user_id == User.id)
            .filter(
                User.manager_id == current_user.manager_id,
                LeaveRequest.user_id != current_user.id,
                LeaveRequest.start_date >= date.today(),
            )
        )
        team_leaves = team_result.scalars().all()

    suggestions = await LeaveAIService.suggest_leave_dates(leave_history, [], team_leaves)

    return {
        "enabled": True,
        "suggested_periods": suggestions.get("suggested_periods"),
        "tips": suggestions.get("tips"),
        "work_life_balance_score": suggestions.get("work_life_balance_score"),
        "recommendation_summary": suggestions.get("recommendation_summary"),
    }


@router.get("/leave/analyze/{leave_id}", response_model=LeaveAnalysisResponse)
async def analyze_leave_request(
    leave_id: int,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """AI analysis of a leave request for manager review"""
    if not settings.AI_API_KEY:
        return {"enabled": False}

    result = await db.execute(select(LeaveRequest).filter(LeaveRequest.id == leave_id))
    leave_request = result.scalars().first()
    if not leave_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    history_result = await db.execute(
        select(LeaveRequest)
        .filter(LeaveRequest.user_id == leave_request.user_id)
        .order_by(LeaveRequest.created_at.desc())
    )
    employee_history = history_result.scalars().all()

    analysis = await LeaveAIService.analyze_leave_request(
        leave_request.leave_type,
        leave_request.start_date,
        leave_request.end_date,
        leave_request.reason,
        employee_history,
    )

    return {"enabled": True, **analysis}


@router.post("/leave/draft", response_model=LeaveDraftResponse)
async def draft_leave_reason(
    body: LeaveDraftRequest,
    current_user: User = Depends(get_current_user),
):
    """AI-draft a professional leave reason"""
    if not settings.AI_API_KEY:
        return {"enabled": False}

    draft = await LeaveAIService.draft_leave_reason(
        body.leave_type, body.start_date, body.end_date
    )
    return {"enabled": True, **draft}


@router.get("/payroll/insights", response_model=PayrollInsightsResponse)
async def get_payroll_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """AI payroll insights including financial health score and earnings forecast"""
    if not settings.AI_API_KEY:
        return {"enabled": False}

    result = await db.execute(
        select(Payslip)
        .filter(Payslip.user_id == current_user.id)
        .order_by(Payslip.year.desc(), Payslip.month.desc())
        .limit(12)
    )
    payslips = result.scalars().all()

    if not payslips:
        return {"enabled": True, "insights": ["No payroll data available yet."]}

    async def empty_coro():
        return {}

    trends, market_comparison, forecast = await asyncio.gather(
        PayrollAIService.analyze_salary_trends(payslips),
        PayrollAIService.compare_market_salary(
            current_user.position or "Employee",
            current_user.department or "General",
            current_user.salary or 0,
        ) if current_user.position and current_user.salary else empty_coro(),
        PayrollAIService.forecast_annual_earnings(payslips, current_user.salary or 0),
        return_exceptions=True,
    )

    def safe(v):
        return v if isinstance(v, dict) else {}

    tr = safe(trends)
    mc = safe(market_comparison)
    fc = safe(forecast)

    return {
        "enabled": True,
        "insights": tr.get("insights"),
        "savings_tips": tr.get("savings_tips"),
        "budget_recommendation": tr.get("budget_recommendation"),
        "financial_health_score": tr.get("financial_health_score"),
        "estimated_monthly_savings_potential": tr.get("estimated_monthly_savings_potential"),
        "tax_optimization_tips": tr.get("tax_optimization_tips"),
        "market_comparison": mc or None,
        "forecast": fc or None,
    }


@router.get("/performance/summary", response_model=PerformanceInsightsResponse)
async def get_performance_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Comprehensive AI performance summary with goals and career path"""
    if not settings.AI_API_KEY:
        return {"enabled": False}

    thirty_days_ago = date.today() - timedelta(days=30)
    attendance_result = await db.execute(
        select(Attendance)
        .filter(Attendance.user_id == current_user.id, Attendance.date >= thirty_days_ago)
    )
    attendance_logs = attendance_result.scalars().all()

    if attendance_logs:
        avg_hours = sum(log.hours_worked or 0 for log in attendance_logs) / len(attendance_logs)
        attendance_score = min(100, (avg_hours / 8.0) * 100)
    else:
        attendance_score = 0

    training_result = await db.execute(
        select(TrainingCourse).filter(TrainingCourse.user_id == current_user.id)
    )
    courses = training_result.scalars().all()

    training_hours = sum(c.hours for c in courses if c.status == "COMPLETED")
    completed_courses = len([c for c in courses if c.status == "COMPLETED"])
    completed_titles = [c.title for c in courses if c.status == "COMPLETED"]

    performance, recommendations, goals = await asyncio.gather(
        PerformanceAIService.generate_performance_summary(
            attendance_score, training_hours, completed_courses,
            current_user.department or "General", current_user.position or "Employee",
        ),
        PerformanceAIService.recommend_training_courses(
            current_user.position or "Employee",
            current_user.department or "General",
            completed_titles,
        ),
        PerformanceAIService.generate_goal_suggestions(
            current_user.position or "Employee",
            current_user.department or "General",
            attendance_score,
            completed_titles,
        ),
        return_exceptions=True,
    )

    def safe(v):
        return v if isinstance(v, dict) else {}

    pf = safe(performance)
    rc = safe(recommendations)
    gl = safe(goals)

    return {
        "enabled": True,
        "overall_score": pf.get("overall_score"),
        "grade": pf.get("grade"),
        "strengths": pf.get("strengths"),
        "areas_for_improvement": pf.get("areas_for_improvement"),
        "career_path_suggestions": pf.get("career_path_suggestions"),
        "next_steps": pf.get("next_steps"),
        "promotion_readiness": pf.get("promotion_readiness"),
        "recognition_message": pf.get("recognition_message"),
        "recommended_courses": rc.get("recommended_courses"),
        "learning_path_summary": rc.get("learning_path_summary"),
        "quarterly_goals": gl.get("quarterly_goals"),
    }


@router.get("/daily-briefing", response_model=DailyBriefingResponse)
async def get_daily_briefing(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Personalised AI daily briefing with wellness check"""
    if not settings.AI_API_KEY:
        return {"enabled": False}

    today_result = await db.execute(
        select(Attendance).filter(
            Attendance.user_id == current_user.id,
            Attendance.date == date.today(),
        )
    )
    today_att = today_result.scalars().first()
    attendance_status = (
        "checked_in" if (today_att and not today_att.check_out_time) else "not_checked_in"
    )

    pending_count = (
        await db.execute(
            select(func.count(LeaveRequest.id)).filter(
                LeaveRequest.user_id == current_user.id,
                LeaveRequest.status == "PENDING",
            )
        )
    ).scalar() or 0

    training_count = (
        await db.execute(
            select(func.count(TrainingCourse.id)).filter(
                TrainingCourse.user_id == current_user.id,
                TrainingCourse.status == "IN_PROGRESS",
            )
        )
    ).scalar() or 0

    # Wellness: last 30 days
    thirty_days_ago = date.today() - timedelta(days=30)
    att_logs = (
        await db.execute(
            select(Attendance).filter(
                Attendance.user_id == current_user.id,
                Attendance.date >= thirty_days_ago,
                Attendance.check_out_time != None,
            )
        )
    ).scalars().all()

    avg_hours = sum(a.hours_worked or 0 for a in att_logs) / max(len(att_logs), 1)
    overtime_days = sum(1 for a in att_logs if (a.hours_worked or 0) > 9)

    leave_count = (
        await db.execute(
            select(func.count(LeaveRequest.id)).filter(
                LeaveRequest.user_id == current_user.id,
                LeaveRequest.status == "APPROVED",
            )
        )
    ).scalar() or 0

    briefing, wellness = await asyncio.gather(
        SmartNotificationService.generate_daily_briefing(
            current_user.full_name,
            attendance_status,
            pending_count,
            ["Christmas (25 Dec)", "New Year (1 Jan)"],
            training_count,
        ),
        SmartNotificationService.analyze_workload_stress(
            avg_hours, overtime_days, leave_count, 22
        ),
        return_exceptions=True,
    )

    def safe(v):
        return v if isinstance(v, dict) else {}

    return {
        "enabled": True,
        **safe(briefing),
        "wellness": safe(wellness) or None,
    }


@router.get("/smart-recommendations")
async def get_smart_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cross-module smart recommendations"""
    if not settings.AI_API_KEY:
        return {"enabled": False, "message": "AI features are not configured"}

    recommendations: dict = {
        "enabled": True,
        "timestamp": datetime.utcnow().isoformat(),
        "modules": {},
    }

    recent_att = (
        await db.execute(
            select(Attendance)
            .filter(Attendance.user_id == current_user.id)
            .order_by(Attendance.date.desc())
            .limit(7)
        )
    ).scalars().all()

    if recent_att:
        avg_h = sum(log.hours_worked or 0 for log in recent_att) / len(recent_att)
        if avg_h < 7:
            recommendations["modules"]["attendance"] = {
                "alert": "low_hours",
                "message": f"Your average this week is {avg_h:.1f}h/day",
                "suggestion": "Review time management or check if clock-out is being recorded",
            }
        elif avg_h > 10:
            recommendations["modules"]["attendance"] = {
                "alert": "overwork",
                "message": f"You're averaging {avg_h:.1f}h/day",
                "suggestion": "Consider delegating tasks and protecting personal time",
            }

    pending_leaves = (
        await db.execute(
            select(func.count(LeaveRequest.id)).filter(
                LeaveRequest.user_id == current_user.id,
                LeaveRequest.status == "PENDING",
            )
        )
    ).scalar() or 0

    if pending_leaves > 0:
        recommendations["modules"]["leave"] = {
            "pending_count": pending_leaves,
            "message": f"You have {pending_leaves} leave request(s) awaiting approval",
        }

    completed_courses = (
        await db.execute(
            select(func.count(TrainingCourse.id)).filter(
                TrainingCourse.user_id == current_user.id,
                TrainingCourse.status == "COMPLETED",
            )
        )
    ).scalar() or 0

    if completed_courses < 2:
        recommendations["modules"]["training"] = {
            "message": "Complete more training courses to boost your profile",
            "suggestion": "Visit the Performance section for AI-recommended courses",
        }

    return recommendations


# ── asyncio import needed for gather ─────────────────────────────────────────
import asyncio  # noqa: E402  (placed at bottom to avoid circular issues)
