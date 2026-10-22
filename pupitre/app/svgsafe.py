"""Filtro de seguridad para los diagramas SVG que genera la IA.

Un SVG puede contener código ejecutable (<script>, atributos on*, enlaces javascript:, <foreignObject>
con HTML, referencias externas...). Aquí se reconstruye el dibujo desde cero con una lista cerrada de
elementos y atributos geométricos. Todo lo demás se descarta. La interacción no viene de la IA: el
dibujo solo puede marcar elementos con data-paso (mostrar por pasos) y data-info (explicación al
tocar), y es la app la que añade ese comportamiento.
"""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET

SVG_NS = "http://www.w3.org/2000/svg"
MAX_CHARS = 14000
MAX_ELEMENTS = 90

ALLOWED_TAGS = {"svg", "g", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text",
                "tspan", "defs", "marker", "title"}
GEOMETRY = {"x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "dx", "dy",
            "points", "d", "transform", "viewBox", "refX", "refY", "markerWidth", "markerHeight", "orient",
            "markerUnits"}
PAINT = {"fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "opacity",
         "fill-opacity", "stroke-opacity", "font-size", "font-weight", "font-style", "text-anchor",
         "dominant-baseline", "marker-end", "marker-start", "rotate"}
OWN = {"id", "data-paso", "data-info"}
ALLOWED_ATTRS = GEOMETRY | PAINT | OWN

_NUMERIC_LIST = re.compile(r"^[\d\s.,eE+\-%]*$")
_PATH = re.compile(r"^[MmLlHhVvCcSsQqTtAaZz\d\s.,eE+\-]*$")
_TRANSFORM = re.compile(r"^(\s*(translate|rotate|scale)\(\s*[-\d.,\s]+\)\s*)+$")
_COLOR = re.compile(r"^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20}|none|currentColor|rgba?\([\d\s.,%]+\))$")
_URL_REF = re.compile(r"^url\(#[A-Za-z][\w-]{0,40}\)$")
_ID = re.compile(r"^[A-Za-z][\w-]{0,40}$")
_WORD = re.compile(r"^[A-Za-z\-]{1,20}$")


def _value_ok(name: str, value: str) -> bool:
    v = value.strip()
    if not v or len(v) > 2000 or "javascript" in v.lower() or "expression" in v.lower():
        return False
    if name == "d":
        return bool(_PATH.match(v))
    if name in ("points", "viewBox", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width",
                "height", "dx", "dy", "stroke-width", "stroke-dasharray", "opacity", "fill-opacity",
                "stroke-opacity", "refX", "refY", "markerWidth", "markerHeight", "rotate", "font-size"):
        return bool(_NUMERIC_LIST.match(v.replace("px", "")))
    if name == "transform":
        return bool(_TRANSFORM.match(v))
    if name in ("fill", "stroke"):
        return bool(_COLOR.match(v) or _URL_REF.match(v))
    if name in ("marker-end", "marker-start"):
        return bool(_URL_REF.match(v))
    if name == "id":
        return bool(_ID.match(v))
    if name == "data-paso":
        return v.isdigit() and 0 < int(v) < 20
    if name == "data-info":
        return len(v) <= 240
    return bool(_WORD.match(v)) or (name == "orient" and v in ("auto", "auto-start-reverse"))


def _local(tag: str) -> str | None:
    if tag.startswith("{"):
        ns, _, name = tag[1:].partition("}")
        return name if ns == SVG_NS else None
    return tag


def sanitize_svg(raw: str | None) -> str | None:
    """Devuelve un SVG seguro o None si no se puede aprovechar."""
    if not raw or not isinstance(raw, str):
        return None
    raw = raw.strip()
    m = re.search(r"<svg\b.*</svg>", raw, re.S | re.I)
    if not m or len(m.group(0)) > MAX_CHARS:
        return None
    src = m.group(0)
    if re.search(r"<!DOCTYPE|<!ENTITY|<\?xml-stylesheet", src, re.I):
        return None
    if "xmlns=" not in src[:300]:
        src = src.replace("<svg", f'<svg xmlns="{SVG_NS}"', 1)
    try:
        root = ET.fromstring(src)
    except ET.ParseError:
        return None
    if _local(root.tag) != "svg":
        return None

    count = [0]

    def build(node: ET.Element) -> ET.Element | None:
        name = _local(node.tag)
        if name not in ALLOWED_TAGS:
            return None
        count[0] += 1
        if count[0] > MAX_ELEMENTS:
            return None
        out = ET.Element(f"{{{SVG_NS}}}{name}")
        for k, v in node.attrib.items():
            key = _local(k) if k.startswith("{") else k
            if key in ALLOWED_ATTRS and _value_ok(key, v):
                out.set(key, v.strip())
        if name in ("text", "tspan", "title") and node.text:
            out.text = node.text[:300]
        for child in node:
            built = build(child)
            if built is not None:
                out.append(built)
            if name in ("text", "tspan") and child.tail:
                (out[-1] if len(out) else out).tail = child.tail[:300]
        return out

    clean = build(root)
    if clean is None or len(clean) == 0:
        return None
    # El lienzo lo controla la app: tamaño adaptable y relación de aspecto conservada.
    for attr in ("width", "height", "x", "y"):
        clean.attrib.pop(attr, None)
    if "viewBox" not in clean.attrib:
        clean.set("viewBox", "0 0 400 240")
    clean.set("role", "img")
    ET.register_namespace("", SVG_NS)
    return ET.tostring(clean, encoding="unicode")
