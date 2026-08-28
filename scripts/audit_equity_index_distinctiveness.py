#!/usr/bin/env python3
"""Run the proven cluster sameness engine against the 35 equity-index pages."""

from __future__ import annotations

try:
    from . import audit_6z_distinctiveness as engine
    from .equity_index_cluster_config import ARTICLE_DIR, CLUSTER
    from .validate_equity_index_cluster import GENERIC_H2, normalize_heading
except ImportError:
    import audit_6z_distinctiveness as engine
    from equity_index_cluster_config import ARTICLE_DIR, CLUSTER
    from validate_equity_index_cluster import GENERIC_H2, normalize_heading


engine.ARTICLE_DIR = ARTICLE_DIR
engine.CLUSTER = CLUSTER
engine.GENERIC_H2 = GENERIC_H2
engine.normalize_heading = normalize_heading
engine.REQUIRED_REVIEW_SENTENCE = "sources were reviewed august 28 2026"


if __name__ == "__main__":
    raise SystemExit(engine.main())
