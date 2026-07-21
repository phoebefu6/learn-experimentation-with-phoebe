# Lumen Skincare - the running project (canon)

Every session in both tracks works on **Lumen Skincare**, a synthetic DTC e-commerce skincare
brand. One touchpoint event log carried across every model. Do NOT invent different numbers -
use these so leader and builder tracks reconcile.

## The brand in one line
Lumen Skincare: a $18M/yr direct-to-consumer skincare label, 9 marketing channels, ~2 year
history. Multi-touch journeys, long-ish consideration cycle (7-21 days), heavy paid social +
influencer, growing CTV. The CMO wants to reallocate a $4M/yr media budget defensibly.

## The 9 channels (fixed enum, same order everywhere)
`paid_search`, `paid_social`, `display`, `organic_search`, `email`, `affiliate`, `influencer`,
`ctv`, `direct`

## The canonical journey (put on slide 1 of every session, reuse everywhere)
One customer, order value **$92**, 5 touches in time order:

```
display(impression, day -14)
  -> paid_social(click, day -7)
    -> email(open, day -3)
      -> organic_search(click, day -1)
        -> paid_search(click, day 0)  -> CONVERT $92
```

**Same journey, every model gives a different answer** (this is the whole pedagogical payoff):

| Model | Credit split on the $92 journey |
|---|---|
| First-touch | display $92 |
| Last-touch | paid_search $92 |
| Last non-direct | paid_search $92 (no direct in path) |
| Linear | $18.40 each (5 touches) |
| Time-decay (7-day half-life) | display ~$6, paid_social ~$13, email ~$19, organic ~$25, paid_search ~$29 |
| Position-based (U 40/20/40) | display $36.80, paid_search $36.80, middle 3 split $18.40 -> ~$6.13 each |
| Markov (removal effect) | learned from the whole dataset, not this one path - typically spreads credit toward the channels whose removal collapses conversion (often paid_social + email here) |
| Shapley | learned marginal contribution across coalitions - rewards channels that lift others |

## Data model (3 tables)

### `touchpoints` (grain = one interaction)
| column | type | notes |
|---|---|---|
| touchpoint_id | STRING PK | |
| customer_id | STRING | journey key |
| session_id | STRING | |
| event_ts | TIMESTAMP | ordering key |
| channel | ENUM(9) | the fixed list above |
| campaign | STRING | e.g. "spring_glow", "retargeting_v2" |
| interaction_type | ENUM | impression / click / open |
| device | ENUM | mobile / desktop / tablet |
| geo | STRING | region code - enables geo-lift (e.g. "US-CA", "US-NY") |
| cost | FLOAT | media cost of this touch, for ROAS |
| position_in_path | INT | derived |
| is_converting_touch | BOOL | derived |

### `conversions`
| column | type |
|---|---|
| conversion_id | STRING PK |
| customer_id | STRING |
| conversion_ts | TIMESTAMP |
| order_value | FLOAT (mean ~$74, the canonical example is $92) |
| product_category | STRING (cleanser / serum / moisturizer / set) |
| new_vs_returning | ENUM |

### `spend_weekly` (for MMM - aggregate, 2-3 yrs)
| column | type |
|---|---|
| week | DATE |
| channel | ENUM(9) |
| geo | STRING |
| spend | FLOAT |
| impressions | INT |
| reach | INT |
| frequency | FLOAT |
| revenue | FLOAT |

## Budget context (leader track capstone)
Current annual media split (of $4M): paid_social 32%, paid_search 24%, influencer 14%,
display 10%, ctv 8%, email 5%, affiliate 4%, organic (SEO ops) 3%. The exec question:
last-touch says paid_search is the hero; data-driven + MMM tell a different story. Reallocate.

## Tooling per builder session
- B1: SQL (window functions on `touchpoints`) - BigQuery/SQLite dialect
- B2: SQL + pandas heuristics
- B3: scikit-learn logistic regression (Shao-Li bagged)
- B4: `ChannelAttribution` (Markov) + a from-scratch numpy transition matrix
- B5: from-scratch Shapley (itertools coalitions) + `shap` for the ML bridge
- B6: LightGBM + SHAP; concept-level LSTM/attention (DNAMTA/DeepMTA)
- B7: GA4 DDA (BigQuery export) + reconciliation SQL
- B8: Google Meridian / PyMC-Marketing (adstock, Hill saturation)
- B9: geo-lift (synthetic control) + calibrate MMM priors
- B10: the unified stack, orchestration, ethics

## HARD accuracy notes (from research - do not get these wrong)
- Heuristics are FIXED RULES, never call them "data-driven".
- Markov removal effects do NOT sum to 1 before normalization - always normalize.
- Shapley values DO sum to v(grand coalition) (efficiency axiom); exact Shapley is O(2^n).
- GA4 DDA = Shapley + time-decay, black box, only sees Google-observable consented touches.
- Only INCREMENTALITY (holdout/geo experiments) is causal. MTA, Markov, Shapley, MMM are all correlational.
- 2026: cookies partly survived in Chrome but MTA still broke (Safari/Firefox/ATT/SKAN-AAK) - misses 30-60% of touches. Do NOT say "cookies cancelled so MTA is fine".
- LightweightMMM deprecated Jan 2025 -> Google Meridian (Bayesian). Meta Robyn (ridge+Nevergrad).

---

## Experimentation-course adaptation (this repo)

The tables above are reused verbatim. This course runs EXPERIMENTS on Lumen instead of
attribution models. Canonical experiment numbers - use these everywhere so leader and builder
tracks reconcile (do NOT invent different figures):

- **Baseline conversion rate:** 3.2% (checkout page, control). Lumen's flagship test is a new
  product-page layout ("hero-first" variant) hypothesized to lift conversion.
- **Canonical A/B test (the running example):** control 3.2% vs variant 3.6% -> absolute MDE
  0.4pp (relative +12.5%). At alpha 0.05, power 0.80, two-sided, two-proportion, this needs
  ~**32,000 users per arm** (~64,000 total). VERIFIED against the exp-live planner and the
  rule-of-16 (n ~= 16*p(1-p)/delta^2 = 16*0.032*0.968/0.004^2 ~= 31,000). This is the b2
  build-along payoff - always state the assumptions with the number. (Do NOT use the old
  ~11,400 draft figure - it was a bad hand-estimate, corrected here.)
- **Daily eligible traffic:** ~4,000 checkout sessions/day split 50/50 (2,000/arm/day) -> the
  2-arm test needs ~16-17 days (~2.5 weeks). This is what the exp-live simulator seeds with.
- **Guardrail metrics:** page-load latency, refund rate, add-to-cart rate. A win on conversion
  that breaks a guardrail is not shipped.
- **Pre-period covariate for CUPED (b7):** each user's prior-30-day spend (or prior visit count).
  Correlation with the outcome ~0.6 -> variance reduction = rho^2 ~= 0.36 -> ~36% fewer users
  for the same power -> the ~32,000/arm test drops to ~20,500/arm. State it as "~35% fewer".
- **Geo test (b8 / a4):** the 9 US regions in `geo` become the units. Treat a subset of DMAs with
  a TV/CTV burst, hold the rest out; synthetic control builds the counterfactual for treated geos
  from the donor pool of untreated geos. Pre-period = 52 weeks of `spend_weekly` revenue.
- **DiD (b9):** Lumen rolls a loyalty program out to some regions before others; parallel-trends
  on pre-rollout weekly revenue, TWFE with region + week fixed effects.
- **Observational (b10):** email-opt-in users convert more - but they self-select. Confounders:
  prior engagement, tenure, channel of acquisition. Propensity-score / IPW to de-confound, and
  the honest caveat: only observed confounders are handled.

### SRM / A-A canon (b3)
A 50/50 split of 20,000 assignments showing 10,420 / 9,580 -> chi-square p ~0.0000 -> SRM, STOP.
A clean A/A on the same pipeline returns p-values ~uniform and ~5% "significant" by chance.

### Tooling per builder session (experimentation course - supersedes the attribution list above)
- b1: numpy/pandas (simulate potential outcomes, show the fundamental problem)
- b2: statsmodels.stats.power (TTestIndPower, NormalIndPower), scipy.stats
- b3: scipy.stats.chisquare (SRM), numpy.random (assignment)
- b4: statsmodels (proportions_ztest, confint), statsmodels.stats.multitest (bonferroni, fdr_bh)
- b5: statsmodels ols + anova_lm (C(A)*C(B) interactions), pyDOE2 for designs
- b6: hand-rolled mSPRT / confidence sequence, Thompson sampling in numpy
- b7: numpy + statsmodels OLS (theta = cov/var, regression adjustment)
- b8: tfcausalimpact / pycausalimpact, pysyncon (synthetic control), CausalPy
- b9: linearmodels PanelOLS (TWFE), pyfixest; event-study plot
- b10: DoWhy (identify->estimate->refute), EconML (DR/meta-learners), causalinference (PSM)
