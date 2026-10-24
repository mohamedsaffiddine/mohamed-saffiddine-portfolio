# Data and interpretation

Primary source: the supplied `Manhattan_HVAC_Portfolio_Project.zip`. All eight original PDF/PPTX/XLSX files are included byte-for-byte in `site/assets/documents/`; the complete original ZIP is also included. `site/data.json` records each document's SHA-256. Builds and tests verify those hashes. Website layout and conceptual building illustration are new; project results and documents are preserved.

## Workbook mapping

The source workbook is `HVAC_CapEx_Final_Validated.xlsx`. Values were read from its saved calculation cache; the website does not modify or recalculate Excel.

| Website data | Original workbook cells |
| --- | --- |
| Main comparison and paybacks | Summary!D8:F16; Cash Flow!E89:F94 |
| Three scenario names, discount rates and NPVs | Scenarios!C8:G10 |
| Scenario price/energy/cost/maintenance assumptions | Assumptions!E61:E63, E66:E68, E71:E73, E76:E78 |
| Chillers, fans, pumps, tower annual electricity | Energy!F13:H16 |
| HVAC totals and reductions | Energy!F18:H22 |
| Other electricity, unchanged gas | Assumptions!E14:E15 |
| Load bins and efficiency curves | Assumptions!C33:G36 |
| Auxiliary ratings, power fractions and hours | Assumptions!D41:J43 |
| Year 1 operating savings | Energy!F24:H29 |
| Itemized base capital budgets | CapEx!C8:I25 |
| Annual base incremental cash flows | Cash Flow!D54:N54, D76:N76 |
| Cumulative discounted chart | Summary!C51:E61 |
| Annual unit cash-flow components | Scenarios!D21:N24, D28:N31 |
| C base present-value components | Scenarios!D40:G40 |
| C sensitivity matrix | Scenarios!D44:H48 |
| Break-even tariff and capital | Scenarios!E51:E52 |

All money is USD. Year 0 is December 31, 2026. Years 1–10 end on December 31, 2027–2036. Dated NPV uses actual days/365, including leap days, and includes Year 0 once. Chart paths are not smoothed. Display rounding uses nearest dollar, one decimal for energy reduction, three decimals for millions on the NPV chart. Exact original cached values remain in JSON.

Sensitivity: `C NPV = energyPV × electricityPrice + maintenancePV + capitalPV × initialCostMultiplier + fixedPV`. CapitalPV includes the initial outlay and related initial tax shields. Other realization factors and the discount rate remain at base; future capital is fixed. This reproduces all 25 original grid cells. The sliders are hypothetical sensitivities, not estimated probabilities or forecasts.

## Editorial sources and boundaries

- Executive Investment Summary: objective, key comparison, final recommendation and limitations.
- README: author identity, student affiliation, independent/hypothetical status and viewing order.
- Engineering Analysis and System Schematic: pp. 1–3 explain system topology and option scope; pp. 4–6 support energy equations and savings boundaries; pp. 7–8 cover measurements and limitations. The website's diagram is a simplified component explorer, not piping or construction documentation.
- Engineering and Financial Assumptions Validation: pp. 2–7 cover reproducibility, scope, tax and emissions; pp. 8–9 contain the fixed-input risk diagnostics; pp. 10–19 map assumptions to evidence; pp. 20–24 contain references and remaining work.
- Excel Model Audit Report: original Step 1 findings, retained as historical evidence. Website copy does not misrepresent its original control issues as unresolved defects in the corrected workbook.
- Step2 Correction Report: corrections and historical test claims; their reported 249/28/210 comparisons were not repeated as part of website development.
- Presentation: the original seven slides and notes support the narrative structure; the editable PPTX is preserved.

The website does not claim measured savings, a surveyed building, verified equipment selections, priced scope, tax eligibility, financial approval, or legal compliance. The source's 94 Step 3 comparisons and 14+4 workbook checks are historical project claims, clearly distinguished from the website tests.

B's 37.7% and C's 15.7% reductions are **HVAC electricity only**. Including 6,000,000 unchanged kWh makes whole-building electricity reductions 12.7% and 5.3%; unchanged gas is outside those percentages. Demand-charge savings, incentives and carbon penalties are not inserted into investment cash flows. The emissions screen is incomplete for 2035–2036 and is not proof of compliance.

The 10-year period is a planning window, not full asset life. No terminal value or later tax benefits are added. The conclusion remains: investigate C further, withhold unconditional approval, and substantiate costs, performance, baseline capital, leases and tax treatment.
