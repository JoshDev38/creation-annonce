"""Génère le tatouage « Narsil & l'Anneau Unique » en SVG (fine line + dotwork)."""
import math, random

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
    return max(0, 1 - abs(r - 186) / 52) ** 1.8 * 0.7
add(stipple("halo", (CX - 240, RING_CY - 240, CX + 240, RING_CY + 240), halo_d, 0.5, 1.2, 26000))
add(f'<circle cx="{CX}" cy="{RING_CY}" r="170" fill="none" stroke="{INK}" stroke-width="1.1"/>')
add(f'<circle cx="{CX}" cy="{RING_CY}" r="246" fill="none" stroke="{INK}" stroke-width="0.6" stroke-dasharray="1.5 6" stroke-linecap="round"/>')

# ------------------------------------------------------------------ vignes elfiques (côtés supérieurs)
def leaf(x, y, ang, L, Wd):
    ca, sa = math.cos(ang), math.sin(ang)
    tip = (x + ca * L, y + sa * L)
    nx, ny = -sa, ca
    m = (x + ca * L * 0.45, y + sa * L * 0.45)
    c1 = (m[0] + nx * Wd, m[1] + ny * Wd)
    c2 = (m[0] - nx * Wd, m[1] - ny * Wd)
    d = (f"M{f(x)},{f(y)} Q{f(c1[0])},{f(c1[1])} {f(tip[0])},{f(tip[1])} "
         f"Q{f(c2[0])},{f(c2[1])} {f(x)},{f(y)}Z")
    half = (f"M{f(x)},{f(y)} Q{f(c1[0])},{f(c1[1])} {f(tip[0])},{f(tip[1])}Z")
    return (f'<path d="{d}" fill="#fff" stroke="{INK}" stroke-width="1.1"/>'
            f'<path d="{half}" fill="{INK}"/>')


def vine(a, b, side, n_leaves):
    """Tige ondulée parallèle à l'arête a→b, décalée vers l'intérieur."""
    ex, ey = b[0] - a[0], b[1] - a[1]
    Ln = math.hypot(ex, ey)
    ux, uy = ex / Ln, ey / Ln
    nx, ny = -uy * side, ux * side
    path, P = [], []
    for i in range(0, 121):
        t = i / 120
        wave = math.sin(t * math.pi * 4) * 4 * math.sin(t * math.pi)
        off = 20 + wave
        x = a[0] + ex * t + nx * off
        y = a[1] + ey * t + ny * off
        P.append((x, y, t))
        path.append(f"{'M' if i == 0 else 'L'}{f(x)},{f(y)}")
    taper = []
    add(f'<path d="{" ".join(path)}" fill="none" stroke="{INK}" stroke-width="1.3" stroke-linecap="round"/>')
    base = math.atan2(uy, ux)
    for k in range(n_leaves):
        t = (k + 0.7) / (n_leaves + 0.4)
        x, y, _ = P[int(t * 120)]
        s = 1 if k % 2 == 0 else -1
        size = 15 + 9 * math.sin(t * math.pi)
        add(leaf(x, y, base + s * 0.75 * side, size, size * 0.38))
    # vrille terminale en spirale
    x, y, _ = P[-1]
    sp = []
    for i in range(60):
        th = i / 59 * 4.4
        r = 11 * (1 - i / 66)
        sp.append(f"{'M' if i == 0 else 'L'}{f(x + r*math.cos(th+base) - 11*math.cos(base))},{f(y + r*math.sin(th+base) - 11*math.sin(base))}")
    add(f'<path d="{" ".join(sp)}" fill="none" stroke="{INK}" stroke-width="1" stroke-linecap="round"/>')
    for k in range(5):
        t = 1.05 + k * 0.035
        add(f'<circle cx="{f(a[0]+ex*t+nx*20)}" cy="{f(a[1]+ey*t+ny*20)}" r="{1.6 - k*0.25:.2f}" fill="{INK}"/>')


A_top = edge_point(inner[0], inner[3], 0.30)
A_end = edge_point(inner[0], inner[3], 0.80)
vine(A_top, A_end, -1, 6)
B_top = edge_point(inner[0], inner[1], 0.30)
B_end = edge_point(inner[0], inner[1], 0.80)
vine(B_top, B_end, 1, 6)

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

# ------------------------------------------------------------------ Anneau (face arrière, derrière la lame)
RX_, RY_, TH = 160, 50, 30        # demi-axes, épaisseur de la bande
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
            lambda x, y: min(0.95, 0.85 * max(0, (abs(x - CX) / RX_ - 0.55) / 0.45) ** 1.5 + 0.5 * max(0, (y - (RING_CY + RY_*math.sqrt(max(0, 1-((x-CX)/RX_)**2))) - 8) / 10)), 0.5, 1.1, 12000))
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


def elvish_script(a0, a1, seed):
    """Écriture cursive façon tengwar : boucles enchaînées, hampes et tehtar, projetées sur la bande."""
    rnd = random.Random(seed)
    def P(a, eta):
        return (CX + RX_ * math.cos(a), RING_CY + 1 + RY_ * math.sin(a) + eta)
    n = 900
    loops = int((a1 - a0) / math.radians(3.2))
    amps = [rnd.uniform(0.55, 1.0) for _ in range(loops + 2)]
    lw = [rnd.choice((0.2, 0.5, 1.0, 1.4, 1.7)) for _ in range(loops + 2)]
    tall = {i: rnd.choice((-1, 1)) for i in range(loops) if rnd.random() < 0.22}
    d = []
    for i in range(n + 1):
        u = i / n
        k = u * loops
        j = int(k)
        ph = (k - j) * 2 * math.pi
        a = a0 + (a1 - a0) * u + math.radians(1.25) * lw[j] * math.sin(ph)
        amp = amps[j] * (1 - (k - j)) + amps[j + 1] * (k - j)
        eta = -6.2 * amp * math.cos(ph)
        if j in tall and math.cos(ph) > 0.6:
            eta += tall[j] * 6 * (math.cos(ph) - 0.6) / 0.4
        x, y = P(a, eta)
        d.append(f"{'M' if i == 0 else 'L'}{f(x)},{f(y)}")
    g = [f'<path d="{" ".join(d)}" fill="none" stroke="{INK}" stroke-width="1.05" stroke-linejoin="round" stroke-linecap="round"/>']
    for j in range(loops):
        if rnd.random() < 0.3:
            a = a0 + (a1 - a0) * (j + 0.5) / loops
            x, y = P(a, -10.5)
            if rnd.random() < 0.5:
                g.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="0.95" fill="{INK}"/>')
            else:
                w = 2.6 * max(0.3, math.sin(a))
                g.append(f'<path d="M{f(x-w)},{f(y+1)} q{f(w)},-3 {f(2*w)},0" fill="none" stroke="{INK}" stroke-width="0.8"/>')
    return "".join(g)


add(elvish_script(math.radians(12), math.radians(84), 3))
add(elvish_script(math.radians(96), math.radians(168), 11))
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
