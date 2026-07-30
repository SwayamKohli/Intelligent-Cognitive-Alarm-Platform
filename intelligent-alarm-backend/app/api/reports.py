import io
from datetime import datetime, timezone, timedelta, time
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

from app.database import get_db, challenge_logs_collection
from app.models.user import User
from app.models.habit import Habit
from app.api.auth import get_current_user
from app.services.telemetry_service import get_user_telemetry_last_7_days
from app.core.analytics.scoring import calculate_habit_score
from app.core.analytics.groq_recommendations import generate_ai_recommendations

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])


def _calculate_sleep_duration(bedtime: Optional[time], wake_time: Optional[time]) -> str:
    """Calculates sleep duration in hours and minutes handling overnight wrap-around."""
    if not bedtime or not wake_time:
        return "Not configured"

    t_bed = datetime.combine(datetime.today(), bedtime)
    t_wake = datetime.combine(datetime.today(), wake_time)

    if t_wake <= t_bed:
        t_wake += timedelta(days=1)

    diff = t_wake - t_bed
    total_minutes = int(diff.total_seconds() // 60)
    hours = total_minutes // 60
    minutes = total_minutes % 60

    if minutes == 0:
        return f"{hours} hours"
    return f"{hours} hrs {minutes} mins"


@router.get("/export/pdf")
async def export_pdf_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a formatted PDF sleep & habit summary report for the authenticated user.
    """
    # 1. Fetch 7-day telemetry and calculate scores
    telemetry = await get_user_telemetry_last_7_days(str(current_user.id))

    days_active = telemetry.get("days_active", 0)
    consistency = round((days_active / 7.0) * 100.0, 2)
    failure_rate = telemetry.get("failure_rate_percent", 0.0)
    challenge_rate = round(max(0.0, 100.0 - failure_rate), 2)
    total_snoozes = telemetry.get("total_snoozes", 0)
    snooze_reduction = round(max(0.0, 100.0 - (total_snoozes * 10.0)), 2)
    sleep_adherence = 100.0 if (current_user.target_bedtime and current_user.target_wake_time) else 80.0

    habit_score = calculate_habit_score(
        consistency=consistency,
        challenge_rate=challenge_rate,
        snooze_reduction=snooze_reduction,
        sleep_adherence=sleep_adherence
    )

    # 2. Fetch AI Recommendations
    recommendations = await generate_ai_recommendations(
        user_name=current_user.full_name or "User",
        telemetry_data=telemetry,
        habit_score=habit_score
    )

    sleep_duration_str = _calculate_sleep_duration(current_user.target_bedtime, current_user.target_wake_time)
    bedtime_str = current_user.target_bedtime.strftime("%H:%M") if current_user.target_bedtime else "Not set"
    wake_time_str = current_user.target_wake_time.strftime("%H:%M") if current_user.target_wake_time else "Not set"

    # 3. Build PDF with ReportLab
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom ReportLab Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1E293B"),
        fontName="Helvetica-Bold",
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748B"),
        fontName="Helvetica",
        spaceAfter=15
    )
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#0F172A"),
        fontName="Helvetica-Bold",
        spaceBefore=12,
        spaceAfter=6
    )
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#334155")
    )
    cell_normal = ParagraphStyle(
        'CellNormal',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName="Helvetica",
        textColor=colors.HexColor("#1E293B")
    )
    rec_title = ParagraphStyle(
        'RecTitle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#2563EB")
    )

    story = []

    # Title Banner
    story.append(Paragraph("Intelligent Cognitive Alarm — Sleep & Habit Summary Report", title_style))
    generated_at_str = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    story.append(Paragraph(f"Generated for: <b>{current_user.full_name}</b> ({current_user.email}) | Date: {generated_at_str}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563EB"), spaceAfter=15))

    # Section 1: User Profile & Sleep Schedule
    story.append(Paragraph("1. User Information & Sleep Schedule", section_title))
    user_info_data = [
        [Paragraph("Full Name", cell_bold), Paragraph(current_user.full_name or "N/A", cell_normal),
         Paragraph("Target Bedtime", cell_bold), Paragraph(bedtime_str, cell_normal)],
        [Paragraph("Email", cell_bold), Paragraph(current_user.email, cell_normal),
         Paragraph("Target Wake Time", cell_bold), Paragraph(wake_time_str, cell_normal)],
        [Paragraph("Timezone", cell_bold), Paragraph(current_user.timezone or "UTC", cell_normal),
         Paragraph("Expected Sleep Duration", cell_bold), Paragraph(sleep_duration_str, cell_normal)],
        [Paragraph("Current Streak", cell_bold), Paragraph(f"{current_user.current_streak} days", cell_normal),
         Paragraph("Productivity Goal", cell_bold), Paragraph(current_user.productivity_goal or "Not specified", cell_normal)],
    ]
    user_info_table = Table(user_info_data, colWidths=[110, 160, 130, 140])
    user_info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#1E293B")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(user_info_table)
    story.append(Spacer(1, 12))

    # Section 2: Habit Score & Performance Breakdown
    story.append(Paragraph("2. Habit Score & Metric Breakdown", section_title))
    habit_score_data = [
        [Paragraph("Metric", cell_bold), Paragraph("Value", cell_bold), Paragraph("Description", cell_bold)],
        [Paragraph("Overall Habit Score", cell_bold), Paragraph(f"<b>{habit_score} / 100</b>", cell_normal), Paragraph("Weighted score across adherence, consistency, and challenge success.", cell_normal)],
        [Paragraph("Consistency Score", cell_normal), Paragraph(f"{consistency}%", cell_normal), Paragraph(f"{days_active} of 7 active days logged.", cell_normal)],
        [Paragraph("Challenge Success Rate", cell_normal), Paragraph(f"{challenge_rate}%", cell_normal), Paragraph(f"Failure rate: {failure_rate}%.", cell_normal)],
        [Paragraph("Snooze Reduction Rate", cell_normal), Paragraph(f"{snooze_reduction}%", cell_normal), Paragraph(f"Total snoozes this week: {total_snoozes}.", cell_normal)],
        [Paragraph("Sleep Schedule Adherence", cell_normal), Paragraph(f"{sleep_adherence}%", cell_normal), Paragraph("Schedule configuration adherence status.", cell_normal)],
    ]
    habit_score_table = Table(habit_score_data, colWidths=[150, 110, 280])
    habit_score_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#EFF6FF")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    story.append(habit_score_table)
    story.append(Spacer(1, 12))

    # Section 3: 7-Day Sleep Statistics
    story.append(Paragraph("3. 7-Day Sleep & Telemetry Statistics", section_title))
    telemetry_data_table = [
        [Paragraph("Stat Indicator", cell_bold), Paragraph("Value", cell_bold)],
        [Paragraph("Active Days (Last 7 Days)", cell_normal), Paragraph(f"{days_active} days", cell_normal)],
        [Paragraph("Total Snoozes Triggered", cell_normal), Paragraph(f"{total_snoozes} times", cell_normal)],
        [Paragraph("Total Cognitive Challenges Attempted", cell_normal), Paragraph(f"{telemetry.get('total_challenges', 0)} attempts", cell_normal)],
        [Paragraph("Total Challenge Failures", cell_normal), Paragraph(f"{telemetry.get('total_failures', 0)} failures", cell_normal)],
        [Paragraph("Challenge Failure Percentage", cell_normal), Paragraph(f"{failure_rate}%", cell_normal)],
    ]
    telemetry_table = Table(telemetry_data_table, colWidths=[260, 280])
    telemetry_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(telemetry_table)
    story.append(Spacer(1, 12))

    # Section 4: AI Recommendations Summary
    story.append(Paragraph("4. Personalized Recommendation Summary", section_title))
    rec_table_data = [
        [Paragraph("Category", cell_bold), Paragraph("Actionable Recommendation", cell_bold)],
        [Paragraph("Sleep Optimization", rec_title), Paragraph(recommendations.get("sleep", "N/A"), cell_normal)],
        [Paragraph("Wake-Up Routine", rec_title), Paragraph(recommendations.get("wake_up", "N/A"), cell_normal)],
        [Paragraph("Habit Building", rec_title), Paragraph(recommendations.get("habit", "N/A"), cell_normal)],
        [Paragraph("Productivity Boost", rec_title), Paragraph(recommendations.get("productivity", "N/A"), cell_normal)],
    ]
    rec_table = Table(rec_table_data, colWidths=[140, 400])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    story.append(rec_table)

    # Build PDF
    doc.build(story)
    pdf_buffer.seek(0)

    filename = f"sleep_summary_report_{current_user.id}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/excel")
async def export_excel_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exports last 7 days MongoDB telemetry, habit progression, sleep duration,
    and user habit score into an Excel workbook (.xlsx).
    """
    user_id_str = str(current_user.id)
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # 1. Fetch Telemetry Summary
    telemetry = await get_user_telemetry_last_7_days(user_id_str)

    days_active = telemetry.get("days_active", 0)
    consistency = round((days_active / 7.0) * 100.0, 2)
    failure_rate = telemetry.get("failure_rate_percent", 0.0)
    challenge_rate = round(max(0.0, 100.0 - failure_rate), 2)
    total_snoozes = telemetry.get("total_snoozes", 0)
    snooze_reduction = round(max(0.0, 100.0 - (total_snoozes * 10.0)), 2)
    sleep_adherence = 100.0 if (current_user.target_bedtime and current_user.target_wake_time) else 80.0

    habit_score = calculate_habit_score(
        consistency=consistency,
        challenge_rate=challenge_rate,
        snooze_reduction=snooze_reduction,
        sleep_adherence=sleep_adherence
    )

    sleep_duration_str = _calculate_sleep_duration(current_user.target_bedtime, current_user.target_wake_time)
    bedtime_str = current_user.target_bedtime.strftime("%H:%M") if current_user.target_bedtime else "Not set"
    wake_time_str = current_user.target_wake_time.strftime("%H:%M") if current_user.target_wake_time else "Not set"

    # Sheet 1: Sleep & Habit Summary Data
    summary_data = [
        {"Attribute": "User ID", "Value": user_id_str},
        {"Attribute": "Full Name", "Value": current_user.full_name or "N/A"},
        {"Attribute": "Email", "Value": current_user.email},
        {"Attribute": "Timezone", "Value": current_user.timezone or "UTC"},
        {"Attribute": "Productivity Goal", "Value": current_user.productivity_goal or "N/A"},
        {"Attribute": "Current Streak (Days)", "Value": current_user.current_streak},
        {"Attribute": "Target Bedtime", "Value": bedtime_str},
        {"Attribute": "Target Wake Time", "Value": wake_time_str},
        {"Attribute": "Calculated Sleep Duration", "Value": sleep_duration_str},
        {"Attribute": "Overall Habit Score", "Value": habit_score},
        {"Attribute": "7-Day Active Days", "Value": days_active},
        {"Attribute": "7-Day Total Snoozes", "Value": total_snoozes},
        {"Attribute": "7-Day Challenge Failure Rate (%)", "Value": failure_rate},
        {"Attribute": "Report Generated At", "Value": now.isoformat()},
    ]
    df_summary = pd.DataFrame(summary_data)

    # Sheet 2: MongoDB Raw Telemetry Logs (Last 7 Days)
    raw_logs = []
    try:
        query = {
            "user_id": user_id_str,
            "$or": [
                {"timestamp": {"$gte": seven_days_ago}},
                {"created_at": {"$gte": seven_days_ago}},
                {"created_at": {"$gte": seven_days_ago.isoformat()}}
            ]
        }
        cursor = challenge_logs_collection.find(query)
        docs = await cursor.to_list(length=500)
        for doc in docs:
            raw_logs.append({
                "Log ID": str(doc.get("_id", "")),
                "Timestamp": doc.get("timestamp") or doc.get("created_at"),
                "Event Type": doc.get("event_type", "challenge_attempt"),
                "Challenge Type": doc.get("challenge_type", "N/A"),
                "Difficulty": doc.get("difficulty_level", "N/A"),
                "Time Taken (s)": doc.get("time_to_solve_seconds", doc.get("time_taken_ms", 0) / 1000.0 if doc.get("time_taken_ms") else 0),
                "Failed Attempts": doc.get("failed_attempts", 0),
                "Timeout Failed": doc.get("timeout_failed", False),
                "Outcome": doc.get("outcome", "N/A")
            })
    except Exception as e:
        print(f"[WARNING] MongoDB raw telemetry retrieval error for Excel export: {e}")

    if not raw_logs:
        df_telemetry = pd.DataFrame([{
            "Summary Metric": "7-Day Aggregated Snoozes", "Value": total_snoozes
        }, {
            "Summary Metric": "7-Day Aggregated Challenges", "Value": telemetry.get("total_challenges", 0)
        }, {
            "Summary Metric": "7-Day Failure Rate (%)", "Value": failure_rate
        }])
    else:
        df_telemetry = pd.DataFrame(raw_logs)

    # Sheet 3: Habit Progression & Logs from PostgreSQL
    user_habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    habit_list_data = []
    habit_log_data = []

    for habit in user_habits:
        habit_list_data.append({
            "Habit ID": str(habit.id),
            "Habit Name": habit.name,
            "Frequency": habit.frequency.value if hasattr(habit.frequency, "value") else str(habit.frequency),
            "Current Streak": habit.current_streak,
            "Longest Streak": habit.longest_streak,
            "Target Streak Days": habit.target_streak_days or "N/A",
            "Habit Score": habit.habit_score,
            "Created At": habit.created_at.isoformat() if habit.created_at else "N/A"
        })

        for h_log in habit.logs:
            habit_log_data.append({
                "Habit Name": habit.name,
                "Log Date": h_log.log_date.isoformat() if h_log.log_date else "N/A",
                "Completed": h_log.completed,
                "Snooze Count": h_log.snooze_count,
                "Logged At": h_log.created_at.isoformat() if h_log.created_at else "N/A"
            })

    df_habits = pd.DataFrame(habit_list_data) if habit_list_data else pd.DataFrame([{"Message": "No active habits configured."}])
    df_habit_logs = pd.DataFrame(habit_log_data) if habit_log_data else pd.DataFrame([{"Message": "No habit logs recorded."}])

    # 2. Write to Excel stream using pandas and openpyxl
    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        df_summary.to_excel(writer, sheet_name='Sleep & Habit Summary', index=False)
        df_telemetry.to_excel(writer, sheet_name='7-Day Telemetry Logs', index=False)
        df_habits.to_excel(writer, sheet_name='Habits Overview', index=False)
        df_habit_logs.to_excel(writer, sheet_name='Habit Progression Logs', index=False)

    excel_buffer.seek(0)
    filename = f"sleep_habit_report_{current_user.id}.xlsx"

    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
