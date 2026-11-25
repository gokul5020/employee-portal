from datetime import date, datetime
from io import BytesIO
from types import SimpleNamespace

from openpyxl import load_workbook

from app.reports import generate_attendance_report, generate_leave_report


def test_leave_report_handles_merged_title_cells():
    leave = SimpleNamespace(
        user=SimpleNamespace(full_name="Employee One"),
        leave_type="ANNUAL",
        start_date=date(2026, 12, 1),
        end_date=date(2026, 12, 2),
        status="APPROVED",
        reason="Family trip",
    )

    workbook = load_workbook(BytesIO(generate_leave_report([leave])))
    worksheet = workbook.active

    assert worksheet["A2"].value == "Employee Name"
    assert worksheet["A3"].value == "Employee One"
    assert worksheet["F3"].value == "Family trip"


def test_attendance_report_handles_merged_title_cells():
    attendance = SimpleNamespace(
        user=SimpleNamespace(full_name="Employee One"),
        date=date(2026, 11, 25),
        check_in_time=datetime(2026, 11, 25, 3, 0),
        check_out_time=datetime(2026, 11, 25, 11, 30),
        hours_worked=8.5,
        status="PRESENT",
    )

    workbook = load_workbook(BytesIO(generate_attendance_report([attendance])))
    worksheet = workbook.active

    assert worksheet["A2"].value == "Employee Name"
    assert worksheet["A3"].value == "Employee One"
    assert worksheet["E3"].value == "8.50"
