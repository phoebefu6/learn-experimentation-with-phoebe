# Official course map - learn-experimentation-with-phoebe

Two-track course on experimentation, A/B testing, and causal inference. Running case: **Lumen
Skincare** (reused from learn-marketing-attribution - same 9 channels, $4M budget, geo field
already in the data model). ds bucket. Lab-indigo + lime palette. Live layer: `exp-live.js`
(in-browser A/B simulator + peeking demo).

Filed under the honesty rule: each session teaches ~80% of its mapped sources' working content;
certificates/videos/graded assessments stay on the official platforms - say so on the page.

## Why this course exists (the gap it owns)

Deep research across DeepLearning.AI, Coursera, 365 Data Science, LinkedIn Learning, and Udemy
(2026-07-21) found: **no single course covers the modern online-experiment stack.** Hypothesis
testing, power, randomization, A/B, propensity, DiD are all taught *somewhere*; but
**sequential testing / the peeking problem, CUPED variance reduction, and geo + synthetic
control are a genuine gap on every platform.** That trio is the course's edge - taught from the
primary sources (Johari et al. 2017, Deng/Xu/Kohavi 2013, Abadie 2003/2010).

## The two tracks

- **Leader track (a1-a6)** - read / trust / commission experiments. Non-technical. Exec voice.
  How to interrogate a result deck, spot an underpowered or peeked test, know when a geo test
  beats a user-level test, and build an experimentation culture.
- **Builder track (b1-b10)** - design + analyze in Python. DA / DE / DS voice. Every session is
  a build-along on Lumen data with a named library.

## Take these first (the learn-first loop - ranked)

| # | Platform | Course | Why | Hrs |
|---|----------|--------|-----|-----|
| 1 | Udacity (free) | A/B Testing (Google, Grimes/Buckey, ud257) | THE canonical online-experiment course | ~15 |
| 2 | 365 Data Science | A/B Testing in Python (Kuznetsova) | Most on-point; extract-then-cancel target | ~3 |
| 3 | Coursera | Crash Course in Causality (UPenn, Roy) | DAGs, propensity, IPTW, IV | ~20 |
| 4 | Coursera | Experimentation for Improvement (McMaster, Dunn) 4.9★ | Classical DOE, feeds MVT session | ~13 |
| 5 | Coursera | The Power of Statistics (Google GADA C3) | Hypothesis testing + CI + A/B in Python | ~32 |
| 6 | 365 Data Science | Statistics (Valchanov) 4.9★ | Inference backbone; finish-and-cancel | ~5 |
| 7 | LinkedIn Learning | Data Science of Experimental Design (Wahi) | Design + G*Power sample size + SRM | ~2 |
| 8 | Udemy | Econometrics & Statistics for Business (Resende) | Best code home for DiD + propensity + CausalImpact | ~12 |
| 9 | Free (off-platform) | Brady Neal - Intro to Causal Inference | Best free ML-oriented causal course + free text | self |
| 10 | Udemy | Bayesian ML in Python: A/B Testing (Lazy Programmer) 4.7★ | Bandits / Thompson sampling for the sequential session | ~10 |

Also strong: Udemy "Ultimate AB Testing" (Dan Lee) for SRM/SUTVA/novelty validity threats;
Udemy "Causal Data Science with DAGs" (Hunermund) for the Pearlian half.

## Per-session coverage

### Builder track (b1-b10)

| # | Session | Teaches (✓ live) | Stack | Maps to |
|---|---------|------------------|-------|---------|
| b1 | Potential outcomes & the estimand | ✓ Rubin framework, Y(1)/Y(0), fundamental problem, ATE/ATT/CATE, why randomize, Lumen setup | numpy/pandas | Neal, UPenn C.C., Udemy CausAI |
| b2 | Power & sample size | ✓ Type I/II, α, power, MDE, rule-of-16, two-prop & two-mean N | statsmodels.stats.power, scipy | 365 A/B, LinkedIn Wahi, Udacity |
| b3 | Randomization & trust | ✓ unit of randomization, SUTVA, stratified, A/A test, SRM chi-square | scipy.stats.chisquare, numpy | Udemy Dan Lee, LinkedIn Wahi |
| b4 | Run & analyze an A/B test | ✓ two-proportion z-test, CI, effect size, multiple comparisons (Bonferroni/BH) | statsmodels, multitest | 365 A/B, Google Power of Stats |
| b5 | Multivariate testing | ✓ full vs fractional factorial, interactions, two-way ANOVA | statsmodels ols/anova_lm, pyDOE | McMaster DOE, LinkedIn Stats 4 |
| b6 | Sequential testing & peeking | ✓ fixed-horizon inflation, always-valid/mSPRT, group-sequential (Pocock/OBF), bandits | confseq / hand-rolled, Thompson | Johari 2017*, Lazy Programmer |
| b7 | CUPED & variance reduction | ✓ θ=cov(Y,X)/var(X), Var(1-ρ²), regression adjustment (Lin) | numpy, statsmodels OLS | Deng 2013* (gap - primary source) |
| b8 | Geo experiments & synthetic control | ✓ geo holdout, donor pool, pre-fit, placebo tests, CausalImpact | tfcausalimpact, pysyncon | Abadie*, Meta GeoLift, Udemy Resende |
| b9 | Difference-in-differences | ✓ parallel trends, 2x2, TWFE, event study, staggered critique | linearmodels PanelOLS, pyfixest | Card-Krueger, Udemy Resende |
| b10 | Observational causal inference (capstone) | ✓ confounding, backdoor/DAGs, propensity/IPW, doubly robust, when to trust obs | DoWhy, EconML, causalinference | UPenn C.C., Neal, Hunermund |

### Leader track (a1-a6)

| # | Session | Teaches (✓ live) | Maps to |
|---|---------|------------------|---------|
| a1 | Why experiments beat opinions | ✓ correlation vs causation, potential-outcomes intuition, the counterfactual, when to commission | Neal (concepts), UPenn intro |
| a2 | Reading a test you didn't run | ✓ MDE, sample size, power, p-value, CI, what "not significant" means, underpowered tells | 365 A/B, Google Power of Stats |
| a3 | The trust checklist | ✓ randomization, A/A, SRM, novelty/primacy, interference, guardrail metrics - how to interrogate a deck | Udemy Dan Lee, Kohavi book |
| a4 | Beyond the button | ✓ geo tests, holdouts, incrementality, MMM calibration (bridges attribution B8/B9) | Meta Marketing Analytics |
| a5 | When you can't randomize | ✓ quasi-experiments (DiD, synthetic control), observational caveats, confounding for execs | UPenn C.C., Resende |
| a6 | Building an experimentation culture | ✓ OEC, guardrail metrics, decision framework, velocity, ROI - capstone: commission Lumen's roadmap | Kohavi Trustworthy OCE |

\* = primary-source topics no platform course teaches well; the course's differentiator.

## Verified technical facts (do not get wrong)

- **Power/sample size:** power = 1-β (conv. 0.80); α conv. 0.05. Rule-of-16: n ≈ 16σ²/δ² per arm
  (α=.05, power=.80, two-sided). Two-proportion: n ≈ 2·p̄(1-p̄)(z_{1-α/2}+z_{1-β})²/(p₁-p₂)².
  MDE is a design *input*, not an output. "Not significant" ≠ "no effect" (absence of evidence).
- **Multiple comparisons:** Bonferroni tests each at α/m (controls FWER, conservative);
  Benjamini-Hochberg controls FDR, more powerful with many metrics.
- **Randomization:** SUTVA = no interference + no hidden treatment versions (Rubin 1980).
  Randomization → internal validity; random sampling → external validity. A/A validates the
  pipeline (p-values ~uniform). SRM = allocation deviates from intended; test with chi-square,
  alarm threshold ~p<0.001 (not 0.05), stop and debug - do not read a test with SRM.
- **MVT:** full factorial estimates all interactions but is traffic-hungry; fractional factorial
  aliases (confounds) higher-order interactions with main effects. Interaction = effect of A
  depends on level of B.
- **Sequential/peeking:** fixed-horizon p-values are valid only at the pre-committed N. Peeking
  can push Type I error to ~30%+. Always-valid inference (mSPRT, Johari/Optimizely) and
  confidence sequences fix it; group-sequential (Pocock = constant boundary; O'Brien-Fleming =
  stringent early) spends α across pre-planned looks (Lan-DeMets spending generalizes). Bandits
  optimize/minimize regret, they do not give clean fixed inference.
- **CUPED:** Y_cuped = Y - θ(X - E[X]), θ = Cov(Y,X)/Var(X). Var reduction = ρ² (ρ=corr(Y,X));
  same-metric pre-period often ρ≈0.5-0.7 → ~25-50% variance cut. Covariate MUST be strictly
  pre-treatment (Deng/Xu/Kohavi/Walker, WSDM 2013). CUPED = regression adjustment with one
  pre-period covariate.
- **Geo + synthetic control:** GeoLift is **Meta's** (SCM-based). Google = Geo experiments
  (Vaver-Koehler 2011) + CausalImpact (Brodersen 2015, BSTS). SCM (Abadie-Gardeazabal 2003;
  Abadie-Diamond-Hainmueller 2010) builds a synthetic treated unit from a weighted donor pool;
  good pre-treatment fit is the credibility test; placebo tests give permutation inference.
  There is no "Google GeoLift" - do not conflate.
- **DiD:** DiD = (Ȳ_T,post - Ȳ_T,pre) - (Ȳ_C,post - Ȳ_C,pre); regression β₃ on Treat×Post.
  Assumption = parallel trends (check pre-trends / event study). TWFE biased under staggered
  adoption + dynamic effects ("forbidden comparisons", negative weights) - Goodman-Bacon 2021,
  Callaway-Sant'Anna 2021. Canonical: Card-Krueger 1994 min-wage.
- **Causal basics:** potential outcomes (Neyman 1923/Rubin 1974); fundamental problem = never
  observe both Y(1),Y(0) for a unit (Holland 1986). ATE/ATT/CATE. Assumptions: ignorability,
  SUTVA, positivity/overlap. Confounder = common cause of T and Y (opens a backdoor path).
  Backdoor criterion (Pearl): block all backdoor paths, no descendants of T. NEVER condition on
  a collider or mediator - it creates bias. Propensity e(X)=P(T=1|X) (Rosenbaum-Rubin 1983);
  IPW weights by 1/e(X); doubly robust (AIPW/TMLE) consistent if either model correct.
  Observational ≠ experimental: adjustment fixes only *observed* confounders.

## Not covered by design (honest scope)

- Production experimentation platforms (Optimizely, LaunchDarkly, GrowthBook, Statsig) - named,
  not operated. We teach the statistics they run, not their UIs.
- Full DOE / response-surface optimization beyond factorial + interactions (McMaster course owns this).
- Bayesian A/B in depth (priors, decision theory) - concept-level only in b6; Lazy Programmer
  Udemy course owns the depth.
- Instrumental variables & regression discontinuity - named as siblings of DiD in b9/b10, not
  built (Columbia Causal Inference 2 owns these).
- Certificates, graded assignments, lecture videos - stay on the official platforms. Said on-page.

## Re-verify before delivery
Fast-moving libs: LightweightMMM deprecated Jan 2025 → Meridian; check CausalImpact/pysyncon and
EconML/DoWhy release notes before teaching live. The stats (papers) are stable.
