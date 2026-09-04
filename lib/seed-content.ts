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
];
