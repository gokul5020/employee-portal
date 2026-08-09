import io
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from .models import LeaveRequest, Attendance, Payslip, User

# Helper to apply styling to Excel Worksheets
def style_excel_ws(ws, title: str, headers: list):
    # Sheet Title
    ws.merge_cells('A1:F1')
    ws['A1'] = title
    ws['A1'].font = Font(name='Segoe UI', size=16, bold=True, color='FFFFFF')
    ws['A1'].alignment = Alignment(horizontal='center', vertical='center')
    ws['A1'].fill = PatternFill(start_color='1E1B4B', end_color='1E1B4B', fill_type='solid') # brand-950
    ws.row_dimensions[1].height = 40
    
    # Headers
    ws.row_dimensions[2].height = 25
    header_font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
    header_fill = PatternFill(start_color='4338CA', end_color='4338CA', fill_type='solid') # brand-700
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )
    
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col_idx)
        cell.value = header
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = thin_border
        
    # Auto-adjust column width
    for col in ws.columns:
        max_len = 0
        for cell in col:
            val_str = str(cell.value or '')
            if len(val_str) > max_len:
                max_len = len(val_str)
        col_letter = col[0].column_letter
        ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

def generate_leave_report(leaves: list) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Leaves Summary"
    
    headers = ["Employee Name", "Leave Type", "Start Date", "End Date", "Status", "Reason"]
    style_excel_ws(ws, "EMPLOYEE LEAVES SUMMARY REPORT", headers)
    
    data_font = Font(name='Segoe UI', size=10)
    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )
    
    for row_idx, leave in enumerate(leaves, 3):
        ws.row_dimensions[row_idx].height = 20
        row_data = [
            leave.user.full_name,
            leave.leave_type,
            leave.start_date.strftime('%Y-%m-%d'),
            leave.end_date.strftime('%Y-%m-%d'),
            leave.status,
            leave.reason
        ]
        for col_idx, val in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = data_font
            cell.border = thin_border
            # Center alignment for dates and status
            if col_idx in [2, 3, 4, 5]:
                cell.alignment = Alignment(horizontal='center')
            else:
                cell.alignment = Alignment(horizontal='left')
                
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.getvalue()

def generate_attendance_report(logs: list) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Clocking Logs"
    
    headers = ["Employee Name", "Date", "Clock In Time", "Clock Out Time", "Hours Worked", "Status"]
    style_excel_ws(ws, "EMPLOYEE CLOCKING HISTORY REPORT", headers)
    
    data_font = Font(name='Segoe UI', size=10)
    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )
    
    for row_idx, log in enumerate(logs, 3):
        ws.row_dimensions[row_idx].height = 20
        check_out_str = log.check_out_time.strftime('%H:%M:%S') if log.check_out_time else "N/A"
        hours_str = f"{log.hours_worked:.2f}" if log.hours_worked is not None else "0.00"
        
        row_data = [
            log.user.full_name,
            log.date.strftime('%Y-%m-%d'),
            log.check_in_time.strftime('%H:%M:%S'),
            check_out_str,
            hours_str,
            log.status
        ]
        for col_idx, val in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = data_font
            cell.border = thin_border
            # Alignment rules
            if col_idx in [2, 3, 4, 5, 6]:
                cell.alignment = Alignment(horizontal='center')
            else:
                cell.alignment = Alignment(horizontal='left')
                
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.getvalue()

def generate_payslip_pdf(payslip: Payslip, user: User) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#1E1B4B'), # brand-950
        spaceAfter=15,
        alignment=1 # Center
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#4F46E5'), # brand-600
        spaceAfter=25,
        alignment=1
    )
    
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=10
    )
    
    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#334155'),
        leading=14
    )
    
    bold_style = ParagraphStyle(
        'BoldStyle',
        parent=normal_style,
        fontName='Helvetica-Bold'
    )
    
    elements = []
    
    # Title & Header
    elements.append(Paragraph("EMPLOYEE SELF-SERVICE PORTAL", title_style))
    elements.append(Paragraph(f"OFFICIAL SALARY PAYSLIP - MONTH: {payslip.month:02d}/{payslip.year}", subtitle_style))
    
    # Metadata grid (Employee info / Bank info)
    meta_data = [
        [
            Paragraph("<b>Employee Name:</b>", normal_style), Paragraph(user.full_name, normal_style),
            Paragraph("<b>Payslip ID:</b>", normal_style), Paragraph(f"PAY-{payslip.id:06d}", normal_style)
        ],
        [
            Paragraph("<b>Department:</b>", normal_style), Paragraph(user.department or "N/A", normal_style),
            Paragraph("<b>Date Generated:</b>", normal_style), Paragraph(payslip.generated_at.strftime('%Y-%m-%d %H:%M'), normal_style)
        ],
        [
            Paragraph("<b>Position:</b>", normal_style), Paragraph(user.position or "N/A", normal_style),
            Paragraph("<b>Bank Name:</b>", normal_style), Paragraph(user.bank_name or "N/A", normal_style)
        ],
        [
            Paragraph("<b>Email:</b>", normal_style), Paragraph(user.email, normal_style),
            Paragraph("<b>Bank Account:</b>", normal_style), Paragraph(user.bank_account_number or "N/A", normal_style)
        ]
    ]
    
    meta_table = Table(meta_data, colWidths=[110, 160, 110, 160])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 10),
    ]))
    
    elements.append(meta_table)
    elements.append(Spacer(1, 20))
    
    # Financial breakdown Table
    elements.append(Paragraph("Salary Details & Breakdowns", section_title))
    
    financial_data = [
        [Paragraph("<b>Description</b>", bold_style), Paragraph("<b>Earnings (INR)</b>", bold_style), Paragraph("<b>Deductions (INR)</b>", bold_style)],
        [Paragraph("Basic Salary", normal_style), Paragraph(f"{payslip.basic_salary:,.2f}", normal_style), Paragraph("-", normal_style)],
        [Paragraph("Allowances", normal_style), Paragraph(f"{payslip.allowances:,.2f}", normal_style), Paragraph("-", normal_style)],
        [Paragraph("Deductions", normal_style), Paragraph("-", normal_style), Paragraph(f"{payslip.deductions:,.2f}", normal_style)],
        [Paragraph("<b>TOTALS</b>", bold_style), Paragraph(f"{(payslip.basic_salary + payslip.allowances):,.2f}", bold_style), Paragraph(f"{payslip.deductions:,.2f}", bold_style)],
        [Paragraph("<b>NET SALARY (Take-home Pay)</b>", bold_style), Paragraph(f"<b>{payslip.net_salary:,.2f}</b>", bold_style), Paragraph("", normal_style)]
    ]
    
    fin_table = Table(financial_data, colWidths=[240, 150, 150])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,4), 1, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,4), (-1,4), colors.HexColor('#F8FAFC')),
        ('LINEABOVE', (0,4), (-1,4), 1.5, colors.HexColor('#94A3B8')),
        ('BACKGROUND', (0,5), (-1,5), colors.HexColor('#EEF2FF')), # brand-50 / indigo-50
        ('LINEABOVE', (0,5), (-1,5), 2, colors.HexColor('#6366F1')), # brand-500
        ('SPAN', (1,5), (2,5)),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    
    elements.append(fin_table)
    elements.append(Spacer(1, 40))
    
    # Declarations / Signatures
    elements.append(Paragraph("Note: This is an automatically generated payslip and does not require a physical signature.", ParagraphStyle('Note', parent=normal_style, fontName='Helvetica-Oblique', fontSize=8, textColor=colors.HexColor('#64748B'))))
    
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
