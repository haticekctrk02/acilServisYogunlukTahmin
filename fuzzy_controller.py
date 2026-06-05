"""
Acil servis personel artırımı — Mamdani bulanık kontrolcü.
Centroid (ağırlık merkezi) durulaştırma.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

from rules import RULE_DEFINITIONS, build_rules


@dataclass
class FuzzyInputs:
    yogunluk: float       # 0-100 hasta doluluk %
    aciliyet: float       # 0-10 triyaj skoru
    hemsire_orani: float  # 0-1 hemşire/hasta oranı
    bekleme_suresi: float # 0-180 dakika


@dataclass
class FuzzyResult:
    personel_artirimi: float
    rule_activations: list[dict]
    input_memberships: dict[str, dict[str, float]]
    output_membership_curve: tuple[np.ndarray, np.ndarray]
    centroid_x: float


class ERPersonelFuzzyController:
    """Bulanık kontrolcü: bulanıklaştırma → çıkarım → centroid durulaştırma."""

    INPUT_LABELS = {
        "yogunluk": "Hasta Yoğunluğu (%)",
        "aciliyet": "Aciliyet Skoru",
        "hemsire_orani": "Hemşire/Hasta Oranı",
        "bekleme_suresi": "Bekleme Süresi (dk)",
    }

    TERM_LABELS = {
        "dusuk": "Düşük",
        "orta": "Orta",
        "yuksek": "Yüksek",
        "kritik": "Kritik",
        "yetersiz": "Yetersiz",
        "yeterli": "Yeterli",
        "iyi": "İyi",
        "kisa": "Kısa",
        "uzun": "Uzun",
    }

    def __init__(self) -> None:
        self._build_system()

    def _build_system(self) -> None:
        self.yogunluk = ctrl.Antecedent(np.arange(0, 101, 1), "yogunluk")
        self.aciliyet = ctrl.Antecedent(np.arange(0, 10.1, 0.1), "aciliyet")
        self.hemsire_orani = ctrl.Antecedent(np.arange(0, 1.01, 0.01), "hemsire_orani")
        self.bekleme_suresi = ctrl.Antecedent(np.arange(0, 181, 1), "bekleme_suresi")
        self.personel_artirimi = ctrl.Consequent(np.arange(0, 101, 1), "personel_artirimi")

        self.yogunluk["dusuk"] = fuzz.trimf(self.yogunluk.universe, [0, 0, 40])
        self.yogunluk["orta"] = fuzz.trimf(self.yogunluk.universe, [25, 50, 75])
        self.yogunluk["yuksek"] = fuzz.trimf(self.yogunluk.universe, [60, 100, 100])

        self.aciliyet["dusuk"] = fuzz.trimf(self.aciliyet.universe, [0, 0, 4])
        self.aciliyet["orta"] = fuzz.trimf(self.aciliyet.universe, [2.5, 5, 7.5])
        self.aciliyet["kritik"] = fuzz.trimf(self.aciliyet.universe, [6, 10, 10])

        self.hemsire_orani["yetersiz"] = fuzz.trimf(self.hemsire_orani.universe, [0, 0, 0.4])
        self.hemsire_orani["yeterli"] = fuzz.trimf(self.hemsire_orani.universe, [0.25, 0.5, 0.75])
        self.hemsire_orani["iyi"] = fuzz.trimf(self.hemsire_orani.universe, [0.6, 1, 1])

        self.bekleme_suresi["kisa"] = fuzz.trimf(self.bekleme_suresi.universe, [0, 0, 60])
        self.bekleme_suresi["orta"] = fuzz.trimf(self.bekleme_suresi.universe, [40, 90, 140])
        self.bekleme_suresi["uzun"] = fuzz.trimf(self.bekleme_suresi.universe, [120, 180, 180])

        self.personel_artirimi["dusuk"] = fuzz.trimf(self.personel_artirimi.universe, [0, 0, 40])
        self.personel_artirimi["orta"] = fuzz.trimf(self.personel_artirimi.universe, [25, 50, 75])
        self.personel_artirimi["yuksek"] = fuzz.trimf(self.personel_artirimi.universe, [60, 100, 100])

        self.rules = build_rules(
            self.yogunluk,
            self.aciliyet,
            self.hemsire_orani,
            self.bekleme_suresi,
            self.personel_artirimi,
        )
        self.system = ctrl.ControlSystem(self.rules)
        self.sim = ctrl.ControlSystemSimulation(self.system)

    def _membership_at(self, var: ctrl.Antecedent | ctrl.Consequent, term: str, value: float) -> float:
        mf = var[term].mf
        universe = var.universe
        idx = int(np.argmin(np.abs(universe - value)))
        return float(mf[idx])

    def _input_memberships(self, inputs: FuzzyInputs) -> dict[str, dict[str, float]]:
        return {
            "yogunluk": {
                t: self._membership_at(self.yogunluk, t, inputs.yogunluk)
                for t in ("dusuk", "orta", "yuksek")
            },
            "aciliyet": {
                t: self._membership_at(self.aciliyet, t, inputs.aciliyet)
                for t in ("dusuk", "orta", "kritik")
            },
            "hemsire_orani": {
                t: self._membership_at(self.hemsire_orani, t, inputs.hemsire_orani)
                for t in ("yetersiz", "yeterli", "iyi")
            },
            "bekleme_suresi": {
                t: self._membership_at(self.bekleme_suresi, t, inputs.bekleme_suresi)
                for t in ("kisa", "orta", "uzun")
            },
        }

    def _evaluate_rule_strength(
        self,
        rule_def: dict,
        memberships: dict[str, dict[str, float]],
    ) -> float:
        strengths: list[float] = []
        for ant in rule_def["antecedents"]:
            var, term = ant["var"], ant["term"]
            strengths.append(memberships[var][term])
        if not strengths:
            return 0.0
        return float(min(strengths))

    def compute(self, inputs: FuzzyInputs) -> FuzzyResult:
        self.sim.input["yogunluk"] = inputs.yogunluk
        self.sim.input["aciliyet"] = inputs.aciliyet
        self.sim.input["hemsire_orani"] = inputs.hemsire_orani
        self.sim.input["bekleme_suresi"] = inputs.bekleme_suresi
        self.sim.compute()

        output_val = float(self.sim.output["personel_artirimi"])
        memberships = self._input_memberships(inputs)

        activations = []
        for i, rule_def in enumerate(RULE_DEFINITIONS, start=1):
            strength = self._evaluate_rule_strength(rule_def, memberships)
            activations.append(
                {
                    "id": i,
                    "text": rule_def["text"],
                    "strength": round(strength, 4),
                    "active": strength > 0.01,
                }
            )
        activations.sort(key=lambda r: r["strength"], reverse=True)

        universe = self.personel_artirimi.universe
        aggregated = np.fmax(
            self.personel_artirimi["dusuk"].mf,
            np.fmax(
                self.personel_artirimi["orta"].mf,
                self.personel_artirimi["yuksek"].mf,
            ),
        )
        centroid = output_val

        return FuzzyResult(
            personel_artirimi=round(output_val, 2),
            rule_activations=activations,
            input_memberships=memberships,
            output_membership_curve=(universe, aggregated.copy()),
            centroid_x=centroid,
        )

    def get_antecedent_plot_data(self, var_name: str) -> tuple[np.ndarray, dict[str, np.ndarray]]:
        var = getattr(self, var_name)
        terms = {t: var[t].mf for t in var.terms}
        return var.universe, terms

    def get_consequent_plot_data(self) -> tuple[np.ndarray, dict[str, np.ndarray]]:
        terms = {t: self.personel_artirimi[t].mf for t in self.personel_artirimi.terms}
        return self.personel_artirimi.universe, terms
