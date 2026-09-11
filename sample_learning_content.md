# Sample Learning Module: Survey Sampling Methods in Official Statistics

*This is original reference content created for prototype testing of the AI-powered
MCQ/Quiz generation module. Upload this file (or replace it with real NSSTA training
material) to test end-to-end: document → LLM → generated quiz.*

## 1. Introduction to Sampling

In official statistics, it is rarely feasible to survey every unit in a population —
a census of every household, farm, or industrial establishment is expensive, slow,
and often unnecessary. Sampling allows statisticians to draw reliable conclusions
about a population by examining only a carefully selected subset of it. The quality
of the conclusions depends heavily on how that subset is chosen.

## 2. Probability vs Non-Probability Sampling

**Probability sampling** methods give every unit in the population a known,
non-zero chance of selection. Because selection probabilities are known, these
methods allow statisticians to calculate margins of error and confidence intervals,
which is why official statistical agencies rely on them for surveys that inform
policy.

**Non-probability sampling** methods (such as convenience sampling or quota
sampling) do not guarantee every unit a calculable chance of selection. They are
faster and cheaper but do not support formal statistical inference about the wider
population, so they are used mainly for pilot studies or qualitative exploration.

## 3. Common Probability Sampling Designs

- **Simple Random Sampling (SRS):** Every unit has an equal chance of selection,
  typically drawn using a random number generator applied to a complete sampling
  frame. It is the theoretical baseline against which other designs are compared,
  but it can be inefficient for large, spread-out populations.

- **Stratified Sampling:** The population is divided into homogeneous subgroups
  (strata) — for example, states, industry types, or income bands — and units are
  sampled independently within each stratum. This improves precision when
  variation within strata is smaller than variation between strata, and it
  guarantees representation of every subgroup.

- **Systematic Sampling:** Units are selected at fixed intervals from an ordered
  list (e.g., every 10th household from a list of 10,000), after a random start.
  It is easy to implement in the field but can introduce bias if the list has a
  hidden periodic pattern.

- **Cluster Sampling:** The population is divided into clusters (e.g., villages
  or city blocks), a sample of clusters is randomly selected, and all units within
  chosen clusters are surveyed. This reduces travel and listing costs for large
  geographic surveys, though it generally yields less precision per unit sampled
  than stratified sampling because units within a cluster tend to be similar.

- **Multi-Stage Sampling:** Combines several of the above designs in stages — for
  example, first sampling districts, then villages within districts, then
  households within villages. Most large-scale official surveys, including many
  National Sample Survey (NSS) rounds, use multi-stage designs to balance cost,
  logistics, and statistical precision.

## 4. Sampling Frame and Sampling Error

The **sampling frame** is the complete list (or map) of all units from which the
sample is drawn. An outdated, incomplete, or duplicated frame is one of the most
common sources of error in official surveys — it introduces **coverage error**,
which is distinct from **sampling error** (the natural variability that arises
because only a subset, not the full population, is observed).

**Sampling error** decreases as sample size increases, but it can never be reduced
to zero unless a full census is conducted. Statisticians report this error through
standard errors and confidence intervals, which communicate how much a sample-based
estimate might reasonably differ from the true population value.

## 5. Determining Sample Size

Sample size decisions balance three factors: the desired precision (margin of
error), the required confidence level (commonly 95%), and the variability of the
characteristic being measured. Highly variable characteristics require larger
samples to achieve the same precision as more homogeneous ones. Budget and field
logistics also place a practical ceiling on sample size, so survey designers
typically compute the minimum sample size needed to meet a target precision and
then check it against available resources.

## 6. Common Sources of Non-Sampling Error

Even a well-designed sample can produce misleading results if non-sampling errors
are not controlled:

- **Non-response error:** occurs when selected units cannot be reached or refuse
  to participate, potentially biasing results if non-respondents differ
  systematically from respondents.
- **Measurement error:** arises from poorly worded questions, interviewer bias, or
  respondent misreporting.
- **Processing error:** introduced during data entry, coding, or editing after
  collection.

Robust survey design in official statistics addresses both sampling and
non-sampling error, since a precise but biased estimate can be more misleading
than a slightly less precise, unbiased one.
