from pydantic import BaseModel, EmailStr, computed_field, Field
from typing import Optional, List
from datetime import date, datetime

# Auth Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    department: Optional[str] = None
    position: Optional[str] = None
    salary: Optional[float] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    manager_id: Optional[int] = None
    created_at: datetime

    @computed_field
    @property
    def fullName(self) -> str:
        return self.full_name

    @computed_field
    @property
    def bankName(self) -> Optional[str]:
        return self.bank_name

    @computed_field
    @property
    def bankAccountNumber(self) -> Optional[str]:
        return self.bank_account_number

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    token_type: str = "Bearer"
    user: UserBase

# Profile Schemas
class ProfileUpdate(BaseModel):
    bank_name: str = Field(validation_alias="bankName")
    bank_account_number: str = Field(validation_alias="bankAccountNumber")

# Attendance Schemas
class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    date: date
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    hours_worked: Optional[float] = None
    status: str

    @computed_field
    @property
    def checkInTime(self) -> datetime:
        return self.check_in_time

    @computed_field
    @property
    def checkOutTime(self) -> Optional[datetime]:
        return self.check_out_time

    @computed_field
    @property
    def hoursWorked(self) -> Optional[float]:
        return self.hours_worked

    class Config:
        from_attributes = True

# Leave Schemas
class LeaveRequestCreate(BaseModel):
    leave_type: str = Field(validation_alias="leaveType")
    start_date: date = Field(validation_alias="startDate")
    end_date: date = Field(validation_alias="endDate")
    reason: str

class LeaveReviewRequest(BaseModel):
    status: str  # APPROVED, REJECTED
    comments: Optional[str] = None  # map frontend key 'comments'

    @property
    def manager_comments(self) -> Optional[str]:
        return self.comments

class LeaveRequestResponse(BaseModel):
    id: int
    user_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    status: str
    reviewed_by: Optional[int] = None
    manager_comments: Optional[str] = None
    created_at: datetime
    user: UserBase
    reviewer: Optional[UserBase] = None

    @computed_field
    @property
    def leaveType(self) -> str:
        return self.leave_type

    @computed_field
    @property
    def startDate(self) -> date:
        return self.start_date

    @computed_field
    @property
    def endDate(self) -> date:
        return self.end_date

    @computed_field
    @property
    def reviewedBy(self) -> Optional[UserBase]:
        return self.reviewer

    @computed_field
    @property
    def managerComments(self) -> Optional[str]:
        return self.manager_comments

    @computed_field
    @property
    def createdAt(self) -> datetime:
        return self.created_at

    class Config:
        from_attributes = True

# Payslip Schemas
class PayslipResponse(BaseModel):
    id: int
    user_id: int
    month: int
    year: int
    basic_salary: float
    allowances: float
    deductions: float
    net_salary: float
    generated_at: datetime

    @computed_field
    @property
    def basicSalary(self) -> float:
        return self.basic_salary

    @computed_field
    @property
    def netSalary(self) -> float:
        return self.net_salary

    @computed_field
    @property
    def generatedAt(self) -> datetime:
        return self.generated_at

    class Config:
        from_attributes = True
