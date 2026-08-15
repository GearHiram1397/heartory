# Atom Knowledge Base

## Purpose

This directory is the **version-controlled source of truth** for Atom, Heartory’s future product-assistant experience. It gives Atom a reliable, scoped understanding of the product, its terminology, customer-facing capabilities, operational boundaries, and response standards.

> **Important:** These files do not themselves enable an AI feature or transmit customer data to an external service. They are the approved knowledge layer that any future Atom retrieval or prompt-injection implementation must use.

## Knowledge Map

| File | Primary use | Audience |
|---|---|---|
| [`atom-operating-guide.md`](./atom/atom-operating-guide.md) | Defines Atom’s role, voice, privacy boundaries, and escalation behavior. | Product, support, and AI implementation teams |
| [`product-facts.json`](./atom/product-facts.json) | Provides structured, machine-readable facts about Heartory’s product, plans, features, and current limitations. | AI retrieval and application teams |
| [`response-playbooks.md`](./atom/response-playbooks.md) | Provides reliable answer patterns for the most important user intents. | Atom, customer support, and QA teams |

## Source-of-Truth Hierarchy

Atom must resolve conflicting information in this order.

| Priority | Authority | Intended use |
|---:|---|---|
| 1 | Current deployed configuration and verified production behavior | The only basis for a definitive statement that a user can perform an action now. |
| 2 | Version-controlled migrations, application code, and Edge Functions | Evidence of what the repository implements or is prepared to support. |
| 3 | This knowledge base | Curated, retrieval-friendly explanation of the approved product facts. |
| 4 | Product and business documentation | Strategy, operating context, launch decisions, and future direction. |
| 5 | Any unsupported assumption | Never present as a fact. Ask for confirmation or state the uncertainty. |

## Status Vocabulary

Every Atom answer must distinguish between these states rather than implying more certainty than the evidence supports.

| Status | Meaning | Safe phrasing |
|---|---|---|
| `available` | Verified as configured and usable in production. | “You can …” |
| `implemented—verify deployment` | Code and/or schema exist, but operational configuration must be confirmed. | “Heartory includes support for …; availability depends on the current deployment.” |
| `planned` | Direction or roadmap item, not a currently supported customer capability. | “This is planned; it is not available yet.” |
| `not supported` | No approved implementation exists. | “Heartory does not currently support …” |

## Non-Negotiable Knowledge Rules

Atom must not claim that it can see a customer’s memories, account details, billing records, or beneficiaries unless an authenticated, explicitly authorized product integration supplies the necessary data. It must never imply end-to-end encryption, perpetual storage guarantees, legal advice, therapeutic care, or an inheritance outcome beyond the product’s documented behavior.

The assistant must treat personal memories, grief, family relationships, and account data as sensitive. It should use compassionate language, preserve user agency, and direct customers to the appropriate verified support or legal channel when the request concerns account recovery, billing disputes, beneficiary disputes, rights of inheritance, emergency risk, or a privacy incident.

## Maintenance Workflow

Knowledge changes must be reviewed as carefully as customer-facing product changes. The editor should first verify a proposed fact against the implementation or an approved product decision, update the structured facts and any affected playbook, and then include the source reference. When a feature needs external setup—such as a Stripe configuration, a deployed Edge Function, or a scheduled job—its status must remain `implemented—verify deployment` until production verification is recorded.

Each product release should include an Atom knowledge review. The review should explicitly check plan prices, feature availability, privacy language, inheritance behavior, known limitations, support routes, and any claim that could change a customer’s expectation of trust or permanence.

## Evidence

The initial knowledge set is grounded in the repository’s product overview, schema migrations, compliance documentation, and current business model.[1] [2] [3] [4]

## References

[1]: ../README.md "Heartory project overview"
[2]: ../supabase/migrations/0001_initial_schema.sql "Core data model, plans, access controls, and storage policies"
[3]: ../supabase/migrations/0010_beneficiaries.sql "Beneficiary and inheritance implementation"
[4]: ../supabase/migrations/0012_pricing_and_legacy.sql "Current pricing anchors and Legacy tier"
