from datetime import date, datetime, timezone

from app.schemas import AttendanceResponse


def test_naive_attendance_timestamps_are_serialized_as_utc():
    response = AttendanceResponse(
        id=1,
        user_id=1,
        date=date(2026, 11, 25),
        check_in_time=datetime(2026, 11, 25, 1, 16),
        check_out_time=datetime(2026, 11, 25, 9, 16),
        status="PRESENT",
    )

    data = response.model_dump(mode="json")

    assert data["check_in_time"].endswith("Z")
    assert data["checkInTime"].endswith("Z")
    assert data["checkOutTime"].endswith("Z")


def test_aware_attendance_timestamps_are_normalized_to_utc():
    response = AttendanceResponse(
        id=1,
        user_id=1,
        date=date(2026, 11, 25),
        check_in_time=datetime(2026, 11, 25, 6, 46, tzinfo=timezone.utc),
        status="PRESENT",
    )

    assert response.model_dump(mode="json")["checkInTime"].endswith("Z")
