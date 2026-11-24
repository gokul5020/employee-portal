"""
Advanced AI Service for Employee Portal
Provides intelligent features across all modules
"""
import asyncio
import json
from typing import Optional, List, Dict, Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from datetime import datetime, date, timedelta
from ..config import settings

MAX_RESPONSE_BYTES = 128 * 1024


class AIService:
    """Centralized AI service for making OpenAI-compatible API calls"""

    @staticmethod
    def _make_request(
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000,
        json_mode: bool = False
    ) -> str:
        payload_data = {
            "model": settings.AI_MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload_data["response_format"] = {"type": "json_object"}

        payload = json.dumps(payload_data).encode("utf-8")
        request = Request(
            settings.AI_API_URL,
            data=payload,
            headers={
                "Authorization": f"Bearer {settings.AI_API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urlopen(request, timeout=45) as response:
                response_body = response.read(MAX_RESPONSE_BYTES + 1)
            if len(response_body) > MAX_RESPONSE_BYTES:
                raise ValueError("Response too large")
            result = json.loads(response_body)
            answer = result["choices"][0]["message"]["content"]
            if not isinstance(answer, str) or not answer.strip():
                raise ValueError("Empty response")
            return answer.strip()
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, KeyError, IndexError, TypeError) as e:
            raise Exception(f"AI request failed: {str(e)}")

    @staticmethod
    async def make_request_async(
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000,
        json_mode: bool = False
    ) -> str:
        return await asyncio.to_thread(
            AIService._make_request,
            messages,
            temperature,
            max_tokens,
            json_mode
        )


class AttendanceAIService:
    """AI features for attendance management"""

    @staticmethod
    async def analyze_attendance_pattern(attendance_logs: List[Any]) -> Dict[str, Any]:
        if not settings.AI_API_KEY or not attendance_logs:
            return {}

        total_days = len(attendance_logs)
        avg_hours = sum(log.hours_worked or 0 for log in attendance_logs) / max(total_days, 1)
        late_days = sum(1 for log in attendance_logs if log.check_in_time.hour >= 10)
        early_leaves = sum(1 for log in attendance_logs if log.check_out_time and log.check_out_time.hour < 17)
        overtime_days = sum(1 for log in attendance_logs if (log.hours_worked or 0) > 9)
        perfect_days = sum(1 for log in attendance_logs if log.check_in_time.hour <= 9 and (log.hours_worked or 0) >= 8)

        # Day-of-week breakdown
        dow_hours: Dict[int, List[float]] = {}
        for log in attendance_logs:
            dow = log.date.weekday()
            dow_hours.setdefault(dow, []).append(log.hours_worked or 0)
        dow_avg = {dow: sum(h)/len(h) for dow, h in dow_hours.items()}
        best_day = max(dow_avg, key=dow_avg.get) if dow_avg else None
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        summary = f"""
Attendance Summary (Last {total_days} working days):
- Average work hours/day: {avg_hours:.2f}h
- Late check-ins (after 10 AM): {late_days} days
- Early departures (before 5 PM): {early_leaves} days
- Overtime days (>9h): {overtime_days} days
- Perfect attendance days (on-time + 8h+): {perfect_days} days
- Most productive day of week: {day_names[best_day] if best_day is not None else 'N/A'}
- Attendance consistency score: {round((perfect_days/total_days)*100)}%
"""

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a senior HR analytics specialist. Analyze attendance patterns and provide "
                    "actionable, data-driven insights in JSON format with keys: "
                    "summary (string), strengths (array of strings), suggestions (array of strings), "
                    "productivity_score (integer 0-100), risk_flags (array of strings), "
                    "weekly_pattern_insight (string), burnout_risk (low|medium|high)."
                )
            },
            {"role": "user", "content": f"Analyze this employee attendance data:\n{summary}"}
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.4, max_tokens=700, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}

    @staticmethod
    async def predict_optimal_work_hours(attendance_logs: List[Any]) -> Dict[str, Any]:
        if not settings.AI_API_KEY or len(attendance_logs) < 3:
            return {}

        checkin_hours = [log.check_in_time.hour + log.check_in_time.minute/60 for log in attendance_logs if log.check_in_time]
        checkout_hours = [log.check_out_time.hour + log.check_out_time.minute/60 for log in attendance_logs if log.check_out_time]
        hours_worked = [log.hours_worked or 0 for log in attendance_logs]

        avg_checkin = sum(checkin_hours)/len(checkin_hours) if checkin_hours else 9.0
        avg_checkout = sum(checkout_hours)/len(checkout_hours) if checkout_hours else 17.0
        avg_hours = sum(hours_worked)/len(hours_worked) if hours_worked else 8.0
        peak_productivity_hour = round(avg_checkin + 2)  # ~2h after check-in

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a productivity and wellness advisor. Based on attendance patterns, "
                    "suggest an optimal work schedule. Return JSON with keys: "
                    "recommended_start_time (string like '09:00'), "
                    "recommended_end_time (string like '17:30'), "
                    "peak_productivity_window (string), "
                    "break_schedule (array of strings), "
                    "reasoning (string), "
                    "weekly_hours_target (number)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Average check-in: {avg_checkin:.1f}h, average check-out: {avg_checkout:.1f}h, "
                    f"average daily hours: {avg_hours:.1f}h, estimated peak productivity hour: {peak_productivity_hour}:00. "
                    f"Provide optimal schedule with wellness in mind."
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.5, max_tokens=400, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}

    @staticmethod
    async def generate_attendance_forecast(attendance_logs: List[Any]) -> Dict[str, Any]:
        """Forecast next week's attendance behaviour and flag potential issues"""
        if not settings.AI_API_KEY or len(attendance_logs) < 5:
            return {}

        recent_avg = sum(log.hours_worked or 0 for log in attendance_logs[:5]) / 5
        overall_avg = sum(log.hours_worked or 0 for log in attendance_logs) / len(attendance_logs)
        trend = "improving" if recent_avg > overall_avg else ("declining" if recent_avg < overall_avg - 0.5 else "stable")

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an HR predictive analytics engine. Based on attendance trends, "
                    "forecast next week and identify risks. Return JSON with keys: "
                    "trend (string), forecast_message (string), "
                    "predicted_weekly_hours (number), alerts (array of strings), "
                    "recommended_actions (array of strings)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Trend direction: {trend}. Recent 5-day average: {recent_avg:.1f}h. "
                    f"Overall average: {overall_avg:.1f}h. Total days tracked: {len(attendance_logs)}."
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.5, max_tokens=400, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}


class LeaveAIService:
    """AI features for leave management"""

    @staticmethod
    async def suggest_leave_dates(
        leave_history: List[Any],
        upcoming_holidays: List[date],
        team_leaves: List[Any]
    ) -> Dict[str, Any]:
        if not settings.AI_API_KEY:
            return {}

        today = date.today()
        months_ahead = [(today + timedelta(days=30*i)).strftime("%B %Y") for i in range(1, 4)]
        leave_types_used = {}
        for lv in leave_history:
            leave_types_used[lv.leave_type] = leave_types_used.get(lv.leave_type, 0) + 1

        context = f"""
Employee Leave Profile:
- Total leaves taken: {len(leave_history)}
- Leave types used: {json.dumps(leave_types_used)}
- Team members currently approved on leave: {len([l for l in team_leaves if l.status == 'APPROVED'])}
- Upcoming months: {', '.join(months_ahead)}
- Upcoming holidays count in next 3 months: {len(upcoming_holidays)}
"""

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an intelligent leave planning assistant. Suggest optimal leave periods "
                    "considering team availability, burnout prevention, and holiday bridging. "
                    "Return JSON with keys: "
                    "suggested_periods (array of objects with start_date, end_date, duration_days, reason, type), "
                    "tips (array of strings), "
                    "work_life_balance_score (integer 0-100), "
                    "recommendation_summary (string)."
                )
            },
            {"role": "user", "content": context}
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.6, max_tokens=600, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}

    @staticmethod
    async def analyze_leave_request(
        leave_type: str,
        start_date: date,
        end_date: date,
        reason: str,
        employee_history: List[Any]
    ) -> Dict[str, Any]:
        if not settings.AI_API_KEY:
            return {}

        days = (end_date - start_date).days + 1
        total_leaves = len(employee_history)
        approved = sum(1 for l in employee_history if l.status == "APPROVED")
        rejected = sum(1 for l in employee_history if l.status == "REJECTED")
        is_monday_or_friday = start_date.weekday() in (0, 4) or end_date.weekday() in (0, 4)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an HR manager AI helping review leave requests fairly and objectively. "
                    "Provide structured analysis in JSON with keys: "
                    "risk_level (low|medium|high), "
                    "considerations (array of strings), "
                    "recommendation (approve|review|deny), "
                    "reasoning (string), "
                    "approval_confidence (integer 0-100), "
                    "suggested_manager_response (string)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Leave Request:\nType: {leave_type}\nDuration: {days} day(s)\n"
                    f"Starts on {'Monday/Friday' if is_monday_or_friday else 'mid-week'}\n"
                    f"Reason: {reason}\n"
                    f"Employee leave history: {total_leaves} total ({approved} approved, {rejected} rejected)"
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.3, max_tokens=500, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}

    @staticmethod
    async def draft_leave_reason(leave_type: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """AI-draft a professional leave reason based on type and dates"""
        if not settings.AI_API_KEY:
            return {}

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a professional writing assistant helping employees write clear, "
                    "appropriate leave request reasons. Return JSON with keys: "
                    "draft (string — the drafted reason, 1-2 sentences), "
                    "tone (string), alternative_drafts (array of 2 strings)."
                )
            },
            {
                "role": "user",
                "content": f"Draft a professional leave reason for: Type={leave_type}, From={start_date} to {end_date}."
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.7, max_tokens=300, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}


class PayrollAIService:
    """AI features for payroll analysis"""

    @staticmethod
    async def analyze_salary_trends(payslips: List[Any]) -> Dict[str, Any]:
        if not settings.AI_API_KEY or not payslips:
            return {}

        avg_net = sum(p.net_salary for p in payslips) / len(payslips)
        avg_deductions = sum(p.deductions for p in payslips) / len(payslips)
        avg_allowances = sum(p.allowances for p in payslips) / len(payslips)
        max_net = max(p.net_salary for p in payslips)
        min_net = min(p.net_salary for p in payslips)
        effective_tax_rate = (avg_deductions / (avg_net + avg_deductions)) * 100 if (avg_net + avg_deductions) > 0 else 0

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a personal financial wellness advisor for employees. "
                    "Analyze salary data and provide actionable savings and budgeting advice. "
                    "Return JSON with keys: "
                    "insights (array of strings), "
                    "savings_tips (array of strings), "
                    "budget_recommendation (string), "
                    "estimated_monthly_savings_potential (number), "
                    "financial_health_score (integer 0-100), "
                    "tax_optimization_tips (array of strings)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Payroll Analysis:\nAverage net salary: ${avg_net:.2f}\n"
                    f"Average deductions: ${avg_deductions:.2f} (effective rate: {effective_tax_rate:.1f}%)\n"
                    f"Average allowances: ${avg_allowances:.2f}\n"
                    f"Range: ${min_net:.2f} - ${max_net:.2f}\n"
                    f"Months analyzed: {len(payslips)}"
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.5, max_tokens=600, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}

    @staticmethod
    async def compare_market_salary(
        position: str,
        department: str,
        current_salary: float,
        years_experience: int = 0
    ) -> Dict[str, Any]:
        if not settings.AI_API_KEY:
            return {}

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a compensation benchmarking analyst. Provide market salary insights. "
                    "Return JSON with keys: "
                    "market_range (object with min, mid, max as numbers), "
                    "competitiveness (below|at|above), "
                    "percentile_estimate (integer), "
                    "growth_potential (string), "
                    "skills_to_develop (array of strings), "
                    "negotiation_tips (array of strings), "
                    "next_role_suggestions (array of strings)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Position: {position}\nDepartment: {department}\n"
                    f"Current Annual Salary: ${current_salary:,.0f}\n"
                    f"Years of Experience: {years_experience}"
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.4, max_tokens=500, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}

    @staticmethod
    async def forecast_annual_earnings(payslips: List[Any], current_salary: float) -> Dict[str, Any]:
        """Forecast annual earnings and identify optimization opportunities"""
        if not settings.AI_API_KEY or not payslips:
            return {}

        avg_net = sum(p.net_salary for p in payslips) / len(payslips)
        projected_annual = avg_net * 12

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a financial planning assistant. Based on payroll data, provide "
                    "annual earnings forecast and optimization tips. Return JSON with keys: "
                    "projected_annual_net (number), "
                    "projected_annual_gross (number), "
                    "savings_goal_suggestion (number), "
                    "investment_tip (string), "
                    "forecast_summary (string)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Average monthly net: ${avg_net:.2f}, "
                    f"projected annual net: ${projected_annual:.2f}, "
                    f"gross annual salary: ${current_salary:.2f}."
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.4, max_tokens=400, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}


class PerformanceAIService:
    """AI features for performance analysis and career development"""

    @staticmethod
    async def generate_performance_summary(
        attendance_score: float,
        training_hours: int,
        completed_courses: int,
        department: str,
        position: str
    ) -> Dict[str, Any]:
        if not settings.AI_API_KEY:
            return {}

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a performance management specialist. Create a comprehensive, motivating "
                    "performance summary. Return JSON with keys: "
                    "overall_score (integer 0-100), "
                    "grade (string like 'A', 'B+'), "
                    "strengths (array of strings), "
                    "areas_for_improvement (array of strings), "
                    "career_path_suggestions (array of strings), "
                    "next_steps (array of strings), "
                    "promotion_readiness (string — not_ready|developing|ready|overdue), "
                    "recognition_message (string — motivational 1 sentence)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Performance Metrics:\n"
                    f"Attendance Score: {attendance_score:.0f}/100\n"
                    f"Training Hours Completed: {training_hours}h\n"
                    f"Courses Completed: {completed_courses}\n"
                    f"Department: {department}\n"
                    f"Position: {position}"
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.5, max_tokens=800, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}

    @staticmethod
    async def recommend_training_courses(
        position: str,
        department: str,
        completed_courses: List[str],
        career_goals: Optional[str] = None
    ) -> Dict[str, Any]:
        if not settings.AI_API_KEY:
            return {}

        completed = ", ".join(completed_courses) if completed_courses else "None"
        goals = career_goals or "General professional development and career advancement"

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a career development advisor. Recommend personalized training courses "
                    "avoiding duplicates. Return JSON with keys: "
                    "recommended_courses (array of objects with: title, category, duration_hours, priority (high|medium|low), "
                    "relevance_reason, skill_gap_addressed)), "
                    "learning_path_summary (string), "
                    "estimated_completion_weeks (number)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Position: {position}\nDepartment: {department}\n"
                    f"Completed: {completed}\nCareer Goals: {goals}"
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.6, max_tokens=700, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}

    @staticmethod
    async def generate_goal_suggestions(
        position: str,
        department: str,
        performance_score: float,
        completed_courses: List[str]
    ) -> Dict[str, Any]:
        """Generate smart quarterly goals based on current performance"""
        if not settings.AI_API_KEY:
            return {}

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a performance coach. Generate SMART quarterly goals. "
                    "Return JSON with keys: "
                    "quarterly_goals (array of objects with: goal, category (skill|performance|leadership|wellbeing), "
                    "measurable_outcome, timeline)), "
                    "focus_area (string), coaching_tip (string)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Role: {position} in {department}. "
                    f"Current performance score: {performance_score:.0f}/100. "
                    f"Completed training: {', '.join(completed_courses) if completed_courses else 'None'}."
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.6, max_tokens=600, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}


class SmartNotificationService:
    """AI-powered smart notifications and briefings"""

    @staticmethod
    async def generate_daily_briefing(
        user_name: str,
        attendance_status: str,
        pending_leaves: int,
        upcoming_holidays: List[str],
        training_in_progress: int
    ) -> Dict[str, Any]:
        if not settings.AI_API_KEY:
            return {}

        hour = datetime.now().hour
        time_of_day = "morning" if hour < 12 else ("afternoon" if hour < 17 else "evening")

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a friendly, concise personal work assistant. Create a personalized daily briefing. "
                    "Return JSON with keys: "
                    "greeting (string), "
                    "priorities (array of strings — 3 max), "
                    "reminders (array of strings — 2 max), "
                    "motivational_tip (string — 1 sentence), "
                    "focus_suggestion (string)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Employee: {user_name}\nTime of day: {time_of_day}\n"
                    f"Attendance: {attendance_status}\nPending leave requests: {pending_leaves}\n"
                    f"Upcoming holidays: {', '.join(upcoming_holidays[:3]) or 'None'}\n"
                    f"Training in progress: {training_in_progress} course(s)"
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.7, max_tokens=400, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}

    @staticmethod
    async def analyze_workload_stress(
        avg_hours: float,
        overtime_days: int,
        leave_days_taken: int,
        total_working_days: int
    ) -> Dict[str, Any]:
        """Detect potential burnout or stress indicators"""
        if not settings.AI_API_KEY:
            return {}

        utilization = (leave_days_taken / max(total_working_days, 1)) * 100

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a workplace wellness advisor. Analyze workload data for stress/burnout risk. "
                    "Return JSON with keys: "
                    "stress_level (low|moderate|high|critical), "
                    "burnout_risk_score (integer 0-100), "
                    "wellness_message (string), "
                    "recommended_actions (array of strings), "
                    "leave_recommendation (string)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Average daily hours: {avg_hours:.1f}h\n"
                    f"Overtime days (>9h) last month: {overtime_days}\n"
                    f"Leave days taken this year: {leave_days_taken}\n"
                    f"Leave utilization: {utilization:.0f}%"
                )
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.4, max_tokens=400, json_mode=True)
            return json.loads(response)
        except Exception:
            return {}


class AssistantAIService:
    """Context-aware HR assistant with memory of conversation"""

    @staticmethod
    async def ask_with_context(
        question: str,
        conversation_history: List[Dict[str, str]],
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Answer HR questions with user context and conversation history"""
        if not settings.AI_API_KEY:
            raise Exception("AI not configured")

        context_str = ""
        if user_context:
            context_str = (
                f"\n\nEmployee context (use to personalize answers — do not expose sensitive details):\n"
                f"- Department: {user_context.get('department', 'N/A')}\n"
                f"- Position: {user_context.get('position', 'N/A')}\n"
                f"- Role: {user_context.get('role', 'employee')}\n"
            )

        system_prompt = (
            "You are an intelligent employee self-service HR assistant. "
            "Give concise, practical, empathetic guidance. "
            "You have access to context about the employee's role and department to personalize responses. "
            "Do not claim to know this specific employer's policies; "
            "encourage checking the official handbook or contacting HR for binding answers. "
            "Do not make employment, legal, medical, payroll, or benefits decisions. "
            "Never ask for passwords, bank details, or other sensitive personal information. "
            "Format answers with clear structure when helpful (use bullet points, numbered steps). "
            + context_str
        )

        messages = [{"role": "system", "content": system_prompt}]

        # Include last 6 turns of conversation history for context
        for msg in conversation_history[-6:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": question})

        return await AIService.make_request_async(messages, temperature=0.4, max_tokens=800)

    @staticmethod
    async def suggest_questions(department: str, position: str) -> List[str]:
        """Generate smart question suggestions based on user's role"""
        if not settings.AI_API_KEY:
            return []

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an HR assistant. Generate relevant question suggestions for an employee. "
                    "Return JSON with key: suggestions (array of exactly 5 short question strings)."
                )
            },
            {
                "role": "user",
                "content": f"Generate helpful HR question suggestions for a {position} in the {department} department."
            }
        ]

        try:
            response = await AIService.make_request_async(messages, temperature=0.7, max_tokens=300, json_mode=True)
            data = json.loads(response)
            return data.get("suggestions", [])
        except Exception:
            return []
