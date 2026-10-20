"""Génère le tatouage « Narsil & l'Anneau Unique » en SVG (fine line + dotwork)."""
import json, math, os, random

random.seed(7)
W, H = 800, 1600
CX = 400
INK = "#111"
out = []
defs = []
add = out.append


def f(v):
    return f"{v:.1f}"


def pts(p):
    return " ".join(f"{f(x)},{f(y)}" for x, y in p)


def stipple(clip_id, bbox, density, rmin=0.6, rmax=1.3, n=4000):
    """Points dont la probabilité suit density(x, y) ∈ [0,1], découpés par un clipPath."""
    x0, y0, x1, y1 = bbox
    dots = []
    for _ in range(n):
        x, y = random.uniform(x0, x1), random.uniform(y0, y1)
        d = density(x, y)
        if random.random() < d:
            r = rmin + (rmax - rmin) * random.random() * d
            dots.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{r:.2f}"/>')
    return f'<g clip-path="url(#{clip_id})" fill="{INK}">' + "".join(dots) + "</g>"


def star(cx, cy, r_long, r_short, r_in, n=8, rot=-90):
    """Étoile à n branches, branches alternées longues/courtes."""
    p = []
    for i in range(n * 2):
        a = math.radians(rot + i * 180 / n)
        if i % 2 == 0:
            r = r_long if (i // 2) % 2 == 0 else r_short
        else:
            r = r_in
        p.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return p


def facet_star(cx, cy, r_long, r_short, r_in, n=8, sw=1.6):
    """Étoile facettée : une moitié de chaque branche ombrée."""
    p = star(cx, cy, r_long, r_short, r_in, n)
    g = [f'<polygon points="{pts(p)}" fill="#fff" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="miter"/>']
    for i in range(0, len(p), 2):
        tip, nxt = p[i], p[(i + 1) % len(p)]
        g.append(f'<polygon points="{pts([(cx, cy), tip, nxt])}" fill="{INK}"/>')
    return "".join(g)


# ------------------------------------------------------------------ cadre
TOP, BOT, LX, RX, MY = 205, 1395, 150, 650, 800


def diamond(inset):
    k = inset
    return [(CX, TOP + k * 2.4), (RX - k, MY), (CX, BOT - k * 2.4), (LX + k, MY)]


def edge_point(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


outer, inner = diamond(0), diamond(14)
add(f'<polygon points="{pts(outer)}" fill="none" stroke="{INK}" stroke-width="2.6"/>')
add(f'<polygon points="{pts(inner)}" fill="none" stroke="{INK}" stroke-width="0.9"/>')
# petits losanges aux sommets latéraux
for x, s in ((LX, -1), (RX, 1)):
    add(f'<polygon points="{pts([(x, MY-12), (x+s*9, MY), (x, MY+12), (x-s*9, MY)])}" fill="{INK}"/>')
    add(f'<circle cx="{f(x + s*24)}" cy="{MY}" r="2.2" fill="{INK}"/>')
    add(f'<circle cx="{f(x + s*36)}" cy="{MY}" r="1.4" fill="{INK}"/>')

# axe pointillé vertical (haut et bas)
for y in range(40, 92, 9):
    add(f'<circle cx="{CX}" cy="{y}" r="{0.6 + (y-40)/60:.2f}" fill="{INK}"/>')
for y in range(1478, 1555, 9):
    add(f'<circle cx="{CX}" cy="{y}" r="{max(0.5, 1.5 - (y-1478)/70):.2f}" fill="{INK}"/>')

# ------------------------------------------------------------------ halo dotwork derrière l'anneau
RING_CY = 800
defs.append(f'<clipPath id="halo"><polygon points="{pts(inner)}"/></clipPath>')
def halo_d(x, y):
    r = math.hypot(x - CX, (y - RING_CY) * 1.0)
    if r < 170 or r > 238:
        return 0
    if y > RING_CY + 40:
        return 0.5 * max(0, 1 - (y - RING_CY - 40) / 25) * max(0, 1 - abs(r - 186) / 52)
    return max(0, 1 - abs(r - 186) / 52) ** 1.8 * 0.7
add(stipple("halo", (CX - 240, RING_CY - 240, CX + 240, RING_CY + 240), halo_d, 0.5, 1.2, 26000))
add(f'<circle cx="{CX}" cy="{RING_CY}" r="170" fill="none" stroke="{INK}" stroke-width="1.1"/>')
add(f'<circle cx="{CX}" cy="{RING_CY}" r="246" fill="none" stroke="{INK}" stroke-width="0.6" stroke-dasharray="1.5 6" stroke-linecap="round"/>')

# lignes pointillées dégressives (côtés inférieurs)
for a, b, side in ((inner[3], inner[2], 1), (inner[1], inner[2], -1)):
    for j, off in enumerate((26, 40)):
        ex, ey = b[0] - a[0], b[1] - a[1]
        Ln = math.hypot(ex, ey)
        nx, ny = -ey / Ln * side, ex / Ln * side
        for i in range(18):
            t = 0.36 + i * 0.026 + j * 0.05
            if t > 0.86:
                break
            r = 1.8 - i * 0.07 - j * 0.4
            add(f'<circle cx="{f(a[0]+ex*t+nx*off)}" cy="{f(a[1]+ey*t+ny*off)}" r="{max(r,0.5):.2f}" fill="{INK}"/>')

# ------------------------------------------------------------------ Sept étoiles de Gondor (arc)
for i in range(7):
    a = math.radians(-90 + (i - 3) * 13)
    sx, sy = CX + 208 * math.cos(a), RING_CY + 208 * math.sin(a)
    s = 1.0 - abs(i - 3) * 0.08
    add(facet_star(sx, sy, 11 * s, 6 * s, 2.4 * s, n=4, sw=0.9))

# ------------------------------------------------------------------ Étoile d'Elendil (sommet)
SY = 140
for k, (ln, w) in enumerate(((95, 0.9), (70, 0.7))):
    add(f'<line x1="{CX}" y1="{SY-ln}" x2="{CX}" y2="{SY+ln}" stroke="{INK}" stroke-width="{w}"/>')
add(f'<circle cx="{CX}" cy="{SY}" r="27" fill="#fff" stroke="{INK}" stroke-width="0.8" stroke-dasharray="1 3.5" stroke-linecap="round"/>')
add(facet_star(CX, SY, 46, 22, 6.5, n=8))
add(f'<circle cx="{CX}" cy="{SY}" r="2.6" fill="#fff"/>')

# ------------------------------------------------------------------ Arbre Blanc du Gondor (la lame en est le tronc)
def inscription_path(key, mapper, scale):
    """Tracé de l'inscription (police Tengwar Annatar, voir inscription.json), déformé par mapper(u, v)."""
    d = []
    for sub in INSCRIPTION[key]["subs"]:
        ptsw = [mapper(x * scale, (y + 8.5) * scale) for x, y in sub]
        d.append("M" + " L".join(f"{f(x)},{f(y)}" for x, y in ptsw) + "Z")
    return " ".join(d)


INSCRIPTION = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "inscription.json")))
trng = random.Random(42)
defs.append(f'<clipPath id="disc"><circle cx="{CX}" cy="{RING_CY}" r="164"/></clipPath>')
tree_parts, tips = [], []


def branch(x, y, ang, ln, w, depth, bend):
    ex, ey = x + ln * math.cos(ang), y + ln * math.sin(ang)
    mx, my = (x + ex) / 2, (y + ey) / 2
    cx_, cy_ = mx - bend * ln * math.sin(ang), my + bend * ln * math.cos(ang)
    tree_parts.append(f'<path d="M{f(x)},{f(y)} Q{f(cx_)},{f(cy_)} {f(ex)},{f(ey)}" fill="none" '
                      f'stroke="{INK}" stroke-width="{w:.2f}" stroke-linecap="round"/>')
    end_ang = math.atan2(ey - cy_, ex - cx_)
    if depth == 0:
        tips.append((ex, ey, end_ang))
        return
    for da, k in ((-0.42, 0.7), (0.38, 0.62)):
        branch(ex, ey, end_ang + da + trng.uniform(-0.08, 0.08), ln * k, w * 0.66, depth - 1, bend * 0.9)
    # rameau secondaire au milieu de la branche
    if depth >= 2:
        branch(cx_ * 0.5 + mx * 0.5, cy_ * 0.5 + my * 0.5, ang - 0.7, ln * 0.4, w * 0.5, 0, 0.1)


# couronne : trois maîtresses branches de chaque côté, qui s'arquent vers le haut puis retombent
for (y0, ang, ln, w) in ((712, math.radians(-165), 60, 4.0),
                         (690, math.radians(-138), 56, 3.6),
                         (664, math.radians(-110), 46, 3.2)):
    branch(CX - 26, y0, ang, ln, w, 3, -0.2)
# racines sous l'anneau
root_tip_start = len(tips)
for (y0, ang, ln, w) in ((886, math.radians(165), 40, 2.6), (896, math.radians(132), 38, 2.3),
                         (908, math.radians(106), 30, 2.0)):
    branch(CX - 26, y0, ang, ln, w, 2, 0.15)
root_tips = tips[root_tip_start:]
crown_tips = tips[:root_tip_start]

left = "".join(tree_parts)
# fleurs blanches aux extrémités de la couronne
flowers = []
for (x, y, a) in crown_tips:
    for p in range(5):
        pa = a + p * 2 * math.pi / 5
        flowers.append(f'<ellipse cx="{f(x + 3.2*math.cos(pa))}" cy="{f(y + 3.2*math.sin(pa))}" rx="2.9" ry="1.7" '
                       f'transform="rotate({math.degrees(pa):.0f} {f(x + 3.2*math.cos(pa))} {f(y + 3.2*math.sin(pa))})" '
                       f'fill="#fff" stroke="{INK}" stroke-width="0.8"/>')
    flowers.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="1.3" fill="{INK}"/>')
for (x, y, a) in root_tips:
    flowers.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="1.2" fill="{INK}"/>')
half = left + "".join(flowers)
add(f'<g clip-path="url(#disc)">{half}<g transform="translate({2*CX},0) scale(-1,1)">{half}</g></g>')

# Inscription (suite) en arc sous l'anneau : « ash nazg thrakatulûk · agh burzum-ishi krimpatul »
S_ARC, R_ARC = 0.18, 204
def arc_mapper(theta0):
    def m(u, v):
        th = theta0 - u / R_ARC
        r = R_ARC + v
        return CX + r * math.cos(th), RING_CY + r * math.sin(th)
    return m
wa = INSCRIPTION["side1"]["width"] * S_ARC
wb = INSCRIPTION["side2"]["width"] * S_ARC
gap_a = 120  # place pour la lame au centre
th0 = math.pi / 2 + (wa + wb + gap_a) / 2 / R_ARC
add(f'<path d="{inscription_path("side1", arc_mapper(th0), S_ARC)} '
    f'{inscription_path("side2", arc_mapper(th0 - (wa + gap_a) / R_ARC), S_ARC)}" fill="{INK}"/>')

# ------------------------------------------------------------------ Anneau (face arrière, derrière la lame)
RX_, RY_, TH = 160, 50, 44        # demi-axes, épaisseur de la bande
RIN_X, RIN_Y = 143, 40            # bord intérieur
top_c = RING_CY - TH / 2
bot_c = RING_CY + TH / 2


def arc(cx, cy, rx, ry, a0, a1, steps=80, move=True):
    s = []
    for i in range(steps + 1):
        a = a0 + (a1 - a0) * i / steps
        x, y = cx + rx * math.cos(a), cy + ry * math.sin(a)
        s.append(f"{'M' if (i == 0 and move) else 'L'}{f(x)},{f(y)}")
    return " ".join(s)


# face intérieure visible à l'arrière : entre bord intérieur haut et bord intérieur bas (moitié haute)
back_inner = (arc(CX, top_c, RIN_X, RIN_Y, math.pi, 2*math.pi) + " " +
              arc(CX, bot_c - 4, RIN_X, RIN_Y, 2*math.pi, math.pi, move=False) + " Z")
defs.append(f'<clipPath id="backin"><path d="{back_inner}"/></clipPath>')
add(f'<path d="{back_inner}" fill="#fff" stroke="{INK}" stroke-width="1.2"/>')
add(stipple("backin", (CX-RIN_X, top_c-RIN_Y, CX+RIN_X, bot_c), 
            lambda x, y: 0.1 + 0.55 * (1 - abs(x - CX) / RIN_X) ** 0.7 * max(0, (y - top_c + RIN_Y) / (RIN_Y + TH)), 0.5, 1.0, 7000))
# dessus de l'anneau (anneau plat entre ellipse ext. et int.) – moitié arrière
rim_back = (arc(CX, top_c, RX_, RY_, math.pi, 2*math.pi) + " " +
            arc(CX, top_c, RIN_X, RIN_Y, 2*math.pi, math.pi, move=False) + " Z")
add(f'<path d="{rim_back}" fill="#fff" stroke="{INK}" stroke-width="1.6"/>')

# ------------------------------------------------------------------ Lame brisée de Narsil
GUARD_Y = 1075
BREAK_Y = 520
bw_bot, bw_top = 30, 25
jag = [(CX - bw_top, BREAK_Y + 40), (CX - 12, BREAK_Y + 18), (CX - 4, BREAK_Y + 30),
       (CX + 6, BREAK_Y - 6), (CX + 14, BREAK_Y + 22), (CX + bw_top, BREAK_Y + 8)]
blade = [(CX - bw_bot, GUARD_Y)] + jag + [(CX + bw_bot, GUARD_Y)]
defs.append(f'<clipPath id="bladeR"><polygon points="{pts([(CX, BREAK_Y-10), (CX+40, BREAK_Y-10), (CX+40, GUARD_Y), (CX, GUARD_Y)])}"/></clipPath>')
defs.append(f'<clipPath id="blade"><polygon points="{pts(blade)}"/></clipPath>')
add(f'<polygon points="{pts(blade)}" fill="#fff" stroke="{INK}" stroke-width="2.6" stroke-linejoin="miter"/>')
# demi-lame droite ombrée (arête centrale)
add(f'<g clip-path="url(#blade)">' +
    stipple("bladeR", (CX, BREAK_Y - 10, CX + 32, GUARD_Y),
            lambda x, y: 0.06 + 0.5 * ((x - CX) / 30) ** 1.6 * (0.5 + 0.5 * (y - BREAK_Y) / (GUARD_Y - BREAK_Y)),
            0.5, 1.0, 9000) + "</g>")
# arête centrale et gorge
add(f'<line x1="{CX}" y1="{BREAK_Y+8}" x2="{CX}" y2="{GUARD_Y}" stroke="{INK}" stroke-width="1.3"/>')
add(f'<line x1="{CX-9}" y1="{BREAK_Y+60}" x2="{CX-11}" y2="{GUARD_Y-70}" stroke="{INK}" stroke-width="0.8"/>')
# reflets de cassure
add(f'<polyline points="{pts([(CX-12, BREAK_Y+18), (CX-8, BREAK_Y+60)])}" fill="none" stroke="{INK}" stroke-width="0.8"/>')
add(f'<polyline points="{pts([(CX+6, BREAK_Y-6), (CX+4, BREAK_Y+40)])}" fill="none" stroke="{INK}" stroke-width="0.8"/>')
# inscription runique sur la lame (près de la garde)
for i in range(7):
    y = GUARD_Y - 150 + i * 15
    add(f'<path d="M{CX-5},{y} l-6,4 l6,4" fill="none" stroke="{INK}" stroke-width="0.9"/>')
add(f'<polygon points="{pts([(CX, GUARD_Y-170), (CX-7, GUARD_Y-160), (CX, GUARD_Y-150), (CX+7, GUARD_Y-160)])}" fill="#fff" stroke="{INK}" stroke-width="1"/>')

# ------------------------------------------------------------------ Anneau (face avant, devant la lame)
rim_front = (arc(CX, top_c, RX_, RY_, 0, math.pi) + " " +
             arc(CX, top_c, RIN_X, RIN_Y, math.pi, 0, move=False) + " Z")
band = (arc(CX, top_c, RX_, RY_, 0, math.pi) + " " +
        arc(CX, bot_c, RX_, RY_, math.pi, 0, move=False) + " Z")
defs.append(f'<clipPath id="band"><path d="{band}"/></clipPath>')
add(f'<path d="{band}" fill="#fff" stroke="{INK}" stroke-width="2.4"/>')
add(stipple("band", (CX-RX_, top_c, CX+RX_, bot_c+RY_),
            lambda x, y: min(0.95, 0.6 * max(0, (abs(x - CX) / RX_ - 0.8) / 0.2) ** 1.5 + 0.5 * max(0, (y - (RING_CY + RY_*math.sqrt(max(0, 1-((x-CX)/RX_)**2))) - 8) / 10)), 0.5, 1.1, 12000))
add(f'<path d="{rim_front}" fill="#fff" stroke="{INK}" stroke-width="1.6"/>')
add(f'<path d="{arc(CX, top_c, RIN_X, RIN_Y, math.radians(25), math.radians(155))}" fill="none" stroke="{INK}" stroke-width="0.7" stroke-dasharray="0.5 3" stroke-linecap="round"/>')
# côtés gauche/droit de la bande
for s in (-1, 1):
    add(f'<line x1="{CX+s*RX_}" y1="{top_c}" x2="{CX+s*RX_}" y2="{bot_c}" stroke="{INK}" stroke-width="2.4"/>')
# reflet
add(f'<path d="{arc(CX, RING_CY + 2, RX_ - 6, RY_ + 2, math.radians(105), math.radians(150), 30)}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>')


# inscription façon tengwar le long de la bande
def glyph(x, y, sx, h, kind):
    """Glyphe calligraphique : hampe + boucles + tehta. sx = compression horizontale."""
    p = []
    stem_up = kind % 3 == 0
    stem_dn = kind % 4 == 1
    y0 = y - h * (1.0 if stem_up else 0.45)
    y1 = y + h * (0.9 if stem_dn else 0.45)
    p.append(f"M{f(x)},{f(y0)} L{f(x)},{f(y1)}")
    nb = 1 + (kind % 2)
    for b in range(nb):
        bx = x + b * 4.2 * sx
        p.append(f"M{f(bx)},{f(y - h*0.42)} C{f(bx + 5.5*sx)},{f(y - h*0.55)} {f(bx + 5.5*sx)},{f(y + h*0.5)} {f(bx)},{f(y + h*0.38)}")
    if kind % 5 == 2:
        p.append(f"M{f(x - 1.5*sx)},{f(y - h*1.05)} q{f(3*sx)},{f(-3)} {f(6*sx)},0")
    g = f'<path d="{" ".join(p)}" fill="none" stroke="{INK}" stroke-width="{0.75 + 0.35*sx:.2f}" stroke-linecap="round"/>'
    if kind % 5 in (0, 3):
        g += f'<circle cx="{f(x + 2*sx)}" cy="{f(y - h*1.15)}" r="0.9" fill="{INK}"/>'
    return g


# Sur l'anneau : « ash nazg durbatulûk · ash nazg gimbatul »
S_RING, R_EFF, GAP = 0.155, 118, 34
w1 = INSCRIPTION["ring1"]["width"] * S_RING
w2 = INSCRIPTION["ring2"]["width"] * S_RING
a_start = math.pi / 2 + (w1 + w2 + GAP) / 2 / R_EFF


def ring_mapper(offset):
    def m(u, v):
        a = a_start - (offset + u) / R_EFF
        return CX + RX_ * math.cos(a), RING_CY + RY_ * math.sin(a) + v
    return m


ring_txt = (inscription_path("ring1", ring_mapper(0), S_RING) + " " +
            inscription_path("ring2", ring_mapper(w1 + GAP), S_RING))
add(f'<g clip-path="url(#band)"><path d="{ring_txt}" fill="{INK}"/></g>')
# petite étoile au centre de la bande
add(facet_star(CX, RING_CY + RY_ + 1, 7, 7, 1.8, n=4, sw=0.8))

# ------------------------------------------------------------------ Éclats flottants
shards = [
    (CX + 6, 448, 26, 62, 8),
    (CX - 24, 368, 19, 46, -16),
    (CX + 18, 300, 14, 34, 22),
    (CX - 6, 248, 9, 22, -34),
]
for (sx_, sy_, w, h, rot) in shards:
    poly = [(-w*0.5, h*0.5), (-w*0.35, -h*0.25), (w*0.1, -h*0.5), (w*0.5, -h*0.1), (w*0.4, h*0.45)]
    ridge = [(-w*0.05, h*0.48), (w*0.05, -h*0.45)]
    a = math.radians(rot)
    def T(p):
        return (sx_ + p[0]*math.cos(a) - p[1]*math.sin(a), sy_ + p[0]*math.sin(a) + p[1]*math.cos(a))
    P = [T(p) for p in poly]
    R = [T(p) for p in ridge]
    add(f'<polygon points="{pts(P)}" fill="#fff" stroke="{INK}" stroke-width="1.8" stroke-linejoin="miter"/>')
    add(f'<polygon points="{pts([R[0], R[1], P[3], P[4]])}" fill="{INK}" opacity="0.88"/>')
    # étincelles
    for _ in range(3):
        ex, ey = sx_ + random.uniform(-38, 38), sy_ + random.uniform(-30, 30)
        add(f'<circle cx="{f(ex)}" cy="{f(ey)}" r="{random.uniform(0.8, 1.8):.2f}" fill="{INK}"/>')
for (ex, ey) in ((CX - 40, 470), (CX + 44, 410), (CX - 36, 300)):
    add(facet_star(ex, ey, 6, 6, 1.4, n=4, sw=0.7))

# ------------------------------------------------------------------ Garde
G = GUARD_Y
guard_d = (f"M{CX-30},{G} "
           f"C{CX-70},{G-6} {CX-110},{G-2} {CX-140},{G+10} "
           f"C{CX-160},{G+18} {CX-168},{G+34} {CX-160},{G+52} "
           f"C{CX-156},{G+38} {CX-150},{G+30} {CX-136},{G+28} "
           f"C{CX-104},{G+24} {CX-70},{G+30} {CX-40},{G+40} "
           f"L{CX-22},{G+62} L{CX+22},{G+62} L{CX+40},{G+40} "
           f"C{CX+70},{G+30} {CX+104},{G+24} {CX+136},{G+28} "
           f"C{CX+150},{G+30} {CX+156},{G+38} {CX+160},{G+52} "
           f"C{CX+168},{G+34} {CX+160},{G+18} {CX+140},{G+10} "
           f"C{CX+110},{G-2} {CX+70},{G-6} {CX+30},{G} Z")
defs.append(f'<clipPath id="guard"><path d="{guard_d}"/></clipPath>')
add(f'<path d="{guard_d}" fill="#fff" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>')
add(stipple("guard", (CX-170, G-10, CX+170, G+64),
            lambda x, y: 0.75 * max(0, (y - G - 18) / 40) ** 1.4, 0.5, 1.1, 8000))
# filet intérieur des quillons
for s in (-1, 1):
    add(f'<path d="M{CX+s*44},{G+18} C{CX+s*80},{G+10} {CX+s*115},{G+10} {CX+s*142},{G+20}" fill="none" stroke="{INK}" stroke-width="0.9"/>')
# écusson central avec gemme
crest = [(CX, G - 44), (CX - 26, G + 6), (CX - 18, G + 40), (CX, G + 70), (CX + 18, G + 40), (CX + 26, G + 6)]
add(f'<polygon points="{pts(crest)}" fill="#fff" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>')
add(f'<polygon points="{pts([(CX, G-44), (CX, G+70), (CX+18, G+40), (CX+26, G+6)])}" fill="{INK}"/>')
add(f'<polygon points="{pts([(CX, G-30), (CX-15, G+8), (CX-10, G+36), (CX, G+54)])}" fill="none" stroke="{INK}" stroke-width="0.8"/>')
add(facet_star(CX, G + 12, 13, 13, 3, n=4, sw=1))
add(f'<circle cx="{CX}" cy="{G+12}" r="2" fill="#fff"/>')

# ------------------------------------------------------------------ Poignée (cuir tressé)
GR0, GR1, GW = G + 70, G + 245, 17
add(f'<rect x="{CX-GW}" y="{GR0}" width="{GW*2}" height="{GR1-GR0}" rx="5" fill="{INK}"/>')
step = 17
for i in range(int((GR1 - GR0) / step)):
    y = GR0 + i * step
    add(f'<path d="M{CX-GW+2},{y+3} Q{CX},{y+step*0.9} {CX+GW-2},{y+step-2}" fill="none" stroke="#fff" stroke-width="1.6"/>')
    add(f'<path d="M{CX-GW+4},{y+5} Q{CX-4},{y+step*0.75} {CX+2},{y+step-3}" fill="none" stroke="#fff" stroke-width="0.7" opacity="0.8"/>')
add(f'<line x1="{CX-GW+4}" y1="{GR0+4}" x2="{CX-GW+4}" y2="{GR1-4}" stroke="#fff" stroke-width="1" opacity="0.6"/>')
# bagues
for y in (GR0, GR1):
    add(f'<rect x="{CX-GW-4}" y="{y-5}" width="{(GW+4)*2}" height="10" rx="3" fill="#fff" stroke="{INK}" stroke-width="2"/>')
    add(f'<line x1="{CX-GW}" y1="{y}" x2="{CX+GW}" y2="{y}" stroke="{INK}" stroke-width="0.8"/>')

# ------------------------------------------------------------------ Pommeau
P0 = GR1 + 5
pommel_d = (f"M{CX-14},{P0} C{CX-40},{P0+20} {CX-34},{P0+56} {CX-12},{P0+78} "
            f"L{CX},{P0+108} L{CX+12},{P0+78} "
            f"C{CX+34},{P0+56} {CX+40},{P0+20} {CX+14},{P0} Z")
add(f'<path d="{pommel_d}" fill="#fff" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>')
add(f'<path d="M{CX},{P0} L{CX},{P0+108} L{CX+12},{P0+78} C{CX+34},{P0+56} {CX+40},{P0+20} {CX+14},{P0} Z" fill="{INK}"/>')
add(f'<path d="M{CX-6},{P0+14} C{CX-24},{P0+30} {CX-20},{P0+56} {CX-6},{P0+70}" fill="none" stroke="{INK}" stroke-width="0.9"/>')
add(facet_star(CX, P0 + 40, 10, 10, 2.4, n=4, sw=0.9))
add(f'<circle cx="{CX}" cy="{P0+40}" r="1.6" fill="#fff"/>')
# étoile finale
add(facet_star(CX, 1455, 14, 7, 2.6, n=4, sw=1))

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
       f'<defs>{"".join(defs)}</defs><rect width="100%" height="100%" fill="#fff"/>'
       + "".join(out) + "</svg>")
open(__file__.replace("generate.py", "narsil-anneau.svg"), "w").write(svg)
print("ok", len(svg))
