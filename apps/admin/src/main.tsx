import { StrictMode, useEffect, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  Zap,
  LayoutDashboard,
  Plug,
  Users,
  CalendarDays,
  ShieldCheck,
  MessagesSquare,
  ArrowUpRight,
  Search,
  LogOut,
  RefreshCw,
  ChevronRight,
  Activity,
  Check,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { db } from "./client";
import "./styles.css";
type Charger = {
  id: string;
  owner_id: string;
  title: string;
  address: string;
  connector: string;
  power_kw: number;
  price_per_kwh: number;
  status: string;
};
type Profile = {
  id: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
};
type Booking = {
  id: string;
  charger_id: string;
  driver_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  amount_paise: number;
  payment_status: string;
};
type Verification = {
  user_id: string;
  legal_name: string;
  evidence_note: string;
  status: string;
};
type Dispute = {
  id: string;
  booking_id: string;
  reason: string;
  status: string;
  resolution: string | null;
};
type Audit = { id: number; action: string; detail: string; created_at: string };
const sections = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Chargers", icon: Plug },
  { name: "Host verification", icon: ShieldCheck },
  { name: "Bookings", icon: CalendarDays },
  { name: "Users", icon: Users },
  { name: "Disputes", icon: MessagesSquare },
];
function App() {
  const [session, setSession] = useState<Session | null>(null),
    [allowed, setAllowed] = useState(false),
    [checking, setChecking] = useState(true),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [section, setSection] = useState("Overview"),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [chargers, setChargers] = useState<Charger[]>([]),
    [profiles, setProfiles] = useState<Profile[]>([]),
    [bookings, setBookings] = useState<Booking[]>([]),
    [hosts, setHosts] = useState<Verification[]>([]),
    [disputes, setDisputes] = useState<Dispute[]>([]),
    [audits, setAudits] = useState<Audit[]>([]),
    [review, setReview] = useState<{
      action: string;
      id: string;
      value: string;
      name: string;
    } | null>(null),
    [note, setNote] = useState("");
  useEffect(() => {
    if (!db) {
      setChecking(false);
      return;
    }
    let live = true;
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_e, s) => {
      if (live) {
        setSession(s);
        setAllowed(false);
        setChecking(!!s);
      }
    });
    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!session || !db) return;
    let live = true;
    void db.rpc("my_access").then(({ data, error }) => {
      if (!live) return;
      if (error) setError(error.message);
      setAllowed(!error && data?.admin === true);
      setChecking(false);
    });
    return () => {
      live = false;
    };
  }, [session]);
  async function load() {
    if (!db) return;
    setBusy(true);
    setError("");
    try {
      const result = await Promise.all([
        db
          .from("chargers")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        db
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        db
          .from("bookings")
          .select("*")
          .order("starts_at", { ascending: false })
          .limit(500),
        db.from("host_verifications").select("*").limit(500),
        db
          .from("disputes")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        db
          .from("admin_audit")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(15),
      ]);
      for (const r of result) if (r.error) throw r.error;
      setChargers(result[0].data as Charger[]);
      setProfiles(result[1].data as Profile[]);
      setBookings(result[2].data as Booking[]);
      setHosts(result[3].data as Verification[]);
      setDisputes(result[4].data as Dispute[]);
      setAudits(result[5].data as Audit[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (allowed) void load();
  }, [allowed]);
  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await db!.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function act(e: FormEvent) {
    e.preventDefault();
    if (!review) return;
    setBusy(true);
    try {
      const { error } = await db!.rpc("admin_action", {
        p_action: review.action,
        p_id: review.id,
        p_value: review.value,
        p_note: note,
      });
      if (error) throw error;
      setReview(null);
      setNote("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function request(action: string, id: string, value: string, name: string) {
    setError("");
    setNote("");
    setReview({ action, id, value, name });
  }
  function Badge({ status }: { status: string }) {
    return (
      <span className={`badge ${status}`}>{status.replaceAll("_", " ")}</span>
    );
  }
  const match = (s: string) => s.toLowerCase().includes(query.toLowerCase());
  const pending = chargers.filter((c) => c.status === "pending");
  if (checking)
    return (
      <main className="gate">
        <Zap size={40} />
        <p>Checking access…</p>
      </main>
    );
  if (!session || !allowed)
    return (
      <main className="auth">
        <div className="auth-story">
          <div className="brand">
            <img src="/brand/logo.png" alt="PlugNear" />
          </div>
          <span className="eyebrow">THE NEIGHBOURHOOD CHARGING NETWORK</span>
          <h1>
            A better charge.
            <br />A closer community.
          </h1>
          <p>Powering everyday journeys, one trusted connection at a time.</p>
          <div className="auth-orbit">
            <Zap size={90} />
          </div>
          <small>BUILT FOR INDIA. POWERED BY PEOPLE.</small>
        </div>
        <div className="auth-form">
          <div className="brand mobile-brand">
            <img src="/brand/logo.png" alt="PlugNear" />
          </div>
          <span className="eyebrow">PLUGNEAR OPERATIONS</span>
          <h2>
            Welcome to your
            <br />
            control centre.
          </h2>
          <p>Manage a network people can rely on.</p>
          {!db ? (
            <div className="notice">
              Configure the dedicated PlugNear publishable key to connect this
              dashboard.
            </div>
          ) : session ? (
            <>
              <div className="notice">
                Administrator access is required. Access is assigned by an
                authorized database administrator.
              </div>
              <button onClick={() => void db!.auth.signOut()}>Sign out</button>
            </>
          ) : (
            <form onSubmit={(e) => void login(e)}>
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button disabled={busy}>
                {busy ? "Signing in…" : "Sign in to operations"}
                <ArrowUpRight size={18} />
              </button>
            </form>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <small>
            Restricted access · All administrative actions are audited
          </small>
        </div>
      </main>
    );
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <img src="/brand/logo.png" alt="PlugNear" />
        </div>
        <span className="sidebar-label">WORKSPACE</span>
        <nav>
          {sections.map(({ name, icon: Icon }) => (
            <button
              className={section === name ? "nav active" : "nav"}
              key={name}
              onClick={() => {
                setSection(name);
                setQuery("");
              }}
            >
              <Icon size={18} />
              {name}
              {name === "Chargers" && pending.length > 0 && (
                <span className="count">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="network">
            <span className="dot" /> India network <span>IN</span>
          </div>
          <button className="nav" onClick={() => void db!.auth.signOut()}>
            <LogOut size={18} />
            Sign out
          </button>
          <div className="account-avatar">
            <span>PN</span>
            <div>
              <strong>Network administrator</strong>
              <small>{session.user.email}</small>
            </div>
          </div>
        </div>
      </aside>
      <main className="workspace">
        <header>
          <div>
            Workspace <ChevronRight size={14} /> <strong>{section}</strong>
          </div>
          <div>
            <span className="dot" /> Mumbai · ap-south-1
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">YOUR NETWORK, AT A GLANCE</span>
              <h1>
                {section === "Overview" ? "Let’s keep India moving." : section}
              </h1>
              <p>
                {section === "Overview"
                  ? "Every connection starts with a little trust. Here’s where things stand."
                  : "Review, manage and keep your community connected."}
              </p>
            </div>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => void load()}
            >
              <RefreshCw size={16} className={busy ? "spin" : ""} />
              Refresh
            </button>
          </div>
          {error && (
            <div role="alert" className="error notice">
              {error}
            </div>
          )}
          <div className="launch-notice">
            <ShieldCheck size={19} />
            <div>
              <strong>Pre-launch operations</strong>
              <span>
                Payments and store releases are not enabled. Data below comes
                from PlugNear.
              </span>
            </div>
            <span className="badge pending">Setup in progress</span>
          </div>
          {section === "Overview" && (
            <>
              <div className="metrics">
                {[
                  {
                    name: "Approved chargers",
                    value: chargers.filter((c) => c.status === "approved")
                      .length,
                    icon: Plug,
                    detail: `${pending.length} awaiting review`,
                  },
                  {
                    name: "Community members",
                    value: profiles.length,
                    icon: Users,
                    detail: "Registered PlugNear profiles",
                  },
                  {
                    name: "Active bookings",
                    value: bookings.filter((b) =>
                      ["requested", "confirmed"].includes(b.status),
                    ).length,
                    icon: CalendarDays,
                    detail: "Requested and confirmed",
                  },
                  {
                    name: "Open disputes",
                    value: disputes.filter((d) => d.status === "open").length,
                    icon: MessagesSquare,
                    detail: "Ready for your attention",
                  },
                ].map(({ name, value, icon: Icon, detail }) => (
                  <article className="metric" key={name}>
                    <div>
                      <span>{name}</span>
                      <Icon size={19} />
                    </div>
                    <strong>{value.toLocaleString("en-IN")}</strong>
                    <small>{detail}</small>
                  </article>
                ))}
              </div>
              <div className="overview-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>A little attention. A big difference.</h2>
                      <p>Charger applications waiting for your review.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setSection("Chargers")}
                    >
                      View all <ArrowUpRight size={16} />
                    </button>
                  </div>
                  {pending.length === 0 ? (
                    <Empty
                      title="You’re all caught up."
                      text="New charger applications will appear here when hosts join the network."
                    />
                  ) : (
                    pending.slice(0, 5).map((c) => (
                      <div className="review-row" key={c.id}>
                        <div className="charger-icon">
                          <Plug />
                        </div>
                        <div>
                          <strong>{c.title}</strong>
                          <small>{c.address}</small>
                        </div>
                        <Badge status={c.status} />
                        <button
                          className="secondary"
                          onClick={() =>
                            request("charger", c.id, "approved", c.title)
                          }
                        >
                          Review
                        </button>
                      </div>
                    ))
                  )}
                </section>
                <section className="community-card">
                  <span className="eyebrow">PEOPLE POWER THE NETWORK</span>
                  <div className="community-illustration">
                    <Zap size={70} />
                    <div className="orbit one" />
                    <div className="orbit two" />
                  </div>
                  <h2>
                    Local sockets.
                    <br />
                    Bigger possibilities.
                  </h2>
                  <p>
                    Verify each host and review their charger before welcoming
                    them into the network.
                  </p>
                  <button onClick={() => setSection("Host verification")}>
                    Review hosts <ArrowUpRight size={17} />
                  </button>
                </section>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Network activity</h2>
                    <p>A record of the decisions that keep PlugNear trusted.</p>
                  </div>
                  <Activity size={20} />
                </div>
                {audits.length === 0 ? (
                  <Empty
                    title="A fresh start for the network."
                    text="Verified hosts, approvals and resolutions will be recorded here."
                  />
                ) : (
                  audits.map((a) => (
                    <div className="audit" key={a.id}>
                      <span className="dot" />
                      <strong>{a.action}</strong>
                      <span>{a.detail}</span>
                      <time>
                        {new Date(a.created_at).toLocaleString("en-IN")}
                      </time>
                    </div>
                  ))
                )}
              </section>
              <p className="footnote">
                Overview includes the latest 500 records per collection. Full
                pagination is required before scale.
              </p>
            </>
          )}
          {section !== "Overview" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {section === "Chargers"
                      ? "Charger directory"
                      : section === "Host verification"
                        ? "Build trust, from the start."
                        : section === "Bookings"
                          ? "Every journey, accounted for."
                          : section === "Users"
                            ? "Your growing community."
                            : "Make things right."}
                  </h2>
                  <p>
                    Review the latest 500 records. Changes require a reason.
                  </p>
                </div>
                <label className="search">
                  <Search size={17} />
                  <input
                    aria-label="Search records"
                    placeholder="Search records…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {(section === "Chargers"
                        ? [
                            "Charger",
                            "Connector / power",
                            "Rate",
                            "Status",
                            "Actions",
                          ]
                        : section === "Host verification"
                          ? ["Host", "Evidence", "Status", "Actions"]
                          : section === "Bookings"
                            ? [
                                "Booking",
                                "Session",
                                "Amount",
                                "Status",
                                "Payment",
                              ]
                            : section === "Users"
                              ? ["Member", "Phone", "Joined", "Actions"]
                              : ["Booking", "Issue", "Status", "Actions"]
                      ).map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section === "Chargers" &&
                      chargers
                        .filter((c) =>
                          match(`${c.title} ${c.address} ${c.status}`),
                        )
                        .map((c) => (
                          <tr key={c.id}>
                            <td>
                              <strong>{c.title}</strong>
                              <small>{c.address}</small>
                            </td>
                            <td>
                              {c.connector}
                              <small>{c.power_kw} kW</small>
                            </td>
                            <td>₹{c.price_per_kwh}/kWh</td>
                            <td>
                              <Badge status={c.status} />
                            </td>
                            <td>
                              <div className="actions">
                                {c.status !== "approved" && (
                                  <button
                                    className="icon-button"
                                    aria-label={`Approve ${c.title}`}
                                    onClick={() =>
                                      request(
                                        "charger",
                                        c.id,
                                        "approved",
                                        c.title,
                                      )
                                    }
                                  >
                                    <Check size={17} />
                                  </button>
                                )}
                                <button
                                  className="secondary small"
                                  onClick={() =>
                                    request(
                                      "charger",
                                      c.id,
                                      c.status === "approved"
                                        ? "suspended"
                                        : "rejected",
                                      c.title,
                                    )
                                  }
                                >
                                  {c.status === "approved"
                                    ? "Suspend"
                                    : "Reject"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    {section === "Host verification" &&
                      hosts
                        .filter((h) => match(`${h.legal_name} ${h.status}`))
                        .map((h) => (
                          <tr key={h.user_id}>
                            <td>
                              <strong>{h.legal_name}</strong>
                              <small>{h.user_id}</small>
                            </td>
                            <td className="evidence">{h.evidence_note}</td>
                            <td>
                              <Badge status={h.status} />
                            </td>
                            <td>
                              <div className="actions">
                                <button
                                  className="secondary small"
                                  onClick={() =>
                                    request(
                                      "verification",
                                      h.user_id,
                                      "verified",
                                      h.legal_name,
                                    )
                                  }
                                >
                                  Verify
                                </button>
                                <button
                                  className="secondary small"
                                  onClick={() =>
                                    request(
                                      "verification",
                                      h.user_id,
                                      "rejected",
                                      h.legal_name,
                                    )
                                  }
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    {section === "Bookings" &&
                      bookings
                        .filter((b) => match(`${b.id} ${b.status}`))
                        .map((b) => (
                          <tr key={b.id}>
                            <td>
                              <strong>
                                {chargers.find((c) => c.id === b.charger_id)
                                  ?.title || b.charger_id}
                              </strong>
                              <small>{b.id}</small>
                            </td>
                            <td>
                              {new Date(b.starts_at).toLocaleString("en-IN")}
                              <small>
                                to {new Date(b.ends_at).toLocaleString("en-IN")}
                              </small>
                            </td>
                            <td>
                              ₹{(b.amount_paise / 100).toLocaleString("en-IN")}
                            </td>
                            <td>
                              <Badge status={b.status} />
                            </td>
                            <td>
                              <Badge status={b.payment_status} />
                            </td>
                          </tr>
                        ))}
                    {section === "Users" &&
                      profiles
                        .filter((p) => match(`${p.display_name || ""} ${p.id}`))
                        .map((p) => (
                          <tr key={p.id}>
                            <td>
                              <strong>{p.display_name || "New member"}</strong>
                              <small>{p.id}</small>
                            </td>
                            <td>{p.phone || "—"}</td>
                            <td>
                              {new Date(p.created_at).toLocaleDateString(
                                "en-IN",
                              )}
                            </td>
                            <td>
                              <div className="actions">
                                <button
                                  className="secondary small"
                                  onClick={() =>
                                    request(
                                      "user",
                                      p.id,
                                      "block",
                                      p.display_name || "member",
                                    )
                                  }
                                >
                                  Block
                                </button>
                                <button
                                  className="secondary small"
                                  onClick={() =>
                                    request(
                                      "user",
                                      p.id,
                                      "unblock",
                                      p.display_name || "member",
                                    )
                                  }
                                >
                                  Unblock
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    {section === "Disputes" &&
                      disputes
                        .filter((d) =>
                          match(`${d.reason} ${d.status} ${d.booking_id}`),
                        )
                        .map((d) => (
                          <tr key={d.id}>
                            <td>
                              <strong>{d.booking_id}</strong>
                              <small>{d.id}</small>
                            </td>
                            <td className="evidence">
                              {d.reason}
                              {d.resolution && (
                                <small>Resolution: {d.resolution}</small>
                              )}
                            </td>
                            <td>
                              <Badge status={d.status} />
                            </td>
                            <td>
                              {d.status === "open" && (
                                <button
                                  className="secondary small"
                                  onClick={() =>
                                    request(
                                      "dispute",
                                      d.id,
                                      "resolved",
                                      "support issue",
                                    )
                                  }
                                >
                                  Resolve
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              {(section === "Chargers"
                ? chargers
                : section === "Host verification"
                  ? hosts
                  : section === "Bookings"
                    ? bookings
                    : section === "Users"
                      ? profiles
                      : disputes
              ).length === 0 && (
                <Empty
                  title="Nothing here just yet."
                  text="New records from the PlugNear community will appear here."
                />
              )}
            </section>
          )}
          <footer>
            <span>ϟ PlugNear Operations</span>
            <span>Built for the journeys ahead.</span>
          </footer>
        </div>
      </main>
      {review && (
        <div className="modal-backdrop">
          <form
            className="modal"
            onSubmit={(e) => void act(e)}
            aria-labelledby="review-title"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="close"
              aria-label="Close review"
              onClick={() => setReview(null)}
            >
              <X />
            </button>
            <span className="eyebrow">REVIEW & CONFIRM</span>
            <h2 id="review-title">
              {review.value} · {review.name}
            </h2>
            <p>
              Verify supporting evidence before approval. This action is
              recorded in the audit log.
            </p>
            <label>
              Review note
              <textarea
                autoFocus
                minLength={5}
                maxLength={2000}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button disabled={busy}>
              {busy ? "Saving…" : "Confirm decision"}
              <ArrowUpRight size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <div>
        <Plug size={26} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
