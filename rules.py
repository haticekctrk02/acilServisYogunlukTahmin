"""
En az 15 IF-THEN kuralı — acil servis personel artırımı bulanık kontrolcü.
"""
from skfuzzy import control as ctrl


RULE_DEFINITIONS: list[dict] = [
    {
        "text": "IF yoğunluk Yüksek AND aciliyet Kritik AND hemşire Yetersiz THEN personel Yüksek",
        "antecedents": [
            {"var": "yogunluk", "term": "yuksek"},
            {"var": "aciliyet", "term": "kritik"},
            {"var": "hemsire_orani", "term": "yetersiz"},
        ],
        "consequent": ("personel_artirimi", "yuksek"),
    },
    {
        "text": "IF yoğunluk Yüksek AND bekleme Uzun THEN personel Yüksek",
        "antecedents": [
            {"var": "yogunluk", "term": "yuksek"},
            {"var": "bekleme_suresi", "term": "uzun"},
        ],
        "consequent": ("personel_artirimi", "yuksek"),
    },
    {
        "text": "IF aciliyet Kritik AND bekleme Uzun THEN personel Yüksek",
        "antecedents": [
            {"var": "aciliyet", "term": "kritik"},
            {"var": "bekleme_suresi", "term": "uzun"},
        ],
        "consequent": ("personel_artirimi", "yuksek"),
    },
    {
        "text": "IF yoğunluk Yüksek AND hemşire Yetersiz THEN personel Yüksek",
        "antecedents": [
            {"var": "yogunluk", "term": "yuksek"},
            {"var": "hemsire_orani", "term": "yetersiz"},
        ],
        "consequent": ("personel_artirimi", "yuksek"),
    },
    {
        "text": "IF yoğunluk Orta AND aciliyet Kritik THEN personel Yüksek",
        "antecedents": [
            {"var": "yogunluk", "term": "orta"},
            {"var": "aciliyet", "term": "kritik"},
        ],
        "consequent": ("personel_artirimi", "yuksek"),
    },
    {
        "text": "IF yoğunluk Orta AND bekleme Orta AND hemşire Yetersiz THEN personel Orta",
        "antecedents": [
            {"var": "yogunluk", "term": "orta"},
            {"var": "bekleme_suresi", "term": "orta"},
            {"var": "hemsire_orani", "term": "yetersiz"},
        ],
        "consequent": ("personel_artirimi", "orta"),
    },
    {
        "text": "IF yoğunluk Orta AND aciliyet Orta THEN personel Orta",
        "antecedents": [
            {"var": "yogunluk", "term": "orta"},
            {"var": "aciliyet", "term": "orta"},
        ],
        "consequent": ("personel_artirimi", "orta"),
    },
    {
        "text": "IF bekleme Orta AND hemşire Yeterli THEN personel Orta",
        "antecedents": [
            {"var": "bekleme_suresi", "term": "orta"},
            {"var": "hemsire_orani", "term": "yeterli"},
        ],
        "consequent": ("personel_artirimi", "orta"),
    },
    {
        "text": "IF yoğunluk Yüksek AND hemşire Yeterli THEN personel Orta",
        "antecedents": [
            {"var": "yogunluk", "term": "yuksek"},
            {"var": "hemsire_orani", "term": "yeterli"},
        ],
        "consequent": ("personel_artirimi", "orta"),
    },
    {
        "text": "IF aciliyet Orta AND bekleme Uzun THEN personel Orta",
        "antecedents": [
            {"var": "aciliyet", "term": "orta"},
            {"var": "bekleme_suresi", "term": "uzun"},
        ],
        "consequent": ("personel_artirimi", "orta"),
    },
    {
        "text": "IF yoğunluk Düşük AND aciliyet Düşük THEN personel Düşük",
        "antecedents": [
            {"var": "yogunluk", "term": "dusuk"},
            {"var": "aciliyet", "term": "dusuk"},
        ],
        "consequent": ("personel_artirimi", "dusuk"),
    },
    {
        "text": "IF yoğunluk Düşük AND bekleme Kısa AND hemşire İyi THEN personel Düşük",
        "antecedents": [
            {"var": "yogunluk", "term": "dusuk"},
            {"var": "bekleme_suresi", "term": "kisa"},
            {"var": "hemsire_orani", "term": "iyi"},
        ],
        "consequent": ("personel_artirimi", "dusuk"),
    },
    {
        "text": "IF aciliyet Düşük AND hemşire İyi THEN personel Düşük",
        "antecedents": [
            {"var": "aciliyet", "term": "dusuk"},
            {"var": "hemsire_orani", "term": "iyi"},
        ],
        "consequent": ("personel_artirimi", "dusuk"),
    },
    {
        "text": "IF yoğunluk Düşük AND bekleme Kısa THEN personel Düşük",
        "antecedents": [
            {"var": "yogunluk", "term": "dusuk"},
            {"var": "bekleme_suresi", "term": "kisa"},
        ],
        "consequent": ("personel_artirimi", "dusuk"),
    },
    {
        "text": "IF yoğunluk Orta AND hemşire İyi AND bekleme Kısa THEN personel Düşük",
        "antecedents": [
            {"var": "yogunluk", "term": "orta"},
            {"var": "hemsire_orani", "term": "iyi"},
            {"var": "bekleme_suresi", "term": "kisa"},
        ],
        "consequent": ("personel_artirimi", "dusuk"),
    },
    {
        "text": "IF aciliyet Kritik AND hemşire Yeterli AND yoğunluk Orta THEN personel Yüksek",
        "antecedents": [
            {"var": "aciliyet", "term": "kritik"},
            {"var": "hemsire_orani", "term": "yeterli"},
            {"var": "yogunluk", "term": "orta"},
        ],
        "consequent": ("personel_artirimi", "yuksek"),
    },
    {
        "text": "IF bekleme Uzun AND hemşire Yetersiz THEN personel Yüksek",
        "antecedents": [
            {"var": "bekleme_suresi", "term": "uzun"},
            {"var": "hemsire_orani", "term": "yetersiz"},
        ],
        "consequent": ("personel_artirimi", "yuksek"),
    },
    {
        "text": "IF yoğunluk Düşük AND aciliyet Orta THEN personel Orta",
        "antecedents": [
            {"var": "yogunluk", "term": "dusuk"},
            {"var": "aciliyet", "term": "orta"},
        ],
        "consequent": ("personel_artirimi", "orta"),
    },
]


def build_rules(yogunluk, aciliyet, hemsire_orani, bekleme_suresi, personel_artirimi):
    """RULE_DEFINITIONS listesinden skfuzzy Rule nesneleri üretir."""
    var_map = {
        "yogunluk": yogunluk,
        "aciliyet": aciliyet,
        "hemsire_orani": hemsire_orani,
        "bekleme_suresi": bekleme_suresi,
        "personel_artirimi": personel_artirimi,
    }
    rules = []
    for rule_def in RULE_DEFINITIONS:
        antecedent = None
        for ant in rule_def["antecedents"]:
            v = var_map[ant["var"]]
            term = ant["term"]
            clause = v[term]
            antecedent = clause if antecedent is None else antecedent & clause
        cons_var, cons_term = rule_def["consequent"]
        consequent = var_map[cons_var][cons_term]
        rules.append(ctrl.Rule(antecedent, consequent))
    return rules
