import Link from "next/link";

export const metadata = {
  title: "YTauto — How it works",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-text">
        {children}
      </div>
    </section>
  );
}

function Card({
  badge,
  title,
  blurb,
  color,
}: {
  badge: string;
  title: string;
  blurb: string;
  color: string;
}) {
  return (
    <div className="bg-bg-card border border-line rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {badge}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-text-muted leading-relaxed">{blurb}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="hidden lg:flex items-center justify-center text-text-muted">
      →
    </div>
  );
}

export default function InfoPage() {
  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-10 py-6 max-w-4xl mx-auto">
      <header className="mb-2">
        <div className="text-xs uppercase tracking-widest text-text-muted">
          YTauto
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">How it works</h1>
        <p className="text-text-muted text-sm mt-1 max-w-prose">
          A plain-English tour of every moving piece. Read once, then ignore.
        </p>
      </header>

      <Section title="The big picture">
        <p>
          YTauto is a small factory for MS Paint-style explainer videos. You
          pick a flavor, push a button, and a handful of separate AI workers
          team up to research, organize, write, and visually plan a 10-minute
          video. None of them are trying to do everything at once — that's the
          trick.
        </p>
        <p className="text-text-muted">
          Two tabs, two jobs:{" "}
          <Link href="/" className="text-accent hover:underline">
            Analytics
          </Link>{" "}
          tells you what to make.{" "}
          <Link href="/studio" className="text-accent hover:underline">
            Studio
          </Link>{" "}
          actually makes it — title forge, route mapper, and the AI pipeline
          all live there as stacked sections.
        </p>
      </Section>

      <Section title="Analytics — what's worth making right now">
        <p>
          Picks a category, finds the top 8–12 minute videos people are watching
          in it this week, and ranks them by a simple proxy score: views,
          engagement, how fast they're picking up steam. You're not copying
          these videos — you're using them as a sonar ping for what the audience
          is in the mood for.
        </p>
      </Section>

      <Section title="Studio — three sections, stacked">
        <p className="text-text-muted">
          The Studio page is a sequence. You can start at any step, or skip
          straight to the pipeline. Each step's output flows into the next, but
          nothing is locked in — edit, reroll, or backtrack at any point.
        </p>
        <ol className="mt-2 space-y-3 text-sm">
          <li className="bg-bg-card border border-line rounded-lg p-3">
            <span className="font-semibold">Title Forge</span> — type a rough
            idea, pull the lever, five title candidates roll out in different
            hook styles. Click <em>use this</em> on the one you like.
          </li>
          <li className="bg-bg-card border border-line rounded-lg p-3">
            <span className="font-semibold">Route Mapper</span> — the
            "overview before the deep dive". Auto-fills with the title you
            picked (or paste your own). Returns a few genuinely different
            angles the video could take — character study, comedy of errors,
            systems critique, etc. Pick one to lock the direction.
          </li>
          <li className="bg-bg-card border border-line rounded-lg p-3">
            <span className="font-semibold">Pipeline</span> — the actual AI
            assembly line. Runs against either your picked title+route, or a
            plain genre if you skipped the first two. Four AIs hand work to
            each other — see the next section.
          </li>
        </ol>
      </Section>

      <Section title="The four AIs inside the pipeline">
        <p className="text-text-muted">
          Each does one thing well, then hands its work to the next. Tweak any
          one in its own file without touching the others.
        </p>

        <div className="grid lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-3 lg:items-stretch mt-2">
          <Card
            badge="1"
            title="The Deep Diver"
            color="#ff6b6b"
            blurb="The researcher. Surfaces weird, specific material — names, dates, numbers — for the script. If you picked a route, it stays on-angle. If you just gave it a genre, it ranges broadly."
          />
          <FlowArrow />
          <Card
            badge="2"
            title="The Organizer"
            color="#ffd93d"
            blurb="The editor. Reads the deep diver's pile, drops the weak finds, merges duplicates, re-orders so the strongest hook comes first. Hands the writer a clean story brief with beats."
          />
          <FlowArrow />
          <Card
            badge="3"
            title="The Script Writer"
            color="#6bcb77"
            blurb="The voice. Takes one story brief and writes a 3-minute narrated script in a sharp, conversational tone — not the textbook drone most AI writes. Several of these glue together into a ~10-minute video."
          />
          <FlowArrow />
          <Card
            badge="4"
            title="The Cluster Analyzer"
            color="#4d96ff"
            blurb="The visual planner. Slices the finished script into chunks, each chunk getting a color and a 'draw this' note. Hover any colored span in the script to see what to draw there in MS Paint."
          />
        </div>
      </Section>

      <Section title="Two helpers on the side: Title Forge & Route Mapper">
        <p>
          These two live above the pipeline in the Studio page. They're
          optional but useful: <strong>Title Forge</strong> is a slot machine
          for hook-driven titles in mixed styles (declarative, question,
          contrarian, mystery, etc.), so you're picking between real
          alternatives instead of five rewrites of the same line.{" "}
          <strong>Route Mapper</strong> takes the title you chose and asks
          "okay, but <em>which</em> video is this?" — surfacing a few
          structurally different angles before you commit research time.
        </p>
        <p className="text-text-muted">
          Both are intentionally noisy. The little badges next to each result
          (hook style, treatment, "why this works") exist so you can compare
          on substance, not just vibes.
        </p>
      </Section>

      <Section title="Why it doesn't sound like AI">
        <p>
          Three deliberate choices, all reversible:
        </p>
        <ul className="space-y-2 list-disc list-inside marker:text-accent">
          <li>
            <strong>One job per AI.</strong> A researcher prompt and a writer
            prompt are different files. Each is short, focused, and tuned for
            one thing. Generic "do everything" prompts are what give AI content
            its plastic taste.
          </li>
          <li>
            <strong>The prompts are editable.</strong> Every AI's instructions
            live in their own file under{" "}
            <code className="text-xs bg-bg-elevated px-1 py-0.5 rounded">
              backend/app/ai/prompts/
            </code>
            . Open one, change a line, save. You can keep alt versions side by
            side and A/B them.
          </li>
          <li>
            <strong>Not vendor-locked.</strong> Today it talks to Gemini. To
            swap to another model later, you add one file and flip an env var.
            The four AIs and the UI don't change.
          </li>
        </ul>
      </Section>

      <Section title="What's not here yet (on purpose)">
        <p className="text-text-muted">
          This is a skeleton. There's no voice synthesis, no MS Paint render
          pipeline, no upload to YouTube, no analytics on what shipped. Those
          are deliberate next milestones — the goal right now is to get a clean
          enough script + visual plan that the rest can hang off of it.
        </p>
      </Section>
    </main>
  );
}
