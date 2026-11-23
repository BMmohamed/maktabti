# -*- coding: utf-8 -*-
"""
MaktabatiPrint - وكيل الطباعة المباشر والآلي لنظام ويندوز
مخصص لمكتبات منصة "مكتبتي" للربط المباشر مع طابعات المحل والطباعة الصامتة
"""

import sys
import os
import json
import time
import subprocess
import tempfile
import threading
import winreg
from pathlib import Path
from typing import Optional, List, Dict, Any

import requests
from PIL import Image

import win32print

from PySide6.QtCore import Qt, QThread, Signal, Slot, QTimer
from PySide6.QtGui import QIcon, QFont, QColor, QAction
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QComboBox, QCheckBox, QGroupBox,
    QTableWidget, QTableWidgetItem, QHeaderView, QMessageBox, QSystemTrayIcon,
    QMenu, QProgressBar, QFrame, QScrollArea
)

# ---------------------------------------------------------------------------
# Helpers & Paths
# ---------------------------------------------------------------------------

APP_NAME = "MaktabatiPrint"
APP_TITLE = "مكتبتي للطباعة الذكية - MaktabatiPrint"
DEFAULT_API_URL = "http://localhost:3000"

def get_app_dir() -> Path:
    """Get the app configuration directory in %APPDATA%/MaktabatiPrint."""
    app_data = os.environ.get("APPDATA", os.path.expanduser("~"))
    path = Path(app_data) / APP_NAME
    path.mkdir(parents=True, exist_ok=True)
    return path

def get_config_path() -> Path:
    return get_app_dir() / "config.json"

def get_sumatra_path() -> str:
    """Find the bundled or local SumatraPDF.exe executable."""
    # 1. Bundled in PyInstaller onefile temp dir
    if getattr(sys, 'frozen', False):
        base_dir = getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
        candidate = os.path.join(base_dir, 'SumatraPDF.exe')
        if os.path.isfile(candidate):
            return candidate

    # 2. In print_agent/bin/SumatraPDF.exe
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, 'bin', 'SumatraPDF.exe'),
        os.path.join(here, 'SumatraPDF.exe'),
        os.path.join(here, 'bin', 'SumatraPDF-3.6.1-64.exe'),
        r"C:\Program Files\SumatraPDF\SumatraPDF.exe",
        r"C:\Program Files (x86)\SumatraPDF\SumatraPDF.exe",
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c

    return "SumatraPDF.exe"

def load_config() -> dict:
    config_path = get_config_path()
    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "api_url": DEFAULT_API_URL,
        "agent_token": "agent-token-campus-secret-key-1234",
        "bw_printer": "",
        "color_printer": "",
        "auto_start": False,
        "poll_interval": 4,
    }

def save_config(config: dict):
    config_path = get_config_path()
    try:
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving config: {e}")

def set_windows_autostart(enable: bool):
    """Enable or disable Windows startup registry entry."""
    key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_ALL_ACCESS) as key:
            if enable:
                exe_path = sys.executable if getattr(sys, 'frozen', False) else f'"{sys.executable}" "{os.path.abspath(__file__)}"'
                winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, exe_path)
            else:
                try:
                    winreg.DeleteValue(key, APP_NAME)
                except FileNotFoundError:
                    pass
    except Exception as e:
        print(f"Registry error: {e}")

def get_installed_printers() -> List[str]:
    """Retrieve list of all Windows installed printers."""
    printers = []
    try:
        flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        for p in win32print.EnumPrinters(flags):
            name = p[2]
            if name and name not in printers:
                printers.append(name)
    except Exception as e:
        print(f"Failed to enumerate printers: {e}")
    if not printers:
        try:
            default_p = win32print.GetDefaultPrinter()
            if default_p:
                printers.append(default_p)
        except Exception:
            pass
    return printers

# ---------------------------------------------------------------------------
# Background Polling & Printing Worker Thread
# ---------------------------------------------------------------------------

class PrintWorker(QThread):
    status_updated = Signal(str, str) # status_text, color
    job_processed = Signal(str, str, str, str) # order_number, time, pages, status
    log_message = Signal(str)

    def __init__(self, get_config_cb):
        super().__init__()
        self.get_config_cb = get_config_cb
        self.is_running = True
        self.is_paused = False

    def stop(self):
        self.is_running = False

    def set_paused(self, paused: bool):
        self.is_paused = paused

    def run(self):
        temp_dir = Path(tempfile.gettempdir()) / "MaktabatiPrintJobs"
        temp_dir.mkdir(parents=True, exist_ok=True)

        while self.is_running:
            if self.is_paused:
                self.status_updated.emit("متوقف مؤقتاً", "#f59e0b")
                time.sleep(1)
                continue

            config = self.get_config_cb()
            api_url = config.get("api_url", "").strip().rstrip("/")
            token = config.get("agent_token", "").strip()
            bw_printer = config.get("bw_printer", "").strip()
            color_printer = config.get("color_printer", "").strip() or bw_printer

            if not api_url or not token:
                self.status_updated.emit("في انتظار إدخال رمز الربط", "#64748b")
                time.sleep(2)
                continue

            # Poll printable jobs
            try:
                headers = {"X-Agent-Token": token, "Accept": "application/json"}
                res = requests.get(f"{api_url}/api/agent/jobs", headers=headers, timeout=10)
                
                if res.status_code == 401 or res.status_code == 403:
                    self.status_updated.emit("رمز الربط غير صالح أو تم إلغاؤه", "#ef4444")
                    time.sleep(5)
                    continue

                if res.status_code == 200:
                    data = res.json()
                    jobs = data.get("jobs", [])
                    self.status_updated.emit(f"متصل وجاهز للطباعة ({len(jobs)} في الانتظار)", "#10b981")

                    for job in jobs:
                        if not self.is_running or self.is_paused:
                            break
                        self.process_job(job, api_url, token, bw_printer, color_printer, temp_dir)

                else:
                    self.status_updated.emit(f"خطأ في الاتصال بالخادم ({res.status_code})", "#f59e0b")

            except requests.exceptions.RequestException as e:
                self.status_updated.emit("تعذر الاتصال بالخادم (جاري إعادة المحاولة...)", "#f59e0b")
            except Exception as e:
                self.status_updated.emit(f"خطأ غير متوقع: {str(e)[:30]}", "#ef4444")

            poll_sec = max(2, int(config.get("poll_interval", 4)))
            for _ in range(poll_sec * 2):
                if not self.is_running or self.is_paused:
                    break
                time.sleep(0.5)

    def process_job(self, job: dict, api_url: str, token: str, bw_printer: str, color_printer: str, temp_dir: Path):
        order_id = job.get("id") or job.get("order_id")
        order_number = str(job.get("daily_order_code") or job.get("order_number") or (order_id[:8] if order_id else "---"))
        items = job.get("items", [])

        now_time = time.strftime("%H:%M:%S")
        self.log_message.emit(f"بدء استلام الطلب #{order_number} ({len(items)} ملف)")
        
        # 1. Update status to 'printing'
        headers = {"X-Agent-Token": token, "Content-Type": "application/json"}
        try:
            requests.post(
                f"{api_url}/api/agent/jobs/{order_id}/status",
                headers=headers,
                json={"status": "printing"},
                timeout=10
            )
        except Exception as e:
            self.log_message.emit(f"تحذير: تعذر تحديث حالة البدء: {e}")

        total_pages = 0
        all_success = True
        last_error = ""

        for idx, item in enumerate(items):
            file_url = item.get("download_url") or item.get("file_path")
            color_mode = item.get("color_mode", "bw")
            copies = int(item.get("copies_count") or 1)
            duplex = item.get("duplex", "simplex")
            paper_size = item.get("paper_size", "A4")
            page_range = item.get("custom_page_range")
            page_count = int(item.get("page_count") or 1)
            total_pages += (page_count * copies)

            # Choose printer
            target_printer = color_printer if color_mode == "color" else bw_printer
            if not target_printer:
                target_printer = bw_printer or color_printer

            if not target_printer:
                all_success = False
                last_error = "لم يتم تحديد طابعة في البرنامج"
                self.log_message.emit(f"خطأ: لم يتم تحديد طابعة لإرسال الملف #{idx+1}")
                break

            if not file_url:
                all_success = False
                last_error = f"لا يوجد مسار تحميل للملف #{idx+1}"
                self.log_message.emit(f"تنبيه: الطلب #{order_number} الملف #{idx+1} غير متوفر على السيرفر.")
                break

            # Download file
            temp_file_path = None
            try:
                temp_file_path = self.download_item_file(file_url, temp_dir, idx)
                if not temp_file_path or not os.path.exists(temp_file_path):
                    raise Exception("فشل تنزيل ملف الطباعة")

                # If image, convert to PDF
                if temp_file_path.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
                    pdf_path = str(temp_file_path) + ".pdf"
                    img = Image.open(temp_file_path)
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    img.save(pdf_path, "PDF", resolution=150.0)
                    temp_file_path = pdf_path

                # Execute silent print via SumatraPDF
                sumatra_exe = get_sumatra_path()
                if not os.path.isfile(sumatra_exe):
                    raise Exception(f"برنامج SumatraPDF غير موجود في المسار: {sumatra_exe}")

                # Build print settings
                settings_list = [f"{copies}x"]
                if color_mode == "color":
                    settings_list.append("color")
                else:
                    settings_list.append("monochrome")

                if duplex in ("duplex_long", "duplex_short", "duplex"):
                    settings_list.append("duplex")
                else:
                    settings_list.append("simplex")

                if paper_size:
                    settings_list.append(f"paper={paper_size}")

                if page_range:
                    settings_list.append(str(page_range))

                settings_str = ",".join(settings_list)

                cmd = [
                    sumatra_exe,
                    "-print-to", target_printer,
                    "-print-settings", settings_str,
                    "-silent",
                    temp_file_path
                ]

                self.log_message.emit(f"إرسال أمر الطباعة إلى: {target_printer} ({settings_str})")
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45)
                
                if proc.returncode != 0:
                    raise Exception(f"فشل أمر الطباعة كود: {proc.returncode}")

                # Brief delay between items
                time.sleep(1)

            except Exception as e:
                all_success = False
                last_error = str(e)
                self.log_message.emit(f"خطأ أثناء طباعة الملف #{idx+1}: {e}")
                break
            finally:
                # Clean up temp file
                if temp_file_path and os.path.exists(temp_file_path):
                    try:
                        os.remove(temp_file_path)
                    except Exception:
                        pass

        # Update final status in API
        final_status = "completed" if all_success else "failed"
        try:
            requests.post(
                f"{api_url}/api/agent/jobs/{order_id}/status",
                headers=headers,
                json={
                    "status": final_status,
                    "error_message": last_error if not all_success else None,
                    "printer_name": bw_printer or color_printer,
                    "printed_pages": total_pages,
                },
                timeout=10
            )
        except Exception as e:
            self.log_message.emit(f"تحذير: تعذر تحديث الحالة النهائية: {e}")

        # Update UI table
        status_label = "تمت الطباعة بنجاح" if all_success else f"فشل: {last_error[:25]}"
        self.job_processed.emit(f"#{order_number}", now_time, f"{total_pages} ص", status_label)

    def download_item_file(self, url: str, temp_dir: Path, idx: int) -> Optional[str]:
        if not url:
            return None
        
        # If url is already a local valid path
        if os.path.isfile(url):
            return url

        # Download from HTTP
        filename = f"job_part_{int(time.time())}_{idx}.dat"
        ext = ".pdf"
        if ".png" in url.lower(): ext = ".png"
        elif ".jpg" in url.lower() or ".jpeg" in url.lower(): ext = ".jpg"
        elif ".webp" in url.lower(): ext = ".webp"
        
        dest_path = str(temp_dir / f"{filename}{ext}")
        
        resp = requests.get(url, stream=True, timeout=30)
        resp.raise_for_status()
        with open(dest_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return dest_path

# ---------------------------------------------------------------------------
# Main GUI Window
# ---------------------------------------------------------------------------

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.config = load_config()
        self.is_quitting = False
        
        self.init_ui()
        self.init_system_tray()
        self.init_worker()

        # Initial verify if token present
        if self.config.get("agent_token"):
            QTimer.singleShot(500, self.verify_branch_connection)

    def init_ui(self):
        self.setWindowTitle(APP_TITLE)
        self.setMinimumSize(780, 680)
        self.resize(820, 720)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)

        # Style sheet
        self.setStyleSheet("""
            QWidget {
                font-family: 'Segoe UI', 'Arial', sans-serif;
                font-size: 13px;
                color: #1e293b;
            }
            QMainWindow {
                background-color: #f8fafc;
            }
            QGroupBox {
                font-weight: bold;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                margin-top: 14px;
                padding-top: 14px;
                background-color: #ffffff;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                subcontrol-position: top right;
                padding: 0 10px;
                color: #334155;
            }
            QLineEdit, QComboBox {
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 7px 10px;
                background: #ffffff;
            }
            QLineEdit:focus, QComboBox:focus {
                border: 2px solid #6366f1;
            }
            QPushButton {
                background-color: #4f46e5;
                color: white;
                font-weight: bold;
                border: none;
                border-radius: 8px;
                padding: 8px 16px;
            }
            QPushButton:hover {
                background-color: #4338ca;
            }
            QPushButton:pressed {
                background-color: #3730a3;
            }
            QPushButton#secondaryBtn {
                background-color: #f1f5f9;
                color: #334155;
                border: 1px solid #cbd5e1;
            }
            QPushButton#secondaryBtn:hover {
                background-color: #e2e8f0;
            }
            QTableWidget {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                background-color: #ffffff;
                gridline-color: #f1f5f9;
            }
            QHeaderView::section {
                background-color: #f8fafc;
                font-weight: bold;
                padding: 6px;
                border: none;
                border-bottom: 1px solid #e2e8f0;
            }
        """)

        # Central Widget & Scroll
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.NoFrame)

        central_widget = QWidget()
        scroll.setWidget(central_widget)
        self.setCentralWidget(scroll)

        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(16)

        # 1. Header Banner
        header_frame = QFrame()
        header_frame.setStyleSheet("""
            background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #1e1b4b, stop:1 #312e81);
            border-radius: 14px;
            padding: 16px;
        """)
        header_layout = QHBoxLayout(header_frame)
        
        header_text_layout = QVBoxLayout()
        title_label = QLabel("برنامج الطباعة الصامتة والآلية (MaktabatiPrint)")
        title_label.setStyleSheet("color: white; font-size: 16px; font-weight: bold;")
        subtitle_label = QLabel("استقبال طلبات الزبائن مباشرة والطباعة على طابعات المحل بدون أي تدخل يدوي")
        subtitle_label.setStyleSheet("color: #cbd5e1; font-size: 11px;")
        header_text_layout.addWidget(title_label)
        header_text_layout.addWidget(subtitle_label)

        self.status_badge = QLabel("غير متصل")
        self.status_badge.setStyleSheet("""
            background-color: #ef4444;
            color: white;
            font-weight: bold;
            font-size: 12px;
            border-radius: 12px;
            padding: 6px 14px;
        """)

        header_layout.addLayout(header_text_layout)
        header_layout.addStretch()
        header_layout.addWidget(self.status_badge)

        main_layout.addWidget(header_frame)

        # 2. Connection Group
        conn_group = QGroupBox("إعدادات الربط مع الفرع")
        conn_layout = QVBoxLayout(conn_group)
        conn_layout.setSpacing(10)

        # API URL row
        url_layout = QHBoxLayout()
        url_lbl = QLabel("رابط المنصة:")
        url_lbl.setFixedWidth(90)
        self.api_url_input = QLineEdit(self.config.get("api_url", DEFAULT_API_URL))
        self.api_url_input.setPlaceholderText("https://mktabati.vercel.app")
        url_layout.addWidget(url_lbl)
        url_layout.addWidget(self.api_url_input)
        conn_layout.addLayout(url_layout)

        # Token row
        token_layout = QHBoxLayout()
        token_lbl = QLabel("رمز ربط الفرع:")
        token_lbl.setFixedWidth(90)
        self.token_input = QLineEdit(self.config.get("agent_token", ""))
        self.token_input.setPlaceholderText("الصق رمز ربط الفرع من لوحة تحكم الفروع (/dashboard/branches)")
        self.token_input.setEchoMode(QLineEdit.Normal)
        
        self.verify_btn = QPushButton("ربط وحفظ الإعدادات")
        self.verify_btn.setFixedWidth(150)
        self.verify_btn.clicked.connect(self.verify_branch_connection)

        token_layout.addWidget(token_lbl)
        token_layout.addWidget(self.token_input)
        token_layout.addWidget(self.verify_btn)
        conn_layout.addLayout(token_layout)

        # Branch Info text
        self.branch_info_lbl = QLabel("لم يتم الربط بعد. ادخل رمز الربط واضغط 'ربط وحفظ الإعدادات'.")
        self.branch_info_lbl.setStyleSheet("color: #64748b; font-size: 11px;")
        conn_layout.addWidget(self.branch_info_lbl)

        main_layout.addWidget(conn_group)

        # 3. Printers Group
        printer_group = QGroupBox("تعيين الطابعات")
        printer_layout = QVBoxLayout(printer_group)
        printer_layout.setSpacing(10)

        # B&W Printer
        bw_row = QHBoxLayout()
        bw_lbl = QLabel("طابعة الأبيض والأسود:")
        bw_lbl.setFixedWidth(140)
        self.bw_combo = QComboBox()
        bw_row.addWidget(bw_lbl)
        bw_row.addWidget(self.bw_combo)
        printer_layout.addLayout(bw_row)

        # Color Printer
        color_row = QHBoxLayout()
        color_lbl = QLabel("طابعة الألوان:")
        color_lbl.setFixedWidth(140)
        self.color_combo = QComboBox()
        color_row.addWidget(color_lbl)
        color_row.addWidget(self.color_combo)
        printer_layout.addLayout(color_row)

        # Refresh & Test buttons
        btns_row = QHBoxLayout()
        
        self.refresh_printers_btn = QPushButton("تحديث قائمة الطابعات")
        self.refresh_printers_btn.setObjectName("secondaryBtn")
        self.refresh_printers_btn.clicked.connect(self.populate_printers)

        self.test_print_btn = QPushButton("طباعة ورقة اختبار الآن")
        self.test_print_btn.setObjectName("secondaryBtn")
        self.test_print_btn.clicked.connect(self.print_test_page)

        btns_row.addWidget(self.refresh_printers_btn)
        btns_row.addWidget(self.test_print_btn)
        btns_row.addStretch()
        printer_layout.addLayout(btns_row)

        self.populate_printers()
        main_layout.addWidget(printer_group)

        # 4. General Settings & Autostart
        opt_group = QGroupBox("خيارات التشغيل")
        opt_layout = QHBoxLayout(opt_group)
        
        self.autostart_cb = QCheckBox("التشغيل التلقائي للبرنامج مع بدء تشغيل ويندوز")
        self.autostart_cb.setChecked(self.config.get("auto_start", False))
        self.autostart_cb.toggled.connect(self.on_autostart_toggled)
        opt_layout.addWidget(self.autostart_cb)

        self.pause_btn = QPushButton("إيقاف مؤقت للطباعة")
        self.pause_btn.setObjectName("secondaryBtn")
        self.pause_btn.setFixedWidth(140)
        self.pause_btn.clicked.connect(self.toggle_pause)
        opt_layout.addWidget(self.pause_btn)

        main_layout.addWidget(opt_group)

        # 5. Live Print Jobs Table
        jobs_group = QGroupBox("سجل الطلبات المطبوعة مؤخراً")
        jobs_layout = QVBoxLayout(jobs_group)

        self.jobs_table = QTableWidget()
        self.jobs_table.setColumnCount(4)
        self.jobs_table.setHorizontalHeaderLabels(["رقم الطلب", "الوقت", "الصفحات", "الحالة"])
        self.jobs_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.jobs_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeToContents)
        self.jobs_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeToContents)
        self.jobs_table.horizontalHeader().setSectionResizeMode(3, QHeaderView.Stretch)
        self.jobs_table.setRowCount(0)
        self.jobs_table.setMinimumHeight(160)
        jobs_layout.addWidget(self.jobs_table)

        # Status text log
        self.log_lbl = QLabel("جاهز للعمل.")
        self.log_lbl.setStyleSheet("color: #64748b; font-size: 11px;")
        jobs_layout.addWidget(self.log_lbl)

        main_layout.addWidget(jobs_group)

        # Save printer selection whenever changed
        self.bw_combo.currentIndexChanged.connect(self.on_printer_changed)
        self.color_combo.currentIndexChanged.connect(self.on_printer_changed)

    def populate_printers(self):
        printers = get_installed_printers()
        self.bw_combo.clear()
        self.color_combo.clear()

        if not printers:
            self.bw_combo.addItem("لم يتم العثور على أي طابعة مثبتة")
            self.color_combo.addItem("لم يتم العثور على أي طابعة مثبتة")
            return

        for p in printers:
            self.bw_combo.addItem(p)
            self.color_combo.addItem(p)

        saved_bw = self.config.get("bw_printer")
        saved_color = self.config.get("color_printer")

        if saved_bw and saved_bw in printers:
            self.bw_combo.setCurrentText(saved_bw)
        if saved_color and saved_color in printers:
            self.color_combo.setCurrentText(saved_color)

    def on_printer_changed(self):
        self.config["bw_printer"] = self.bw_combo.currentText()
        self.config["color_printer"] = self.color_combo.currentText()
        save_config(self.config)

    def on_autostart_toggled(self, checked: bool):
        self.config["auto_start"] = checked
        save_config(self.config)
        set_windows_autostart(checked)

    def verify_branch_connection(self):
        api_url = self.api_url_input.text().strip().rstrip("/")
        token = self.token_input.text().strip()

        if not api_url or not token:
            QMessageBox.warning(self, "تنبيه", "يرجى إدخال رابط المنصة ورمز ربط الفرع.")
            return

        self.branch_info_lbl.setText("جاري التحقق من صحة الرمز...")
        self.branch_info_lbl.setStyleSheet("color: #6366f1; font-size: 11px;")
        
        try:
            res = requests.get(
                f"{api_url}/api/agent/verify",
                headers={"X-Agent-Token": token},
                timeout=8
            )
            if res.status_code == 200:
                data = res.json()
                b_name = data.get("branch_name", "فرع معتمد")
                t_name = data.get("tenant_name", "مكتبتي")
                self.branch_info_lbl.setText(f"✓ تم الربط بنجاح: {t_name} - {b_name}")
                self.branch_info_lbl.setStyleSheet("color: #10b981; font-weight: bold; font-size: 12px;")
                
                # Save config
                self.config["api_url"] = api_url
                self.config["agent_token"] = token
                self.config["bw_printer"] = self.bw_combo.currentText()
                self.config["color_printer"] = self.color_combo.currentText()
                save_config(self.config)
                
                if self.tray_icon:
                    self.tray_icon.showMessage(APP_NAME, f"تم ربط {b_name} بنجاح!", QSystemTrayIcon.Information, 3000)
            else:
                err_data = res.json() if res.headers.get("content-type") == "application/json" else {}
                msg = err_data.get("error", f"خطأ في التحقق (كود {res.status_code})")
                self.branch_info_lbl.setText(f"✗ فشل الربط: {msg}")
                self.branch_info_lbl.setStyleSheet("color: #ef4444; font-weight: bold; font-size: 12px;")
        except Exception as e:
            self.branch_info_lbl.setText(f"✗ تعذر الاتصال بالخادم: {e}")
            self.branch_info_lbl.setStyleSheet("color: #ef4444; font-weight: bold; font-size: 12px;")

    def print_test_page(self):
        printer_name = self.bw_combo.currentText()
        if not printer_name or "لم يتم العثور" in printer_name:
            QMessageBox.warning(self, "خطأ", "يرجى اختيار طابعة صالحة أولاً.")
            return

        sumatra_exe = get_sumatra_path()
        if not os.path.isfile(sumatra_exe):
            QMessageBox.critical(self, "خطأ", f"تعذر العثور على مشغل الطباعة SumatraPDF: {sumatra_exe}")
            return

        # Generate a test PDF with reportlab or simple canvas if available, or text file
        try:
            temp_dir = Path(tempfile.gettempdir()) / "MaktabatiPrintJobs"
            temp_dir.mkdir(parents=True, exist_ok=True)
            test_img_path = str(temp_dir / "test_page.png")
            test_pdf_path = str(temp_dir / "test_page.pdf")

            # Create clean test image using Pillow
            img = Image.new("RGB", (1240, 1754), color="#ffffff") # A4 at 150 DPI approx
            from PIL import ImageDraw
            draw = ImageDraw.Draw(img)
            draw.rectangle([(40, 40), (1200, 1714)], outline="#4f46e5", width=6)
            draw.text((100, 150), "MaktabatiPrint - Test Print Page", fill="#1e1b4b")
            draw.text((100, 220), f"Printer: {printer_name}", fill="#334155")
            draw.text((100, 280), f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}", fill="#334155")
            draw.text((100, 340), "Status: Direct Silent Printing Active & Operational", fill="#10b981")
            img.save(test_pdf_path, "PDF", resolution=150.0)

            # Print via SumatraPDF
            cmd = [sumatra_exe, "-print-to", printer_name, "-silent", test_pdf_path]
            subprocess.run(cmd, check=True, timeout=30)
            QMessageBox.information(self, "تم الإرسال", f"تم إرسال صفحة الاختبار بنجاح إلى: {printer_name}")
        except Exception as e:
            QMessageBox.critical(self, "خطأ في الطباعة التجريبية", f"حدث خطأ أثناء الطباعة: {e}")

    def toggle_pause(self):
        if self.worker.is_paused:
            self.worker.set_paused(False)
            self.pause_btn.setText("إيقاف مؤقت للطباعة")
        else:
            self.worker.set_paused(True)
            self.pause_btn.setText("استئناف الطباعة")

    def init_worker(self):
        self.worker = PrintWorker(get_config_cb=lambda: self.config)
        self.worker.status_updated.connect(self.on_worker_status)
        self.worker.job_processed.connect(self.on_job_processed)
        self.worker.log_message.connect(self.on_log_message)
        self.worker.start()

    @Slot(str, str)
    def on_worker_status(self, text: str, color: str):
        self.status_badge.setText(text)
        self.status_badge.setStyleSheet(f"""
            background-color: {color};
            color: white;
            font-weight: bold;
            font-size: 12px;
            border-radius: 12px;
            padding: 6px 14px;
        """)

    @Slot(str, str, str, str)
    def on_job_processed(self, order_num: str, time_str: str, pages_str: str, status: str):
        row = 0
        self.jobs_table.insertRow(row)
        self.jobs_table.setItem(row, 0, QTableWidgetItem(order_num))
        self.jobs_table.setItem(row, 1, QTableWidgetItem(time_str))
        self.jobs_table.setItem(row, 2, QTableWidgetItem(pages_str))
        
        status_item = QTableWidgetItem(status)
        if "نجاح" in status:
            status_item.setForeground(QColor("#10b981"))
        else:
            status_item.setForeground(QColor("#ef4444"))
        self.jobs_table.setItem(row, 3, status_item)

        # System tray notification
        if self.tray_icon and "نجاح" in status:
            self.tray_icon.showMessage(APP_NAME, f"تمت طباعة الطلب {order_num} بنجاح ({pages_str})", QSystemTrayIcon.Information, 3000)

    @Slot(str)
    def on_log_message(self, message: str):
        self.log_lbl.setText(message)

    # -----------------------------------------------------------------------
    # System Tray & Window Close
    # -----------------------------------------------------------------------

    def init_system_tray(self):
        self.tray_icon = QSystemTrayIcon(self)
        # Use default application icon or standard icon
        icon = self.style().standardIcon(QApplication.style().StandardPixmap.SP_DriveCDIcon)
        self.setWindowIcon(icon)
        self.tray_icon.setIcon(icon)

        tray_menu = QMenu()
        show_action = QAction("فتح نافذة البرنامج", self)
        show_action.triggered.connect(self.show_and_activate)
        tray_menu.addAction(show_action)

        pause_action = QAction("إيقاف / استئناف مؤقت", self)
        pause_action.triggered.connect(self.toggle_pause)
        tray_menu.addAction(pause_action)

        tray_menu.addSeparator()

        quit_action = QAction("خروج نهائي", self)
        quit_action.triggered.connect(self.quit_application)
        tray_menu.addAction(quit_action)

        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.on_tray_activated)
        self.tray_icon.show()

    def on_tray_activated(self, reason):
        if reason == QSystemTrayIcon.DoubleClick or reason == QSystemTrayIcon.Trigger:
            self.show_and_activate()

    def show_and_activate(self):
        self.show()
        self.raise_()
        self.activateWindow()

    def closeEvent(self, event):
        """Minimize to tray instead of exiting when X button is clicked."""
        if not self.is_quitting:
            event.ignore()
            self.hide()
            if self.tray_icon:
                self.tray_icon.showMessage(
                    APP_NAME,
                    "البرنامج ما زال يعمل في الخلفية بجانب الساعة لاستقبال وطباعة الطلبات تلقائياً.",
                    QSystemTrayIcon.Information,
                    2000
                )
        else:
            event.accept()

    def quit_application(self):
        self.is_quitting = True
        if hasattr(self, 'worker'):
            self.worker.stop()
            self.worker.wait(2000)
        if self.tray_icon:
            self.tray_icon.hide()
        QApplication.quit()

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def main():
    # Enable High DPI
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )
    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setQuitOnLastWindowClosed(False)

    window = MainWindow()
    window.show()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()
