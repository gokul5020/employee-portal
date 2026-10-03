from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select
from datetime import date, datetime, timedelta
from .config import settings
from .database import async_engine, AsyncSessionLocal, Base
from .models import User, Attendance, LeaveRequest, Payslip, TrainingCourse
from .auth import get_password_hash
from .routes import auth, profile, attendance, leave, payroll

app = FastAPI(title=settings.PROJECT_NAME)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(attendance.router)
app.include_router(leave.router)
app.include_router(payroll.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Employee Self-Service Portal Python API"}

# Database initialization and seeding on startup
@app.on_event("startup")
async def startup_event():
    # 1. Create tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # 2. Seed data if empty
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        if not result.scalars().first():
            print("🌱 Database is empty. Seeding initial data...")
            
            # Create Users
            admin_user = User(
                email="admin@company.com",
                password=get_password_hash("admin123"),
                full_name="Sarah Jenkins",
                role="ROLE_ADMIN",
                department="Management",
                position="Chief HR Officer",
                salary=150000.0,
                bank_name="Global Capital Bank",
                bank_account_number="GB-8849-0029-994",
                manager_id=None
            )
            session.add(admin_user)
            await session.flush()  # To populate ID
            
            manager_user = User(
                email="manager@company.com",
                password=get_password_hash("manager123"),
                full_name="Marcus Aurelius",
                role="ROLE_MANAGER",
                department="IT",
                position="Development Manager",
                salary=110000.0,
                bank_name="Global Capital Bank",
                bank_account_number="GB-8849-0029-112",
                manager_id=admin_user.id
            )
            session.add(manager_user)
            await session.flush()
            
            emp1 = User(
                email="employee1@company.com",
                password=get_password_hash("employee123"),
                full_name="Elena Rostova",
                role="ROLE_EMPLOYEE",
                department="IT",
                position="Senior Developer",
                salary=85000.0,
                bank_name="Global Capital Bank",
                bank_account_number="GB-8849-0029-234",
                manager_id=manager_user.id
            )
            session.add(emp1)
            
            emp2 = User(
                email="employee2@company.com",
                password=get_password_hash("employee123"),
                full_name="Alex Mercer",
                role="ROLE_EMPLOYEE",
                department="IT",
                position="Junior QA Engineer",
                salary=50000.0,
                bank_name="Global Capital Bank",
                bank_account_number="GB-8849-0029-556",
                manager_id=manager_user.id
            )
            session.add(emp2)
            await session.flush()
            
            # Seed Attendance for Elena
            today = date.today()
            for i in range(1, 10):
                d = today - timedelta(days=i)
                # Skip weekends
                if d.weekday() >= 5:
                    continue
                    
                check_in = datetime.combine(d, datetime.min.time()) + timedelta(hours=9, minutes=0)
                check_out = check_in + timedelta(hours=8, minutes=30)
                
                att = Attendance(
                    user_id=emp1.id,
                    date=d,
                    check_in_time=check_in,
                    check_out_time=check_out,
                    hours_worked=8.5,
                    status="PRESENT"
                )
                session.add(att)
                
            # Seed Leaves for Elena
            leave1 = LeaveRequest(
                user_id=emp1.id,
                leave_type="VACATION",
                start_date=today + timedelta(days=10),
                end_date=today + timedelta(days=15),
                reason="Annual family vacation",
                status="PENDING"
            )
            leave2 = LeaveRequest(
                user_id=emp1.id,
                leave_type="SICK",
                start_date=today - timedelta(days=20),
                end_date=today - timedelta(days=19),
                reason="Flu recovery",
                status="APPROVED",
                reviewed_by=manager_user.id,
                manager_comments="Approved, get well soon."
            )
            session.add(leave1)
            session.add(leave2)
            
            # Seed Training Courses for Elena (SDG 4)
            course1 = TrainingCourse(
                user_id=emp1.id,
                title="Secure Code & Quality Standards",
                description="Secure coding patterns and industrial validation",
                category="SDG 9: Robust Infrastructure",
                hours=8,
                status="COMPLETED",
                completion_date=today - timedelta(days=15)
            )
            course2 = TrainingCourse(
                user_id=emp1.id,
                title="Inclusive Workplace & Reduced Inequalities",
                description="Promoting accessibility, equality, and inclusion at work",
                category="SDG 10: Reduced Inequality",
                hours=4,
                status="COMPLETED",
                completion_date=today - timedelta(days=5)
            )
            course3 = TrainingCourse(
                user_id=emp1.id,
                title="Cloud Architecture & Serverless APIs",
                description="Designing serverless pipelines on cloud nodes",
                category="SDG 9: Industry & Innovation",
                hours=12,
                status="IN_PROGRESS"
            )
            session.add(course1)
            session.add(course2)
            session.add(course3)
            
            # Seed Payslips for Elena
            payslip1 = Payslip(
                user_id=emp1.id,
                month=6,
                year=2026,
                basic_salary=7000.0,
                allowances=1000.0,
                deductions=500.0,
                net_salary=7500.0
            )
            payslip2 = Payslip(
                user_id=emp1.id,
                month=7,
                year=2026,
                basic_salary=7000.0,
                allowances=1000.0,
                deductions=500.0,
                net_salary=7500.0
            )
            session.add(payslip1)
            session.add(payslip2)
            
            await session.commit()
            print("🌱 Seeding finished successfully!")
