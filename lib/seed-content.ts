/**
 * Starter content for Editco Onboarding. Every item here becomes an editable,
 * versioned record in the Content Library / Policies / Training / Assessments.
 * Bodies are HTML rendered by the rich editor and the read views.
 */

export interface SeedContent {
  key: string;
  title: string;
  category: string;
  summary: string;
  body: string;
}

export const CORE_CONTENT: SeedContent[] = [
  {
    key: "welcome-to-editco",
    title: "Welcome to Editco",
    category: "Company",
    summary: "A warm welcome and what to expect from onboarding.",
    body: `<h1>Welcome to Editco</h1>
<p>Welcome to Editco Media. We're genuinely happy to have you on the team.</p>
<p>We build smart websites, AI calling agents, and growth systems for modern businesses — and you're now part of how we deliver that.</p>
<p>This onboarding journey will help you understand:</p>
<ul>
  <li>Editco — who we are and what we build</li>
  <li>The systems and standards we work to</li>
  <li>Your team and the people you'll work with</li>
  <li>Your role and what success looks like</li>
  <li>How we communicate with each other and with clients</li>
  <li>Our tools and workflow</li>
  <li>Your first 30 days</li>
</ul>
<blockquote>Take it step by step — the portal will always tell you what to do next.</blockquote>`,
  },
  {
    key: "about-editco",
    title: "About Editco",
    category: "Company",
    summary: "Who we are, what we build, and how we work.",
    body: `<h1>About Editco</h1>
<h2>Who We Are</h2>
<p>Editco Media builds smart websites, AI calling agents, and growth systems for modern businesses. We work directly with founders and teams to turn attention into revenue.</p>
<h2>What We Believe</h2>
<blockquote>Businesses don't lose customers because of bad products. They lose them because of broken systems.</blockquote>
<p>So we don't ship isolated tools — we build complete systems that help businesses attract leads, respond faster, automate work, and convert more customers.</p>
<h2>What We Do</h2>
<ul>
  <li>Premium websites</li>
  <li>AI calling agents</li>
  <li>Workflow automations</li>
  <li>UI/UX design</li>
  <li>CRM &amp; lead management</li>
  <li>SEO &amp; AEO optimization</li>
</ul>
<h2>How We Work</h2>
<ol>
  <li>Understand your business</li>
  <li>Find growth gaps</li>
  <li>Design the system</li>
  <li>Build &amp; launch</li>
  <li>Optimize for results</li>
</ol>
<h2>What Makes Us Different</h2>
<ul>
  <li><strong>Direct from the developers</strong> — no middlemen, no handoffs.</li>
  <li><strong>No prototype promises</strong> — we deliver working builds, not mockups.</li>
  <li><strong>Real-time fixes</strong> — issues are handled fast, as they come up.</li>
  <li><strong>Flexible pricing</strong> — models that fit the business.</li>
</ul>
<h2>Who We Work With</h2>
<p>We partner with clinics, service businesses, construction and logistics teams, and tech &amp; marketing companies — including Dentin Oral Experts, Dr. Sai Preethi Clinic, BuildTrack, EasyMove, KodeClamp and Social DNA.</p>
<h2>Our Team</h2>
<ul>
  <li><strong>Sri Pavan Tej</strong> — Product, Technology &amp; Systems</li>
  <li><strong>Harsha Polina</strong> — Strategy, Operations &amp; Technology</li>
  <li><strong>Deepika Mundla</strong> — Design, Identity &amp; Technology</li>
</ul>
<h2>Reach Us</h2>
<p>hello@editcomedia.com · +91 90590 57093 · WhatsApp support available</p>`,
  },
  {
    key: "editco-101",
    title: "Editco 101",
    category: "Company",
    summary: "The essentials every new joiner needs on day one.",
    body: `<h1>Editco 101</h1>
<p>This is the quick-start guide to working at Editco Media.</p>
<h2>What we do</h2>
<p>We design and build websites, AI calling agents, workflow automations and growth systems — and we help clients run and optimize them.</p>
<h2>How we operate</h2>
<ul>
  <li>We think in systems, not one-off fixes</li>
  <li>We ship working builds, not mockups</li>
  <li>We communicate directly and fix issues in real time</li>
  <li>We measure success by results the client can see</li>
</ul>
<h2>Tools we use</h2>
<ul>
  <li>Email for formal and external communication</li>
  <li>Internal messaging / WhatsApp for quick team coordination</li>
  <li>Project tools for tracking work</li>
</ul>
<h2>Who to ask</h2>
<p>Your reporting manager is your first point of contact. When unsure, ask early.</p>
<h2>Your first week</h2>
<ol>
  <li>Complete your profile and required documents</li>
  <li>Read the company and role modules</li>
  <li>Meet your team and manager</li>
  <li>Complete Editco 101 training and the fundamentals assessment</li>
</ol>`,
  },
  {
    key: "editco-way",
    title: "The Editco Way",
    category: "Company",
    summary: "How we work at Editco.",
    body: `<h1>The Editco Way</h1>
<p>Here's how we work at Editco Media:</p>
<ul>
  <li>Think in systems, not one-off fixes</li>
  <li>Ship working builds, not promises</li>
  <li>Communicate directly and clearly</li>
  <li>Respond fast — fix issues in real time</li>
  <li>Take ownership from start to finish</li>
  <li>Respect customers and teammates</li>
  <li>Keep commitments</li>
  <li>Focus on results the client can measure</li>
</ul>
<blockquote>These aren't rules on a wall — they're how we actually work every day.</blockquote>`,
  },
  {
    key: "communication",
    title: "Communication",
    category: "Employee",
    summary: "How we communicate internally and with customers.",
    body: `<h1>Communication</h1>
<h2>Internal Communication</h2>
<p>Be clear, be kind, be brief. Keep the right people informed.</p>
<h2>Customer Communication</h2>
<p>Always professional and prompt. When in doubt, check with your manager before responding.</p>
<h2>Email</h2>
<p>Use email for formal, external and record-keeping communication.</p>
<h2>Internal Messaging</h2>
<p>Use internal messaging for quick coordination. Keep channels focused.</p>
<h2>Meetings</h2>
<p>Come prepared. Start and end on time. Capture action items.</p>
<h2>Response Expectations</h2>
<p>Acknowledge messages within working hours. If you can't answer fully, say when you will.</p>
<h2>Escalation</h2>
<p>If something is blocked or at risk, raise it early to your manager.</p>`,
  },
  {
    key: "confidentiality",
    title: "Confidentiality",
    category: "Employee",
    summary: "What information must be kept confidential.",
    body: `<h1>Confidentiality</h1>
<p>Protecting information is everyone's responsibility. The following must always be kept confidential:</p>
<ul>
  <li>Customer information</li>
  <li>Pricing and quotations</li>
  <li>Internal documents</li>
  <li>Business strategies</li>
  <li>Employee information</li>
  <li>Project information</li>
  <li>Credentials and access</li>
  <li>Sales pipeline data</li>
</ul>
<p>Never share confidential information outside Editco without explicit approval.</p>`,
  },
  {
    key: "leave-attendance",
    title: "Leave & Attendance",
    category: "Employee",
    summary: "Working hours, attendance and the leave process.",
    body: `<h1>Leave &amp; Attendance</h1>
<h2>Working Hours</h2>
<p>Your working hours are agreed with your manager. Be present and available during them.</p>
<h2>Attendance</h2>
<p>Mark your attendance as per company process. Inform your manager if you'll be late or absent.</p>
<h2>Leave Process</h2>
<p>Apply for leave in advance and get manager approval. Plan a proper handover before you go.</p>
<h2>Emergency Leave</h2>
<p>Inform your manager as soon as possible and follow up with a formal request.</p>
<h2>Holidays</h2>
<p>Refer to the official holiday calendar shared by HR.</p>
<h2>Manager Approval</h2>
<p>All leave requires manager approval before it is confirmed.</p>
<h2>Leave Handover</h2>
<p>Document ongoing work and inform the relevant people before any planned leave.</p>
<blockquote>Exact leave entitlements are defined in the official Leave Policy maintained by HR.</blockquote>`,
  },
  {
    key: "employee-handbook",
    title: "Employee Handbook",
    category: "Employee",
    summary: "The essential handbook for every Editco employee.",
    body: `<h1>Employee Handbook</h1>
<p>This handbook summarizes what it means to work at Editco.</p>
<h2>Professional conduct</h2>
<p>Treat everyone with respect. Represent Editco well with customers and partners.</p>
<h2>Your responsibilities</h2>
<ul>
  <li>Deliver your work reliably and on time</li>
  <li>Communicate proactively</li>
  <li>Protect confidential information</li>
  <li>Follow company policies</li>
</ul>
<h2>Getting help</h2>
<p>Your manager and HR are here to support you. Ask questions early and often.</p>`,
  },
];

export const SALES_CONTENT: SeedContent[] = [
  {
    key: "sales-your-role",
    title: "Your Role — Sales & Business Development",
    category: "Sales",
    summary: "What your role is about and what success looks like.",
    body: `<h1>Your Role</h1>
<p>As part of Sales &amp; Business Development, you help Editco find, understand and win the right customers.</p>
<h2>What you own</h2>
<ul>
  <li>Finding and qualifying leads</li>
  <li>Understanding customer needs</li>
  <li>Presenting Editco's services clearly</li>
  <li>Coordinating proposals and following up</li>
  <li>Closing and handing over to delivery</li>
</ul>
<h2>What success looks like</h2>
<p>Consistent activity, clean records, honest communication and steady pipeline progress.</p>`,
  },
  {
    key: "sales-handbook",
    title: "Sales Handbook",
    category: "Sales",
    summary: "The complete guide to selling the Editco way.",
    body: `<h1>Sales Handbook</h1>
<p>This handbook is your reference for day-to-day selling at Editco.</p>
<h2>Day-to-Day Work</h2>
<p>Plan your day around pipeline progress: new leads, active conversations and follow-ups.</p>
<h2>Daily Work System</h2>
<ol>
  <li>Review your pipeline every morning</li>
  <li>Reach out to new and pending leads</li>
  <li>Update records after every interaction</li>
  <li>Plan tomorrow before you log off</li>
</ol>
<h2>Reporting Structure</h2>
<p>You report to your Sales Manager. Share updates honestly and on time.</p>
<h2>Performance</h2>
<p>We measure activity, pipeline quality and outcomes — not just closed deals.</p>
<h2>Probation</h2>
<p>Your first months focus on learning the process and building healthy habits.</p>`,
  },
  {
    key: "sales-process",
    title: "Editco Sales Flow",
    category: "Sales",
    summary: "The step-by-step Editco sales process.",
    body: `<h1>Editco Sales Flow</h1>
<p>Every opportunity moves through the same clear stages:</p>
<ol>
  <li><strong>Find</strong> — identify a potential customer</li>
  <li><strong>Record</strong> — log the lead immediately</li>
  <li><strong>Connect</strong> — make first contact</li>
  <li><strong>Understand</strong> — learn their needs</li>
  <li><strong>Qualify</strong> — confirm fit and intent</li>
  <li><strong>Present</strong> — show how Editco helps</li>
  <li><strong>Coordinate</strong> — align internally</li>
  <li><strong>Proposal / Quotation</strong> — send a clear proposal</li>
  <li><strong>Follow Up</strong> — stay in touch</li>
  <li><strong>Close</strong> — confirm the deal</li>
  <li><strong>Handover</strong> — pass to delivery cleanly</li>
</ol>
<blockquote>Never skip <em>Record</em>. If it isn't logged, it doesn't exist.</blockquote>`,
  },
  {
    key: "sales-lead-management",
    title: "Lead Management",
    category: "Sales",
    summary: "How to capture, track and progress leads.",
    body: `<h1>Lead Management</h1>
<p>A healthy pipeline starts with disciplined lead management.</p>
<ul>
  <li>Record every lead the moment you get it</li>
  <li>Capture source, contact details and context</li>
  <li>Set a clear next action and date for each lead</li>
  <li>Update status after every interaction</li>
  <li>Never let a qualified lead go silent</li>
</ul>`,
  },
  {
    key: "sales-customer-communication",
    title: "Customer Communication Rules",
    category: "Sales",
    summary: "How to communicate with customers professionally.",
    body: `<h1>Customer Communication Rules</h1>
<ul>
  <li>Be prompt — acknowledge within working hours</li>
  <li>Be clear — avoid jargon, confirm next steps</li>
  <li>Be honest — never over-promise</li>
  <li>Keep records — log important conversations</li>
</ul>
<h2>When You Don't Know the Answer</h2>
<p>Say: "That's a great question — let me confirm and get back to you." Then check with your manager and follow up quickly. Never guess on pricing or commitments.</p>`,
  },
  {
    key: "sales-reporting",
    title: "Sales Reporting",
    category: "Sales",
    summary: "What to report and how often.",
    body: `<h1>Sales Reporting</h1>
<p>Reporting keeps the team aligned and helps you improve.</p>
<ul>
  <li>Daily: update your pipeline and activity</li>
  <li>Weekly: review progress with your manager</li>
  <li>Always: keep records accurate and current</li>
</ul>`,
  },
  {
    key: "sales-kpis",
    title: "Sales KPIs",
    category: "Sales",
    summary: "The key metrics that define good performance.",
    body: `<h1>Sales KPIs</h1>
<table>
  <thead><tr><th>KPI</th><th>What it measures</th></tr></thead>
  <tbody>
    <tr><td>Activity</td><td>Outreach and follow-ups completed</td></tr>
    <tr><td>Pipeline</td><td>Value and health of active opportunities</td></tr>
    <tr><td>Conversion</td><td>Movement from lead to closed</td></tr>
    <tr><td>Data quality</td><td>Accuracy and timeliness of records</td></tr>
  </tbody>
</table>`,
  },
  {
    key: "sales-first-30-days",
    title: "First 30 Days",
    category: "Sales",
    summary: "What to focus on in your first month.",
    body: `<h1>First 30 Days</h1>
<h2>Week 1</h2>
<p>Learn Editco, our services and the sales flow. Complete onboarding.</p>
<h2>Week 2</h2>
<p>Shadow conversations. Start recording and qualifying leads.</p>
<h2>Week 3</h2>
<p>Own your first conversations end to end with support.</p>
<h2>Week 4</h2>
<p>Run your pipeline independently and prepare for your 30-day review.</p>`,
  },
  {
    key: "sales-escalation",
    title: "Escalation & Team Coordination",
    category: "Sales",
    summary: "When and how to escalate, and coordinate with the team.",
    body: `<h1>Escalation &amp; Team Coordination</h1>
<h2>Internal Team Coordination</h2>
<p>Loop in delivery, design or operations early when an opportunity needs them.</p>
<h2>Escalation</h2>
<p>If a deal is at risk, a customer is unhappy, or you're blocked — escalate to your manager immediately. Early escalation is a strength, not a weakness.</p>`,
  },
];

export const TECH_CONTENT: SeedContent[] = [
  {
    key: "tech-your-role",
    title: "Your Role — Technology",
    category: "Technology",
    summary: "What full-time developers and technology interns own, and what success looks like.",
    body: `<h1>Your Role</h1>
<p>As part of Technology, you help Editco design, build and support working systems — websites, AI calling agents, workflow automations and CRM.</p>
<h2>Full-time developers own</h2>
<ul>
  <li>Understanding the business problem before writing code</li>
  <li>Building a working system, not a mockup</li>
  <li>Reviewing the work before calling it done</li>
  <li>Handing over cleanly and supporting what shipped</li>
  <li>Protecting client data and credentials</li>
</ul>
<h2>Technology interns own</h2>
<ul>
  <li>Learning the guidelines and the way we build</li>
  <li>Pairing with a developer on real work</li>
  <li>Shipping small, clearly scoped tasks with review</li>
  <li>Asking early when something is unclear</li>
</ul>
<h2>What success looks like</h2>
<p>Working software, clear updates, and client data that stays protected.</p>`,
  },
  {
    key: "tech-handbook",
    title: "Engineering Handbook",
    category: "Technology",
    summary: "The day-to-day reference for building at Editco.",
    body: `<h1>Engineering Handbook</h1>
<p>This handbook is your reference for day-to-day engineering at Editco.</p>
<h2>Day-to-Day Work</h2>
<p>Plan your day around the work that is assigned: what you will build, what is in review, and what is blocked.</p>
<h2>Daily Work System</h2>
<ol>
  <li>Pick up the work assigned to you</li>
  <li>Build against the agreed scope</li>
  <li>Update your status as you go</li>
  <li>Ask early when you are stuck or unsure</li>
  <li>Hand off a clear note before you log off</li>
</ol>
<h2>Reporting Structure</h2>
<p>You report to the manager set on your profile. Share updates honestly and on time.</p>
<h2>Performance</h2>
<p>We measure reliable delivery, quality of the build, and clear communication — not hours spent looking busy.</p>
<h2>Probation and internship</h2>
<p>Your first months focus on learning how we build and forming clean habits. Interns are expected to complete scoped tasks with review. Full-time developers are expected to take a slice of work through to handover.</p>`,
  },
  {
    key: "tech-how-we-build",
    title: "How We Build",
    category: "Technology",
    summary: "The step-by-step Editco delivery flow.",
    body: `<h1>How We Build</h1>
<p>Every piece of work moves through the same clear stages:</p>
<ol>
  <li><strong>Understand</strong> — learn the business and the problem</li>
  <li><strong>Confirm scope</strong> — agree what is in and what is out</li>
  <li><strong>Design</strong> — decide how the system should work</li>
  <li><strong>Build</strong> — ship a working system, not a mockup</li>
  <li><strong>Review</strong> — check it before calling it done</li>
  <li><strong>Launch</strong> — put it in front of the client</li>
  <li><strong>Handover and support</strong> — pass it on cleanly and stay available for fixes</li>
</ol>
<p>We build websites, AI calling agents, workflow automations and CRM &amp; lead systems. The flow is the same for each.</p>
<blockquote>Never skip <em>Confirm scope</em>. If it was not agreed, it is not part of the build.</blockquote>`,
  },
  {
    key: "tech-guidelines",
    title: "Engineering Guidelines",
    category: "Technology",
    summary: "The rules every developer and technology intern must follow.",
    body: `<h1>Engineering Guidelines</h1>
<p>Read these carefully. They apply to full-time developers and technology interns.</p>
<ul>
  <li><strong>Ship working builds.</strong> We deliver systems that run, not prototype promises.</li>
  <li><strong>No credentials in chat or repos.</strong> Passwords, keys and tokens stay in approved secret storage.</li>
  <li><strong>Never share client data</strong> outside the people who need it for the work.</li>
  <li><strong>Review before you call it done.</strong> Check the build, then ask for review.</li>
  <li><strong>Write what you changed.</strong> A short note so the next person can follow the work.</li>
  <li><strong>Do not guess on scope or timelines.</strong> Confirm with your manager before you promise a date or a feature.</li>
</ul>
<blockquote>If a guideline and a shortcut disagree, follow the guideline and tell your manager.</blockquote>`,
  },
  {
    key: "tech-tools-access",
    title: "Tools, Access & Environments",
    category: "Technology",
    summary: "How to get access and keep environments separate.",
    body: `<h1>Tools, Access &amp; Environments</h1>
<ul>
  <li>Ask for the access you need on day one. Do not borrow someone else's login.</li>
  <li>Use only approved accounts and tools.</li>
  <li>Keep local and development work separate from client production.</li>
  <li>Do not point a test at live client data unless your manager has approved it.</li>
  <li>If you suspect a leak, a shared password, or a key in the wrong place, report it immediately.</li>
</ul>`,
  },
  {
    key: "tech-client-communication",
    title: "Working With Clients & the Team",
    category: "Technology",
    summary: "How engineers communicate with clients, design and operations.",
    body: `<h1>Working With Clients &amp; the Team</h1>
<ul>
  <li>Confirm with your manager before promising a date or a feature</li>
  <li>Keep client messages professional, clear and honest</li>
  <li>Loop in design and operations early when the work needs them</li>
  <li>Write down decisions so the team is not relying on memory</li>
</ul>
<h2>When You Don't Know the Answer</h2>
<p>Say you will confirm and get back to them. Then check with your manager and follow up quickly. Never guess on scope, pricing or a delivery date.</p>`,
  },
  {
    key: "tech-reporting",
    title: "Status & Reporting",
    category: "Technology",
    summary: "What to report and how often.",
    body: `<h1>Status &amp; Reporting</h1>
<p>Reporting keeps the build visible and helps you get unblocked.</p>
<ul>
  <li>Daily: what moved, and what is blocked</li>
  <li>Weekly: review progress with your manager</li>
  <li>Same day: raise a blocker as soon as you hit it</li>
</ul>`,
  },
  {
    key: "tech-what-good-looks-like",
    title: "What Good Looks Like",
    category: "Technology",
    summary: "How we judge engineering work for full-time and intern roles.",
    body: `<h1>What Good Looks Like</h1>
<table>
  <thead><tr><th>Signal</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td>Reliability</td><td>Work lands when it was agreed, or the delay is raised early</td></tr>
    <tr><td>Quality</td><td>The build works and has been reviewed</td></tr>
    <tr><td>Clarity</td><td>Updates say what changed and what is blocked</td></tr>
    <tr><td>Ownership</td><td>The work is carried through handover, not dropped at "it runs on my machine"</td></tr>
  </tbody>
</table>
<h2>Interns</h2>
<p>You are measured on learning and on completing scoped tasks with review.</p>
<h2>Full-time</h2>
<p>You are measured on end-to-end ownership: from understanding the problem through handover and support.</p>`,
  },
  {
    key: "tech-first-30-days",
    title: "First 30 Days",
    category: "Technology",
    summary: "What to focus on in your first month, for interns and full-time.",
    body: `<h1>First 30 Days</h1>
<h2>Week 1</h2>
<p>Complete onboarding. Read the engineering guidelines. Get the access you need.</p>
<h2>Week 2</h2>
<p>Shadow a live build. Learn how scope, review and handover actually happen.</p>
<h2>Week 3</h2>
<p>Ship a small, scoped piece of work and take it through review.</p>
<h2>Week 4</h2>
<p>Full-time: own a slice of a build through handover. Intern: complete a supervised task and be ready to explain what you learned. Both paths prepare for the 30-day review.</p>`,
  },
  {
    key: "tech-escalation",
    title: "Escalation",
    category: "Technology",
    summary: "When and how to raise a problem.",
    body: `<h1>Escalation</h1>
<p>Tell your manager immediately when:</p>
<ul>
  <li>The requirements are unclear</li>
  <li>A client system is broken</li>
  <li>You suspect a security problem, including a leaked credential</li>
  <li>A task is blocked and you cannot move it today</li>
</ul>
<p>Early escalation is a strength. Waiting until the deadline is not.</p>`,
  },
];

export const DESIGN_CONTENT: SeedContent[] = [
  {
    key: "design-your-role",
    title: "Your Role — Design",
    category: "Design",
    summary: "What a designer owns at Editco and what success looks like.",
    body: `<h1>Your Role</h1>
<p>As part of Design, you shape how Editco and our clients look and feel — websites, brand identity, campaign visuals and product screens.</p>
<h2>What you own</h2>
<ul>
  <li>Understanding the brand and the brief before you open a file</li>
  <li>Designing work that can actually be built</li>
  <li>Reviewing with the team before you call it done</li>
  <li>Handing off files a developer or client can use</li>
  <li>Protecting client brand assets and unreleased work</li>
</ul>
<h2>What success looks like</h2>
<p>Clear visuals, files that match the agreed brief, and handoffs that do not need to be guessed.</p>`,
  },
  {
    key: "design-handbook",
    title: "Design Handbook",
    category: "Design",
    summary: "The day-to-day reference for designing at Editco.",
    body: `<h1>Design Handbook</h1>
<p>This handbook is your reference for day-to-day design at Editco.</p>
<h2>Daily work</h2>
<ol>
  <li>Check the brief and the feedback waiting on you</li>
  <li>Design against what was agreed</li>
  <li>Share progress before the file is "finished"</li>
  <li>Ask early when the direction is unclear</li>
  <li>Leave the file named and organised before you log off</li>
</ol>
<h2>Reporting</h2>
<p>You report to the manager set on your profile. Share updates honestly and on time.</p>
<h2>First months</h2>
<p>Your first months are for learning Editco's visual standard and forming a clean review habit. Do not invent a new brand system for a client unless the brief asks for one.</p>`,
  },
  {
    key: "design-how-we-design",
    title: "How We Design",
    category: "Design",
    summary: "The step-by-step Editco design flow.",
    body: `<h1>How We Design</h1>
<p>Every design job moves through the same stages:</p>
<ol>
  <li><strong>Understand</strong> — learn the brand, the audience and the job</li>
  <li><strong>Confirm the brief</strong> — agree what is in and what is out</li>
  <li><strong>Explore</strong> — try directions before polishing one</li>
  <li><strong>Design</strong> — produce the working screens or assets</li>
  <li><strong>Review</strong> — check it with your manager before the client sees it</li>
  <li><strong>Handoff</strong> — pass files, sizes and notes to build or to the client</li>
  <li><strong>Support</strong> — stay available for the fixes that come after launch</li>
</ol>
<blockquote>Never skip <em>Confirm the brief</em>. A beautiful file for the wrong job is not done.</blockquote>`,
  },
  {
    key: "design-guidelines",
    title: "Design Guidelines",
    category: "Design",
    summary: "The rules every designer must follow.",
    body: `<h1>Design Guidelines</h1>
<ul>
  <li><strong>Design what can be built.</strong> Screens and assets should match how Editco actually ships websites and campaigns.</li>
  <li><strong>Stay on the brand.</strong> Use the client's colours, type and logo as given. Do not restyle them on your own.</li>
  <li><strong>Name files clearly.</strong> A teammate should know what the file is without opening it.</li>
  <li><strong>Do not send client work from a personal account.</strong> Use approved tools and logins.</li>
  <li><strong>Review before you call it done.</strong> Check alignment, text, and export sizes, then ask for review.</li>
  <li><strong>Do not guess on scope or dates.</strong> Confirm with your manager before you promise a new page, a new concept, or a delivery day.</li>
</ul>`,
  },
  {
    key: "design-tools-handoff",
    title: "Tools, Files & Handoff",
    category: "Design",
    summary: "How to get access and hand work to the rest of the team.",
    body: `<h1>Tools, Files &amp; Handoff</h1>
<ul>
  <li>Ask for tool access on day one. Do not borrow someone else's login.</li>
  <li>Keep source files and exports separate. Do not overwrite the only copy.</li>
  <li>Export the sizes the brief asked for, and label them.</li>
  <li>When you hand off to technology, include what changed and anything that is still open.</li>
  <li>Client logos, photos and unreleased campaigns stay inside Editco until your manager says otherwise.</li>
</ul>`,
  },
  {
    key: "design-working-together",
    title: "Working With Clients & the Team",
    category: "Design",
    summary: "How designers communicate with clients, technology and marketing.",
    body: `<h1>Working With Clients &amp; the Team</h1>
<ul>
  <li>Confirm with your manager before promising a concept count, a page, or a date</li>
  <li>Keep client messages clear and professional</li>
  <li>Loop in technology when a design has to be built, and marketing when it is for a campaign</li>
  <li>Write down the decision so the next version is not based on memory</li>
</ul>
<p>If you do not know the answer, say you will confirm and get back to them. Then check with your manager.</p>`,
  },
  {
    key: "design-reporting",
    title: "Status & Reporting",
    category: "Design",
    summary: "What to report and how often.",
    body: `<h1>Status &amp; Reporting</h1>
<ul>
  <li>Daily: what moved, and what is blocked</li>
  <li>Weekly: review the work in progress with your manager</li>
  <li>Same day: raise a blocker, missing asset, or unclear brief as soon as you hit it</li>
</ul>`,
  },
  {
    key: "design-what-good-looks-like",
    title: "What Good Looks Like",
    category: "Design",
    summary: "How we judge design work.",
    body: `<h1>What Good Looks Like</h1>
<table>
  <thead><tr><th>Signal</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td>Fit</td><td>The work matches the brief and the brand</td></tr>
    <tr><td>Craft</td><td>Type, spacing and exports are checked</td></tr>
    <tr><td>Clarity</td><td>Updates say what changed and what feedback is open</td></tr>
    <tr><td>Handoff</td><td>The next person can build or publish without guessing</td></tr>
  </tbody>
</table>`,
  },
  {
    key: "design-first-30-days",
    title: "First 30 Days",
    category: "Design",
    summary: "What to focus on in your first month.",
    body: `<h1>First 30 Days</h1>
<h2>Week 1</h2>
<p>Complete onboarding. Read the design guidelines. Get access to the tools and recent client work.</p>
<h2>Week 2</h2>
<p>Shadow a live job from brief to handoff.</p>
<h2>Week 3</h2>
<p>Take a small, scoped piece — a section, a social size, or a screen — through review.</p>
<h2>Week 4</h2>
<p>Own a slice of a job through handoff and prepare for your 30-day review.</p>`,
  },
  {
    key: "design-escalation",
    title: "Escalation",
    category: "Design",
    summary: "When and how to raise a problem.",
    body: `<h1>Escalation</h1>
<p>Tell your manager immediately when:</p>
<ul>
  <li>The brief is unclear or keeps changing</li>
  <li>Brand assets or copy you need are missing</li>
  <li>A client is unhappy with a direction</li>
  <li>A file or login may have been shared with the wrong person</li>
</ul>
<p>Early escalation is a strength. Waiting until the presentation is not.</p>`,
  },
];

export const MARKETING_CONTENT: SeedContent[] = [
  {
    key: "marketing-your-role",
    title: "Your Role — Marketing",
    category: "Marketing",
    summary: "What a marketing hire owns at Editco and what success looks like.",
    body: `<h1>Your Role</h1>
<p>As part of Marketing, you help Editco and our clients turn attention into pipeline — campaigns, content, SEO and the story around websites, AI calling agents and growth systems.</p>
<h2>What you own</h2>
<ul>
  <li>Understanding the audience and the goal before you publish</li>
  <li>Planning work that sales and design can actually run</li>
  <li>Keeping claims honest — we do not promise results we have not agreed</li>
  <li>Reporting what ran and what it did</li>
  <li>Protecting unreleased campaigns and client data</li>
</ul>
<h2>What success looks like</h2>
<p>Clear plans, published work that matches the brief, and numbers you can explain.</p>`,
  },
  {
    key: "marketing-handbook",
    title: "Marketing Handbook",
    category: "Marketing",
    summary: "The day-to-day reference for marketing at Editco.",
    body: `<h1>Marketing Handbook</h1>
<p>This handbook is your reference for day-to-day marketing at Editco.</p>
<h2>Daily work</h2>
<ol>
  <li>Check what is scheduled, in review, and blocked</li>
  <li>Move the next piece of the plan</li>
  <li>Update the record after something publishes or a number changes</li>
  <li>Ask early when the offer or the audience is unclear</li>
  <li>Note tomorrow's priority before you log off</li>
</ol>
<h2>Reporting</h2>
<p>You report to the manager set on your profile. Share updates honestly, including when a campaign is quiet.</p>
<h2>First months</h2>
<p>Your first months are for learning Editco's services and how we talk about them. Do not invent a new offer or a discount.</p>`,
  },
  {
    key: "marketing-how-campaigns-move",
    title: "How Campaigns Move",
    category: "Marketing",
    summary: "The step-by-step Editco marketing flow.",
    body: `<h1>How Campaigns Move</h1>
<p>Every campaign moves through the same stages:</p>
<ol>
  <li><strong>Understand</strong> — learn the audience, the offer and the goal</li>
  <li><strong>Confirm the brief</strong> — agree channel, message and what success means</li>
  <li><strong>Plan</strong> — set the pieces, owners and dates</li>
  <li><strong>Create</strong> — draft the content with design when visuals are needed</li>
  <li><strong>Review</strong> — check claims and creative with your manager before it goes live</li>
  <li><strong>Publish</strong> — put it in front of the audience</li>
  <li><strong>Measure</strong> — report what happened and what to change</li>
</ol>
<blockquote>Never skip <em>Confirm the brief</em>. A post without an agreed goal is not a campaign.</blockquote>`,
  },
  {
    key: "marketing-guidelines",
    title: "Marketing Guidelines",
    category: "Marketing",
    summary: "The rules every marketing hire must follow.",
    body: `<h1>Marketing Guidelines</h1>
<ul>
  <li><strong>Tell the truth about what we do.</strong> Websites, AI calling agents, automations, design and growth systems — no invented features.</li>
  <li><strong>Do not publish a price, discount or guarantee</strong> unless your manager has confirmed it.</li>
  <li><strong>Keep client names and results confidential</strong> unless we have permission to share them.</li>
  <li><strong>Review before it goes live.</strong> Check the link, the claim and the creative.</li>
  <li><strong>Record what you published</strong> so the team can see it later.</li>
  <li><strong>Use approved accounts only.</strong> Do not run a client or Editco channel from a personal login.</li>
</ul>`,
  },
  {
    key: "marketing-tools-access",
    title: "Tools, Channels & Access",
    category: "Marketing",
    summary: "How to get access and keep channels in the right place.",
    body: `<h1>Tools, Channels &amp; Access</h1>
<ul>
  <li>Ask for access on day one. Do not share or borrow passwords.</li>
  <li>Keep draft work separate from live posts and ads.</li>
  <li>Do not point a test at a live client audience unless your manager has approved it.</li>
  <li>If a login, pixel or unpublished post may have leaked, report it the same day.</li>
</ul>`,
  },
  {
    key: "marketing-working-together",
    title: "Working With Clients & the Team",
    category: "Marketing",
    summary: "How marketing works with sales, design and clients.",
    body: `<h1>Working With Clients &amp; the Team</h1>
<ul>
  <li>Confirm with your manager before promising a channel, a budget or a date</li>
  <li>Loop in design for visuals and sales when a campaign should create conversations</li>
  <li>Keep client messages professional and specific</li>
  <li>Write down what was approved so the live version matches it</li>
</ul>
<p>If you do not know the answer, say you will confirm and follow up. Never guess on pricing or results.</p>`,
  },
  {
    key: "marketing-reporting",
    title: "Status & Reporting",
    category: "Marketing",
    summary: "What to report and how often.",
    body: `<h1>Status &amp; Reporting</h1>
<ul>
  <li>Daily: what moved, and what is blocked</li>
  <li>Weekly: what was published and what the numbers show, in plain language</li>
  <li>Same day: raise a blocker, a rejected ad, or a wrong claim as soon as you see it</li>
</ul>`,
  },
  {
    key: "marketing-what-good-looks-like",
    title: "What Good Looks Like",
    category: "Marketing",
    summary: "How we judge marketing work.",
    body: `<h1>What Good Looks Like</h1>
<table>
  <thead><tr><th>Signal</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td>Fit</td><td>The work matches the audience and the agreed offer</td></tr>
    <tr><td>Honesty</td><td>Claims, prices and client names were approved</td></tr>
    <tr><td>Rhythm</td><td>Work publishes when it was planned, or the delay is raised early</td></tr>
    <tr><td>Learning</td><td>You can say what happened and what to change next</td></tr>
  </tbody>
</table>`,
  },
  {
    key: "marketing-first-30-days",
    title: "First 30 Days",
    category: "Marketing",
    summary: "What to focus on in your first month.",
    body: `<h1>First 30 Days</h1>
<h2>Week 1</h2>
<p>Complete onboarding. Read the marketing guidelines. Get access to the channels and recent campaigns.</p>
<h2>Week 2</h2>
<p>Shadow a live campaign from brief to the numbers.</p>
<h2>Week 3</h2>
<p>Draft a small, scoped piece and take it through review before it publishes.</p>
<h2>Week 4</h2>
<p>Own a slice of a plan through publish and measurement, and prepare for your 30-day review.</p>`,
  },
  {
    key: "marketing-escalation",
    title: "Escalation",
    category: "Marketing",
    summary: "When and how to raise a problem.",
    body: `<h1>Escalation</h1>
<p>Tell your manager immediately when:</p>
<ul>
  <li>The offer, audience or claim is unclear</li>
  <li>Something incorrect may already be live</li>
  <li>A client is unhappy with a campaign</li>
  <li>An account, budget or unpublished asset may have been exposed</li>
</ul>
<p>Early escalation is a strength. Taking a live mistake down late is not a plan.</p>`,
  },
];

export interface SeedPolicy {
  key: string;
  title: string;
  category: string;
  description: string;
  body: string;
}

export const POLICIES: SeedPolicy[] = [
  {
    key: "code-of-conduct",
    title: "Code of Conduct",
    category: "Employee",
    description: "Expected standards of professional behavior.",
    body: `<h1>Code of Conduct</h1>
<p>Every Editco employee is expected to act with integrity, treat others with respect, and represent the company professionally at all times.</p>
<ul>
  <li>Act honestly and ethically</li>
  <li>Treat colleagues and customers with respect</li>
  <li>Avoid conflicts of interest</li>
  <li>Follow all company policies and applicable laws</li>
</ul>`,
  },
  {
    key: "confidentiality-policy",
    title: "Confidentiality Policy",
    category: "Employee",
    description: "Obligations regarding confidential information.",
    body: `<h1>Confidentiality Policy</h1>
<p>You will have access to confidential information including customer data, pricing, strategies and credentials. You agree to protect this information during and after your employment, and to use it only for legitimate Editco business.</p>`,
  },
  {
    key: "data-security-policy",
    title: "Data Security Policy",
    category: "Employee",
    description: "How to handle data and systems securely.",
    body: `<h1>Data Security Policy</h1>
<ul>
  <li>Use strong, unique passwords and enable MFA where available</li>
  <li>Never share your credentials</li>
  <li>Lock your device when away</li>
  <li>Only store company data in approved systems</li>
  <li>Report any suspected security incident immediately</li>
</ul>`,
  },
  {
    key: "it-acceptable-use",
    title: "IT & Acceptable Use Policy",
    category: "Employee",
    description: "Acceptable use of Editco systems and devices.",
    body: `<h1>IT &amp; Acceptable Use Policy</h1>
<p>Company systems and devices are provided for work. Use them responsibly, keep them secure, and do not install unapproved software or use them for unlawful purposes.</p>`,
  },
  {
    key: "leave-policy",
    title: "Leave Policy",
    category: "Employee",
    description: "The official leave entitlements and process.",
    body: `<h1>Leave Policy</h1>
<p>This policy defines Editco's leave entitlements and process. Entitlements are maintained by HR and may be updated from time to time.</p>
<p>All leave requires prior manager approval except in genuine emergencies, which must be communicated as early as possible.</p>`,
  },
];

export interface SeedDocument {
  key: string;
  name: string;
  description: string;
  required: boolean;
  category: string;
  allowedTypes: string[];
}

export const DOCUMENTS: SeedDocument[] = [
  { key: "pan-card", name: "PAN Card", description: "A clear scan or photo of your PAN card.", required: true, category: "Identity", allowedTypes: ["pdf", "jpg", "jpeg", "png"] },
  { key: "id-proof", name: "Identity Proof (Aadhaar / Passport)", description: "Government-issued photo ID.", required: true, category: "Identity", allowedTypes: ["pdf", "jpg", "jpeg", "png"] },
  { key: "bank-details", name: "Bank Details (Cancelled Cheque / Passbook)", description: "For salary processing.", required: true, category: "Finance", allowedTypes: ["pdf", "jpg", "jpeg", "png"] },
  { key: "passport-photo", name: "Passport-size Photograph", description: "Recent passport-size photo.", required: true, category: "Personal", allowedTypes: ["jpg", "jpeg", "png"] },
  { key: "education-certificate", name: "Educational Certificate", description: "Highest qualification certificate.", required: true, category: "Education", allowedTypes: ["pdf", "jpg", "jpeg", "png"] },
  { key: "relieving-letter", name: "Previous Relieving Letter", description: "If applicable, from your previous employer.", required: false, category: "Employment", allowedTypes: ["pdf"] },
  { key: "signed-offer", name: "Signed Offer Letter", description: "Your countersigned Editco offer letter.", required: true, category: "Employment", allowedTypes: ["pdf"] },
];

export interface SeedTraining {
  key: string;
  title: string;
  description: string;
  category: string;
  contentType: "text" | "video" | "pdf" | "image" | "external" | "checklist";
  body: string;
  resourceUrl?: string;
  checklist?: string[];
  estimatedMinutes: number;
}

export const TRAINING: SeedTraining[] = [
  {
    key: "training-editco-101",
    title: "Editco 101 Training",
    description: "The foundational training every new joiner completes.",
    category: "Company",
    contentType: "text",
    estimatedMinutes: 20,
    body: `<h1>Editco 101 Training</h1>
<p>Work through this module to understand how Editco operates. When you're done, mark it complete and take the Editco Fundamentals assessment.</p>
<h2>Key takeaways</h2>
<ul>
  <li>Editco's mission, values and teams</li>
  <li>How we communicate</li>
  <li>What confidentiality means here</li>
  <li>Where to get help</li>
</ul>`,
  },
  {
    key: "training-communication",
    title: "Communication Essentials",
    description: "Practical communication standards at Editco.",
    category: "Company",
    contentType: "checklist",
    estimatedMinutes: 15,
    body: `<h1>Communication Essentials</h1><p>Confirm you understand and will follow each standard below.</p>`,
    checklist: [
      "I will acknowledge messages within working hours",
      "I will keep customer communication professional",
      "I will escalate blockers early",
      "I will keep records of important conversations",
    ],
  },
  {
    key: "training-confidentiality",
    title: "Confidentiality & Data Security",
    description: "Protecting information and systems.",
    category: "Company",
    contentType: "text",
    estimatedMinutes: 15,
    body: `<h1>Confidentiality &amp; Data Security</h1>
<p>Review the Confidentiality and Data Security policies, then complete this module.</p>
<ul>
  <li>Keep customer and company data confidential</li>
  <li>Use approved systems only</li>
  <li>Protect your credentials</li>
  <li>Report incidents immediately</li>
</ul>`,
  },
  {
    key: "training-sales-fundamentals",
    title: "Sales Fundamentals",
    description: "The Editco sales flow and daily system.",
    category: "Sales",
    contentType: "text",
    estimatedMinutes: 25,
    body: `<h1>Sales Fundamentals</h1>
<p>Master the Editco sales flow: Find → Record → Connect → Understand → Qualify → Present → Coordinate → Proposal → Follow Up → Close → Handover.</p>
<p>Complete this module before taking the Sales Fundamentals assessment.</p>`,
  },
  {
    key: "training-tech-fundamentals",
    title: "Technology Fundamentals",
    description: "The Editco build flow and engineering guidelines.",
    category: "Technology",
    contentType: "text",
    estimatedMinutes: 25,
    body: `<h1>Technology Fundamentals</h1>
<p>Master the Editco build flow: Understand → Confirm scope → Design → Build → Review → Launch → Handover and support.</p>
<p>Before you take the assessment, confirm you will follow these guidelines:</p>
<ul>
  <li>Ship working builds, not mockups</li>
  <li>Keep credentials out of chat and repos</li>
  <li>Never share client data outside the people who need it</li>
  <li>Review the work before calling it done</li>
  <li>Write what you changed</li>
  <li>Confirm scope and timelines with your manager before you promise them</li>
  <li>Raise blockers, broken client systems and security concerns the same day</li>
</ul>
<p>Complete this module before taking the Technology Fundamentals assessment.</p>`,
  },
  {
    key: "training-design-fundamentals",
    title: "Design Fundamentals",
    description: "The Editco design flow and guidelines.",
    category: "Design",
    contentType: "text",
    estimatedMinutes: 20,
    body: `<h1>Design Fundamentals</h1>
<p>Master the Editco design flow: Understand → Confirm the brief → Explore → Design → Review → Handoff → Support.</p>
<ul>
  <li>Design what can be built, on the client's brand</li>
  <li>Name files so the next person can find them</li>
  <li>Review before you call it done</li>
  <li>Confirm scope and dates with your manager before you promise them</li>
  <li>Keep client assets inside approved tools</li>
</ul>
<p>Complete this module before taking the Design Fundamentals assessment.</p>`,
  },
  {
    key: "training-marketing-fundamentals",
    title: "Marketing Fundamentals",
    description: "The Editco campaign flow and guidelines.",
    category: "Marketing",
    contentType: "text",
    estimatedMinutes: 20,
    body: `<h1>Marketing Fundamentals</h1>
<p>Master how campaigns move: Understand → Confirm the brief → Plan → Create → Review → Publish → Measure.</p>
<ul>
  <li>Do not invent offers, prices or guarantees</li>
  <li>Do not publish a client name or result without permission</li>
  <li>Review claims and creative before anything goes live</li>
  <li>Use approved accounts only</li>
  <li>Raise a live mistake or a leaked login the same day</li>
</ul>
<p>Complete this module before taking the Marketing Fundamentals assessment.</p>`,
  },
];

export interface SeedAssessmentQuestion {
  type: "mcq" | "truefalse" | "short";
  prompt: string;
  options: string[];
  correctIndex: number;
  correctText?: string;
  points: number;
}
export interface SeedAssessment {
  key: string;
  title: string;
  description: string;
  category: string;
  passingScore: number;
  maxAttempts: number;
  questions: SeedAssessmentQuestion[];
}

export const ASSESSMENTS: SeedAssessment[] = [
  {
    key: "assessment-editco-fundamentals",
    title: "Editco Fundamentals",
    description: "Confirms you've understood the company essentials.",
    category: "Company",
    passingScore: 70,
    maxAttempts: 3,
    questions: [
      {
        type: "mcq",
        prompt: "Who is your first point of contact when you're unsure about something?",
        options: ["A random colleague", "Your reporting manager", "The customer", "Nobody"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "truefalse",
        prompt: "Customer pricing and quotations are confidential.",
        options: ["True", "False"],
        correctIndex: 0,
        points: 1,
      },
      {
        type: "mcq",
        prompt: "Which of these best reflects the Editco Way?",
        options: [
          "Act first, ask later",
          "Take ownership and communicate clearly",
          "Avoid difficult conversations",
          "Keep problems to yourself",
        ],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "truefalse",
        prompt: "You should acknowledge messages within working hours.",
        options: ["True", "False"],
        correctIndex: 0,
        points: 1,
      },
      {
        type: "short",
        prompt: "In one word, what should you do the moment you receive a new lead? (hint: record it)",
        options: [],
        correctIndex: 0,
        correctText: "record",
        points: 1,
      },
    ],
  },
  {
    key: "assessment-sales-fundamentals",
    title: "Sales Fundamentals",
    description: "Confirms you've understood the Editco sales flow.",
    category: "Sales",
    passingScore: 70,
    maxAttempts: 3,
    questions: [
      {
        type: "mcq",
        prompt: "What is the correct first step of the Editco Sales Flow?",
        options: ["Close", "Find", "Proposal", "Handover"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "truefalse",
        prompt: "If a lead isn't recorded, we treat it as if it doesn't exist.",
        options: ["True", "False"],
        correctIndex: 0,
        points: 1,
      },
      {
        type: "mcq",
        prompt: "A customer asks about pricing you're unsure of. You should:",
        options: [
          "Guess a number",
          "Ignore the question",
          "Confirm with your manager and follow up",
          "Offer a big discount",
        ],
        correctIndex: 2,
        points: 1,
      },
      {
        type: "mcq",
        prompt: "What comes immediately after 'Proposal / Quotation'?",
        options: ["Find", "Follow Up", "Connect", "Qualify"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "truefalse",
        prompt: "Escalating a blocked deal early is a strength.",
        options: ["True", "False"],
        correctIndex: 0,
        points: 1,
      },
    ],
  },
  {
    key: "assessment-tech-fundamentals",
    title: "Technology Fundamentals",
    description: "Confirms you've understood the Editco build flow and engineering guidelines.",
    category: "Technology",
    passingScore: 70,
    maxAttempts: 3,
    questions: [
      {
        type: "mcq",
        prompt: "What is the correct first step of How We Build?",
        options: ["Launch", "Understand", "Review", "Handover"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "truefalse",
        prompt: "Credentials may be pasted into chat or committed to a repo if the team needs them quickly.",
        options: ["True", "False"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "mcq",
        prompt: "A client asks for a delivery date you are not sure about. You should:",
        options: [
          "Guess a date so they feel confident",
          "Promise the fastest possible timeline",
          "Confirm with your manager and follow up",
          "Ignore the question",
        ],
        correctIndex: 2,
        points: 1,
      },
      {
        type: "mcq",
        prompt: "What comes immediately after Build?",
        options: ["Understand", "Review", "Confirm scope", "Design"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "truefalse",
        prompt: "A blocked task, a broken client system, or a suspected security issue should be raised with your manager the same day.",
        options: ["True", "False"],
        correctIndex: 0,
        points: 1,
      },
    ],
  },
  {
    key: "assessment-design-fundamentals",
    title: "Design Fundamentals",
    description: "Confirms you've understood the Editco design flow and guidelines.",
    category: "Design",
    passingScore: 70,
    maxAttempts: 3,
    questions: [
      {
        type: "mcq",
        prompt: "What is the correct first step of How We Design?",
        options: ["Handoff", "Understand", "Review", "Explore"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "truefalse",
        prompt: "You may restyle a client's logo or colours if you think the new version looks better.",
        options: ["True", "False"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "mcq",
        prompt: "A client asks for an extra concept and a delivery date you have not agreed. You should:",
        options: [
          "Promise both so the client stays happy",
          "Ignore the request",
          "Confirm with your manager and follow up",
          "Send a rough version from your personal account",
        ],
        correctIndex: 2,
        points: 1,
      },
      {
        type: "mcq",
        prompt: "What comes immediately after Design?",
        options: ["Understand", "Review", "Explore", "Confirm the brief"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "truefalse",
        prompt: "An unclear brief, a missing asset, or a file shared with the wrong person should be raised with your manager the same day.",
        options: ["True", "False"],
        correctIndex: 0,
        points: 1,
      },
    ],
  },
  {
    key: "assessment-marketing-fundamentals",
    title: "Marketing Fundamentals",
    description: "Confirms you've understood how Editco campaigns move.",
    category: "Marketing",
    passingScore: 70,
    maxAttempts: 3,
    questions: [
      {
        type: "mcq",
        prompt: "What is the correct first step of How Campaigns Move?",
        options: ["Publish", "Understand", "Measure", "Create"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "truefalse",
        prompt: "You may publish a discount or a results guarantee if it will help the campaign perform.",
        options: ["True", "False"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "mcq",
        prompt: "You want to mention a client result in a post. You should:",
        options: [
          "Post it if the result is true",
          "Wait until you have permission and your manager has reviewed it",
          "Post it from a personal account",
          "Skip review if the deadline is today",
        ],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "mcq",
        prompt: "What comes immediately after Publish?",
        options: ["Plan", "Measure", "Understand", "Create"],
        correctIndex: 1,
        points: 1,
      },
      {
        type: "truefalse",
        prompt: "A wrong claim that is already live should be raised with your manager the same day.",
        options: ["True", "False"],
        correctIndex: 0,
        points: 1,
      },
    ],
  },
];
