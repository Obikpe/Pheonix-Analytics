# Learnora ME UI/UX Research and Design Decisions

Research checked: 10 October 2026.

## Design-reference sources

### Mobbin
- Official site: https://mobbin.com/
- Official MCP overview: https://mobbin.com/mcp
- Use for: real shipped mobile/web screens, onboarding, course discovery, learning dashboards, forms, empty/error states and end-to-end flows.
- Why it matters: patterns are grounded in shipped product interfaces rather than one-off concept shots.
- Access note: Mobbin's current site advertises its MCP for Pro and Team plans. It is not connected to this ChatGPT workspace, so no Mobbin MCP results were retrieved during this implementation.

### Figma MCP
- Official documentation: https://developers.figma.com/docs/figma-mcp-server/
- Remote setup: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/
- Use for: extracting design tokens, variables, components and layout context from actual Figma files; creating/updating native Figma frames when the client and account permissions support write access.
- Access note: Figma recommends its remote MCP server and requires authentication plus a supported MCP client. No Figma MCP connection is available in this workspace, so existing repository components and tokens were used directly instead of pretending a Figma file had been inspected.

### Awwwards
- Official inspiration gallery: https://www.awwwards.com/
- Use for: art direction, typography, storytelling, visual hierarchy, motion and high-quality marketing-site compositions.
- Guardrail: avoid copying novelty interactions when they undermine navigation, accessibility, performance or the clarity of Learnora's learning journey.

### Godly
- Official gallery: https://godly.design/
- Use for: contemporary web/app visual directions, layout patterns and examples of restrained versus expressive art direction.
- Guardrail: use references to inform principles, not reproduce another product's design.

## Tooling and implementation decision

- Keep the current Learnora top navigation structure because it already fits the product and the user explicitly prefers it.
- Use the existing Next.js, React, Tailwind and Lucide stack. Avoid introducing a paid design dependency or a new component library just to make the interface look different.
- Keep the visual system coherent: dark graphite surfaces, warm gold accent, deliberate display typography, generous whitespace and high-contrast functional controls.
- Use different relevant image assets for different story sections; do not repeat one hero image as generic decoration across the site.
- Use actual API records. Do not create fabricated course counts, learner outcomes, testimonials, organisation metrics or portfolio evidence.
- Build page-specific layouts for marketing, learner learning, tutor discovery, organisation onboarding and internal operations rather than reusing the same grid/card composition everywhere.
- Make loading, empty, error, validation, success and permission-denied states part of the design—not afterthoughts.
- Keep motion subordinate to comprehension, support mobile layouts and preserve semantic controls/keyboard access.
- Distinguish course completion from skill verification. Evidence that has not been reviewed must be labelled unverified.

## Product-specific design direction

Learnora is a journey from discovering a skill to learning it, practising it, building something, proving competence with appropriate evidence, showcasing that evidence and connecting to opportunities. Public pages should explain that vision without promising outcomes the platform cannot guarantee.

The customer-facing application (frontend-v02) owns learners, tutors/creators, public course and tutor discovery, organisation enquiries, prospect portals and customer organisation workspaces. The internal Learnora workforce application (frontend-team) owns Super Admin and internal operations. The legacy frontend/ folder is intentionally untouched.

## MCP availability checked

The available connected tool inventory for this session includes GitHub, Supabase and Vercel operations. It does not include a connected Figma or Mobbin design MCP. This is an access limitation, not a claim that those servers do not exist. Figma and Mobbin can be connected in a supported design/development client if the user chooses to set them up.

## Additional verification — 10 October 2026

- Figma's official MCP documentation confirms a structured design-to-code path through `get_design_context`, including component, layout and variable context, plus a code-to-canvas path for reviewing live UI as editable Figma layers. Use this for design-system alignment and visual review once a supported Figma MCP client is connected; the MCP output is context for the coding agent, not production-ready code by itself.
- Mobbin's official site currently advertises MCP access on Pro and Team plans. Use it to research real shipped flows (course discovery, lesson players, settings, tutor onboarding and organisation onboarding) rather than copying isolated screenshots.
- For Learnora, research should be organised by user journey: public discovery → registration/login → course enrolment → lesson and progress → evidence/portfolio; creator application → approval → course builder → publication; organisation request → contract → activation → cohort/team setup; and internal staff operations. Review loading, empty, error, validation, success and permission-denied states for each flow.
- Awwwards and Godly remain art-direction references. Use them for typography, layout rhythm, imagery and storytelling, while using real product-flow references for functional interaction patterns.
- No Figma or Mobbin MCP connection was available during this pass. No external design file was read or edited; implementation stayed grounded in the repository's existing React/Tailwind components and the user-approved dark graphite/gold direction.
