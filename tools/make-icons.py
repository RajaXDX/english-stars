# -*- coding: utf-8 -*-
"""
يولّد أيقونة التطبيق (1024، بلا شفافية كما تشترط آبل) وشاشة البداية من icons/logo.svg.
يرسم الـSVG بمتصفح Chrome بدون واجهة، ثم يركّبه Pillow على الخلفية.
التشغيل:  python tools/make-icons.py
"""
import pathlib, subprocess, sys, tempfile, os
from PIL import Image

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ROOT = pathlib.Path(__file__).resolve().parent.parent
SVG = (ROOT / "icons" / "logo.svg").read_text(encoding="utf-8")
ICON_BG = (255, 243, 209)      # نفس خلفية icons/icon-512.png
SPLASH_BG = (223, 243, 255)    # #DFF3FF — background_color في manifest
CHROME = next((p for p in [
    os.environ.get("CHROME", ""),
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"] if p and os.path.exists(p)), None)
if not CHROME: raise SystemExit("لم أجد Chrome أو Edge — حدّد المسار في متغيّر CHROME")

def render(size):
    """يرسم الشعار بمقاس size×size بخلفية شفافة"""
    tmp = pathlib.Path(tempfile.mkdtemp())
    html = tmp / "l.html"; png = tmp / "l.png"
    html.write_text(f"<html><body style='margin:0;background:transparent'><div style='width:{size}px;height:{size}px'>{SVG.replace('<svg ', f'<svg width={size} height={size} ', 1)}</div></body></html>", encoding="utf-8")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
                    f"--window-size={size},{size}", f"--screenshot={png}", html.as_uri()], check=True, capture_output=True)
    return Image.open(png).convert("RGBA").crop((0, 0, size, size))

def compose(canvas, bg, logo_frac, name):
    img = Image.new("RGB", (canvas, canvas), bg)
    s = int(canvas * logo_frac); logo = render(s)
    img.paste(logo, ((canvas - s) // 2, (canvas - s) // 2), logo)
    return img

ios = ROOT / "ios" / "App" / "App" / "Assets.xcassets"
icon = compose(1024, ICON_BG, 0.78, "icon")
assert icon.mode == "RGB"
icon.save(ios / "AppIcon.appiconset" / "AppIcon-512@2x.png", optimize=True)
print("AppIcon 1024×1024 (RGB، بلا شفافية)")

splash = compose(2732, SPLASH_BG, 0.22, "splash")
for n in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
    splash.save(ios / "Splash.imageset" / n, optimize=True)
print("Splash 2732×2732")

# نسخة للمتجر وللمعاينة
(ROOT / "store").mkdir(exist_ok=True)
icon.save(ROOT / "store" / "app-icon-1024.png")
print("store/app-icon-1024.png")
