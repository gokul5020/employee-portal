from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # ROLE_EMPLOYEE, ROLE_MANAGER, ROLE_ADMIN
    department = Column(String(255), nullable=True)
    position = Column(String(255), nullable=True)
    salary = Column(Float, nullable=True)
    bank_name = Column(String(255), nullable=True)
    bank_account_number = Column(String(255), nullable=True)
    manager_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    manager = relationship('User', remote_side=[id], backref='subordinates')
    attendances = relationship('Attendance', back_populates='user', cascade='all, delete-orphan')
    leave_requests = relationship('LeaveRequest', foreign_keys='LeaveRequest.user_id', back_populates='user', cascade='all, delete-orphan')
    payslips = relationship('Payslip', back_populates='user', cascade='all, delete-orphan')
    training_courses = relationship('TrainingCourse', back_populates='user', cascade='all, delete-orphan')

class Attendance(Base):
    __tablename__ = 'attendance'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    date = Column(Date, nullable=False)
    check_in_time = Column(DateTime, nullable=False)
    check_out_time = Column(DateTime, nullable=True)
    hours_worked = Column(Float, nullable=True)
    status = Column(String(50), nullable=False)  # PRESENT, ABSENT, ON_LEAVE
    
    user = relationship('User', back_populates='attendances')

class LeaveRequest(Base):
    __tablename__ = 'leave_requests'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    leave_type = Column(String(100), nullable=False)  # VACATION, SICK, CASUAL
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(String(255), nullable=False)
    status = Column(String(50), default='PENDING', nullable=False)  # PENDING, APPROVED, REJECTED
    reviewed_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    manager_comments = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship('User', foreign_keys=[user_id], back_populates='leave_requests')
    reviewer = relationship('User', foreign_keys=[reviewed_by])

class Payslip(Base):
    __tablename__ = 'payslips'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    basic_salary = Column(Float, nullable=False)
    allowances = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    net_salary = Column(Float, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship('User', back_populates='payslips')

class TrainingCourse(Base):
    __tablename__ = 'training_courses'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    category = Column(String(100), nullable=False)  # SDG 4 related category
    hours = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default='NOT_STARTED', nullable=False)  # NOT_STARTED, IN_PROGRESS, COMPLETED
    completion_date = Column(Date, nullable=True)
    
    user = relationship('User', back_populates='training_courses')
