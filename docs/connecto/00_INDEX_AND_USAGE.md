# Connecto AI Blueprint — File Index

Read these files in order:

1. 01_README.md — Product foundation and scope
2. 02_PRODUCT_SPEC.md — Detailed product behavior
3. 03_UI_UX_SPEC.md — Interface and UX requirements
4. 04_DATA_MODEL.md — Conceptual data structure
5. 05_API_SPEC.md — Backend API contract
6. 06_DEVELOPMENT_TASKS.md — Page-by-page implementation plan
7. 07_AI_AGENT_INSTRUCTIONS.md — Rules for Claude/Kiro/Copilot/other coding agents
8. 08_DEMO_SCRIPT.md — How to demonstrate Connecto to an incubator
9. 09_ROADMAP.md — Prototype → validation → MVP roadmap
10. 10_PITCH_ONE_LINERS.md — Short explanations of the idea

## How to use

Put these files inside your project documentation folder, for example:

docs/connecto/

Then give your coding agent this instruction:

"Read docs/connecto/01_README.md through docs/connecto/07_AI_AGENT_INSTRUCTIONS.md. Treat them as the source of truth. First inspect the existing repository. Do not write code yet. Summarize the existing architecture and identify what is already implemented versus what remains. Then wait for my task."

After that, work one task at a time:

"Implement TASK-01 from docs/connecto/06_DEVELOPMENT_TASKS.md. Follow docs/connecto/07_AI_AGENT_INSTRUCTIONS.md. Inspect the existing code first. Do not modify unrelated functionality."

After TASK-01 is complete, test it, then request TASK-02, and continue sequentially.

Important:
Do not ask the AI to "build the entire Connecto app" from these files in one shot. The documentation defines the product; the task file controls the implementation order.
