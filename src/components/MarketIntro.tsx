import {
  ArrowUpRight,
  CarFront,
  Check,
  CircleDollarSign,
  Leaf,
  ScanLine,
} from "lucide-react";

const EXAMPLES = [
  {
    industry: "Renewable Energy",
    country: "Germany",
    description: "Policy, clean power & the energy transition",
    icon: Leaf,
  },
  {
    industry: "Fintech",
    country: "India",
    description: "Digital payments & financial inclusion",
    icon: CircleDollarSign,
  },
  {
    industry: "Autonomous Vehicles",
    country: "United States",
    description: "Mobility, regulation & emerging technology",
    icon: CarFront,
  },
];

export function MarketHero() {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">
          <ScanLine size={13} />A wider perspective on your market
        </p>
        <h1>
          A clearer view of
          <br />
          <em>your next market.</em>
        </h1>
        <p className="hero-copy">
          Understand the forces shaping an industry. Explore risks, discover
          opportunities, and follow the evidence behind every finding.
        </p>
        <div className="hero-footnote">
          <span>
            <Check size={12} />
            Six PESTLE perspectives
          </span>
          <span>
            <Check size={12} />
            Sources you can inspect
          </span>
        </div>
      </div>
      <svg
        className="orbit-illustration"
        viewBox="0 0 360 300"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="orbit-grid"
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".7" fill="#d5dfd2" />
          </pattern>
        </defs>
        <rect x="24" y="4" width="312" height="292" fill="url(#orbit-grid)" />
        <circle cx="180" cy="150" r="111" fill="none" stroke="#d2ded1" />
        <circle
          cx="180"
          cy="150"
          r="73"
          fill="none"
          stroke="#cfddce"
          strokeDasharray="3 5"
        />
        {[
          [180, 39],
          [277, 94],
          [277, 206],
          [180, 261],
          [83, 206],
          [83, 94],
        ].map(([x, y], index) => (
          <g key={index}>
            <path d={`M180 150 L${x} ${y}`} stroke="#d9e2d4" />
            <circle cx={x} cy={y} r="18" fill="#fafcf7" stroke="#c4d4be" />
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              fontFamily="Arial"
              fontSize="11"
              fill="#597457"
            >
              {["P", "E", "S", "T", "L", "E"][index]}
            </text>
          </g>
        ))}
        <circle cx="180" cy="150" r="37" fill="#e4eddb" stroke="#a7bf9a" />
        <circle cx="180" cy="150" r="26" fill="none" stroke="#8ba97f" />
        <path d="m193 136-8 20-18 9 8-20Z" fill="#2e6a50" />
        <circle cx="180" cy="150" r="3" fill="#e4eddb" />
        <text
          x="180"
          y="298"
          textAnchor="middle"
          fontFamily="Arial"
          fontSize="8"
          letterSpacing="2"
          fill="#728970"
        >
          CONNECT THE SIGNALS
        </text>
      </svg>
    </section>
  );
}

export function MarketExamples({
  onSelect,
  disabled,
}: {
  onSelect: (industry: string, country: string) => void;
  disabled: boolean;
}) {
  return (
    <section
      className="examples-section no-print"
      aria-labelledby="examples-heading"
    >
      <div className="section-heading">
        <div>
          <h2 id="examples-heading">A little perspective, before you begin.</h2>
          <p>Explore a historical sample report. No scan allowance needed.</p>
        </div>
        <span className="muted" style={{ fontSize: 11 }}>
          Sample reports
        </span>
      </div>
      <div className="examples-grid">
        {EXAMPLES.map(({ industry, country, description, icon: Icon }) => (
          <button
            key={industry}
            disabled={disabled}
            className="panel example-card"
            onClick={() => onSelect(industry, country)}
            aria-label={`Explore sample: ${industry} in ${country}`}
          >
            <span className="example-icon">
              <Icon size={18} />
            </span>
            <h3>{industry}</h3>
            <p>
              {country} · {description}
            </p>
            <span className="example-bottom">
              Explore sample report
              <ArrowUpRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section className="how-section no-print" aria-labelledby="how-heading">
      <div className="section-heading">
        <h2 id="how-heading">From a question to a clearer picture.</h2>
      </div>
      <div className="how-grid">
        {[
          {
            title: "Choose your market",
            text: "Start with an industry and a country you want to understand.",
          },
          {
            title: "Explore the signals",
            text: "Review opportunities and risks across six PESTLE categories.",
          },
          {
            title: "Follow the evidence",
            text: "Inspect excerpts, open sources, and understand the scoring.",
          },
        ].map((step, index) => (
          <article className="how-step" key={step.title}>
            <span className="step-number">0{index + 1}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
