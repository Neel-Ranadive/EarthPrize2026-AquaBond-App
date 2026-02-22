"""
Simple script to produce a CSV dataset of average RGB and Lab per calibration image.
Place calibration images in `calibration/images/` with filenames like `sample_pH7.0_1.jpg`.
The script will write `calibration_samples.csv` with columns: filename, r,g,b, L,a,b, ph
"""
from PIL import Image
import os
import csv
import re

from math import pow

IMG_DIR = 'calibration/images'
OUT_CSV = 'calibration/calibration_samples.csv'

# simple sRGB->Lab implementation

def srgb_to_xyz(r,g,b):
    R = r/255.0
    G = g/255.0
    B = b/255.0
    def inv_gamma(c):
        return c/12.92 if c <= 0.04045 else pow((c+0.055)/1.055, 2.4)
    R = inv_gamma(R); G = inv_gamma(G); B = inv_gamma(B)
    X = R*0.4124564 + G*0.3575761 + B*0.1804375
    Y = R*0.2126729 + G*0.7151522 + B*0.0721750
    Z = R*0.0193339 + G*0.1191920 + B*0.9503041
    return X,Y,Z

def xyz_to_lab(X,Y,Z):
    Xn = 0.95047; Yn = 1.0; Zn = 1.08883
    x = X/Xn; y = Y/Yn; z = Z/Zn
    def f(t):
        return pow(t, 1/3) if t > 0.008856 else (7.787*t + 16/116)
    fx,fy,fz = f(x), f(y), f(z)
    L = 116*fy - 16
    a = 500*(fx - fy)
    b = 200*(fy - fz)
    return L,a,b

pattern = re.compile(r"pH\s*([0-9]+\.?[0-9]*)|pH([0-9]+\.?[0-9]*)|_pH([0-9]+\.?[0-9]*)|ph([0-9]+\.?[0-9]*)", re.IGNORECASE)

def extract_ph_from_name(name):
    m = re.search(r"([0-9]+\.?[0-9]*)", name)
    if m:
        return float(m.group(1))
    return None

os.makedirs('calibration', exist_ok=True)

rows = []
for fn in os.listdir(IMG_DIR) if os.path.exists(IMG_DIR) else []:
    path = os.path.join(IMG_DIR, fn)
    try:
        im = Image.open(path).convert('RGB')
        # sample center 10% patch
        w,h = im.size
        cs = int(min(w,h)*0.12)
        sx = int((w-cs)/2); sy = int((h-cs)/2)
        patch = im.crop((sx,sy,sx+cs,sy+cs))
        pixels = list(patch.getdata())
        r = sum([p[0] for p in pixels])/len(pixels)
        g = sum([p[1] for p in pixels])/len(pixels)
        b = sum([p[2] for p in pixels])/len(pixels)
        X,Y,Z = srgb_to_xyz(r,g,b)
        L,a,b2 = xyz_to_lab(X,Y,Z)
        ph = extract_ph_from_name(fn)
        rows.append([fn, round(r,2), round(g,2), round(b,2), round(L,3), round(a,3), round(b2,3), ph if ph else ''])
    except Exception as e:
        print('skip', fn, e)

with open(OUT_CSV, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['filename','r','g','b','L','a','b','ph'])
    w.writerows(rows)

print('wrote', OUT_CSV)
