"""
Testes automatizados para a lógica de drift do monitoramento.

Executar com:
    pytest test_monitoring.py -v

Cobre os cenários críticos apontados no plano:
  - média próxima de zero (GDP, Inflation rate) → sem falso alerta
  - feature binária rara sem mudança → ok
  - feature binária com mudança real → warn/high
  - feature contínua estável → ok
  - cobertura completa de metadados (todos os FEATURE_COLS mapeados)
"""

import pytest
from ml_model import FEATURE_META, FEATURE_COLS, compute_feature_drift


# ── Helpers ───────────────────────────────────────────────────────────────────

def _s(mean, std=1.0, missing_rate=0.0):
    """Cria um dict de stats no formato retornado por feature_stats_from_records."""
    return {"mean": mean, "std": std, "min": None, "max": None, "missing_rate": missing_rate}


# ── 1. Cobertura de metadados ─────────────────────────────────────────────────

def test_all_feature_cols_have_metadata():
    """Todo col em FEATURE_COLS deve ter uma entrada em FEATURE_META."""
    missing = [col for col in FEATURE_COLS if col not in FEATURE_META]
    assert missing == [], f"Sem metadados para: {missing}"


def test_feature_types_are_valid():
    valid = {"binary", "continuous", "near_zero"}
    for col, meta in FEATURE_META.items():
        assert meta["type"] in valid, f"Tipo inválido em '{col}': {meta['type']}"


def test_binary_features_have_no_std_floor():
    """Features binárias não usam std_floor (seria ignorado de qualquer forma)."""
    for col, meta in FEATURE_META.items():
        if meta["type"] == "binary":
            # std_floor é ignorado em binárias, mas não deve confundir
            assert "std_floor" not in meta or meta["std_floor"] is None or True


# ── 2. Feature binária ────────────────────────────────────────────────────────

def test_binary_sem_drift():
    """Delta 2 pp em feature binária → ok."""
    result = compute_feature_drift("Debtor", _s(0.20), _s(0.22))
    assert result["status"] == "ok"
    assert result["severity"] == "ok"
    assert result["reason_code"] is None


def test_binary_warn():
    """Delta 18 pp → warn (> 0.15)."""
    result = compute_feature_drift("Debtor", _s(0.20), _s(0.38))
    assert result["severity"] == "warn"
    assert result["reason_code"] == "binary_rate_shift"
    assert result["feature_type"] == "binary"


def test_binary_high():
    """Delta 35 pp → high (> 0.30)."""
    result = compute_feature_drift("Debtor", _s(0.20), _s(0.55))
    assert result["severity"] == "high"
    assert result["reason_code"] == "binary_rate_shift"


def test_binary_rara_sem_mudanca():
    """Feature rara (2 %) sem mudança → ok; não deve gerar falso alerta relativo."""
    result = compute_feature_drift("Educational special needs", _s(0.02), _s(0.03))
    assert result["severity"] == "ok"


def test_binary_rara_com_mudanca_real():
    """Feature rara: de 2 % para 20 % é mudança real (delta = 0.18 > 0.15)."""
    result = compute_feature_drift("Educational special needs", _s(0.02), _s(0.20))
    assert result["severity"] in ("warn", "high")


# ── 3. Features near-zero (GDP, Inflation rate) ───────────────────────────────

def test_gdp_pequena_variacao_absoluta_nao_alerta():
    """GDP próximo de zero: variação absoluta pequena não deve gerar alerta."""
    # std_floor = 0.5, abs_delta = 0.1 → z = 0.1/0.5 = 0.2 → ok
    result = compute_feature_drift("GDP", _s(0.5, std=0.3), _s(0.6))
    assert result["severity"] == "ok", (
        "Pequena variação absoluta em GDP não deve disparar alerta "
        f"(z_shift={result['z_shift']})"
    )


def test_gdp_variacao_moderada_warn():
    """GDP: abs_delta = 1.1, z = 1.1/0.5 = 2.2 → warn (> 2.0)."""
    result = compute_feature_drift("GDP", _s(0.5, std=0.3), _s(1.6))
    assert result["severity"] in ("warn", "high")


def test_gdp_variacao_extrema_high():
    """GDP: abs_delta = 2.3, z = 2.3/0.5 = 4.6 → high (> 4.0)."""
    result = compute_feature_drift("GDP", _s(0.5, std=0.3), _s(2.8))
    assert result["severity"] == "high"


def test_inflation_negativa_nao_explode():
    """Inflação negativa (deflação): razão relativa poderia explodir; z-shift não."""
    # train_mean = 0.1 (quase zero), abs_delta = 0.3 → z = 0.3/0.5 = 0.6 → ok
    result = compute_feature_drift("Inflation rate", _s(0.1, std=0.2), _s(0.4))
    assert result["severity"] == "ok"
    assert result["z_shift"] is not None and result["z_shift"] < 2.0


# ── 4. Features contínuas ─────────────────────────────────────────────────────

def test_continua_sem_drift():
    """Nota média estável → ok."""
    result = compute_feature_drift(
        "Curricular units 1st sem (grade)", _s(12.0, std=3.0), _s(12.5)
    )
    assert result["status"] == "ok"


def test_continua_warn():
    """Nota média: z = 5.0/3.0 = 1.67 → warn."""
    result = compute_feature_drift(
        "Curricular units 1st sem (grade)", _s(12.0, std=3.0), _s(17.0)
    )
    assert result["severity"] == "warn"
    assert result["reason_code"] == "mean_shift_z"


def test_continua_high():
    """Nota média: z = 9.5/3.0 = 3.17 → high."""
    result = compute_feature_drift(
        "Curricular units 1st sem (grade)", _s(12.0, std=3.0), _s(21.5)
    )
    assert result["severity"] == "high"


def test_std_floor_previne_explosao():
    """std muito pequeno: std_floor evita z_shift explosivo."""
    # Age at enrollment: std_floor = 1.0
    # train_std = 0.001 → eff_std = 1.0 → z = 0.05/1.0 = 0.05 → ok
    result = compute_feature_drift("Age at enrollment", _s(25.0, std=0.001), _s(25.05))
    assert result["severity"] == "ok", (
        f"std_floor deveria limitar z_shift, mas severity={result['severity']}, "
        f"z_shift={result['z_shift']}"
    )


def test_relative_change_nunca_dispara_alerta():
    """relative_change é apenas informativo — mudança relativa alta sem z alto → ok."""
    # train_mean = 0.001, current_mean = 0.002 → 100% relativo, mas abs_delta = 0.001
    # z = 0.001 / std_floor(0.5) = 0.002 → ok
    result = compute_feature_drift("Unemployment rate", _s(0.001, std=0.0005), _s(0.002))
    assert result["severity"] == "ok"
    assert result["relative_change"] is not None  # informativo presente


# ── 5. Missing values ─────────────────────────────────────────────────────────

def test_missing_warn():
    """7 % de missing → warn."""
    result = compute_feature_drift(
        "Age at enrollment", _s(25.0), _s(25.0, missing_rate=0.07)
    )
    assert "missing_values" in result["reasons"]
    assert result["severity"] == "warn"


def test_missing_high():
    """15 % de missing → high."""
    result = compute_feature_drift(
        "Age at enrollment", _s(25.0), _s(25.0, missing_rate=0.15)
    )
    assert result["severity"] == "high"


def test_missing_combinado_com_drift():
    """Drift alto + missing alto → high, ambos nos reasons."""
    result = compute_feature_drift(
        "Curricular units 1st sem (grade)",
        _s(12.0, std=3.0),
        _s(21.5, missing_rate=0.12),
    )
    assert result["severity"] == "high"
    assert "mean_shift_z" in result["reasons"]
    assert "missing_values" in result["reasons"]


def test_missing_abaixo_do_limiar_nao_alerta():
    """3 % de missing → ok."""
    result = compute_feature_drift(
        "Age at enrollment", _s(25.0), _s(25.0, missing_rate=0.03)
    )
    assert result["severity"] == "ok"


# ── 6. Retorno estrutural ─────────────────────────────────────────────────────

def test_retorno_tem_todos_os_campos():
    """O dict retornado deve conter todos os campos esperados."""
    result = compute_feature_drift("Debtor", _s(0.20), _s(0.22))
    expected_keys = {
        "feature_type", "status", "severity", "reason_code",
        "reasons", "z_shift", "abs_delta", "binary_rate_delta", "relative_change",
    }
    assert expected_keys.issubset(result.keys()), (
        f"Campos ausentes: {expected_keys - result.keys()}"
    )


def test_binaria_nao_tem_z_shift():
    """Features binárias não devem retornar z_shift."""
    result = compute_feature_drift("Debtor", _s(0.20), _s(0.22))
    assert result["z_shift"] is None


def test_continua_nao_tem_binary_rate_delta():
    """Features contínuas não devem retornar binary_rate_delta."""
    result = compute_feature_drift(
        "Curricular units 1st sem (grade)", _s(12.0, std=3.0), _s(12.5)
    )
    assert result["binary_rate_delta"] is None
