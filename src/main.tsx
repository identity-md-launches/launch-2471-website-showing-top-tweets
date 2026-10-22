import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Icon, XMark, type IconName } from "./Icons";
import {
  posts,
  topics,
  postUrl,
  selectPosts,
  type Post,
  type Sort,
  type Topic,
  type View,
} from "./posts";
import "./styles.css";

const STORAGE_KEY = "swamp-signal:saved:v1";
const topicIcons: Record<Topic, IconName> = {
  "All posts": "signal",
  "AI agents": "sparkles",
  Building: "code",
  Community: "users",
  Memes: "frog",
};
const dateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function readSaved(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    );
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string =>
                typeof id === "string" && posts.some((p) => p.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

function PostCard({
  post,
  saved,
  featured,
  onSave,
  announce,
}: {
  post: Post;
  saved: boolean;
  featured: boolean;
  onSave: (post: Post) => void;
  announce: (message: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const copyInput = useRef<HTMLInputElement>(null);

  async function copyLink() {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(postUrl(post));
      setCopied(true);
      setManualCopy(false);
      announce(`Link to ${post.author}’s post copied.`);
    } catch {
      setManualCopy(true);
      announce(
        "Automatic copying is unavailable. Select and copy the link below the post.",
      );
      requestAnimationFrame(() => {
        copyInput.current?.focus();
        copyInput.current?.select();
      });
    }
  }

  return (
    <article
      className={`post-card${featured ? " featured-post" : ""}`}
      aria-labelledby={`author-${post.id}`}
      data-post-id={post.id}
    >
      {featured && (
        <div className="pick-label">
          <Icon name="pin" size={14} /> Editor’s pick
        </div>
      )}
      <div className="post-heading">
        <div className={`avatar avatar-${post.avatar}`} aria-hidden="true">
          {post.initials}
        </div>
        <div className="post-identity">
          <strong id={`author-${post.id}`}>{post.author}</strong>
          <div className="post-meta">
            <a
              href={`https://x.com/${post.handle}`}
              target="_blank"
              rel="noreferrer"
            >
              @{post.handle}
              <span className="sr-only"> on X (new tab)</span>
            </a>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>
              {dateFormat.format(new Date(post.date))}
            </time>
          </div>
        </div>
        <span className="post-platform" title="Post from X">
          <XMark />
        </span>
      </div>
      <blockquote>
        {post.excerpt}
        <span className="excerpt-end">…</span>
      </blockquote>
      <div className="post-bottom">
        <div className="post-topics">
          {post.topics.map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
        </div>
        <span className="excerpt-label">Post excerpt</span>
      </div>
      <div className="post-actions">
        <a
          className="read-post"
          href={postUrl(post)}
          target="_blank"
          rel="noreferrer"
        >
          Read on X <Icon name="arrow-up-right" size={16} />
          <span className="sr-only">: {post.author} (new tab)</span>
        </a>
        <div className="post-utilities">
          <button
            className={`text-button save-post${saved ? " is-saved" : ""}`}
            type="button"
            aria-label={`${saved ? "Remove saved post" : "Save post"} from ${post.author}`}
            aria-pressed={saved}
            onClick={() => onSave(post)}
          >
            <Icon name="bookmark" size={18} />
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
          <button
            className="icon-button copy-button"
            type="button"
            aria-label={`Copy link to ${post.author}’s post`}
            onClick={copyLink}
            title={copied ? "Link copied" : "Copy post link"}
          >
            <Icon name={copied ? "check" : "link"} size={18} />
          </button>
        </div>
      </div>
      {manualCopy && (
        <div className="manual-copy">
          <label htmlFor={`copy-${post.id}`}>
            Select and copy this post link
          </label>
          <input
            id={`copy-${post.id}`}
            ref={copyInput}
            value={postUrl(post)}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
      <details className="post-context">
        <summary>
          Behind the signal <Icon name="chevron-down" size={14} />
        </summary>
        <div>
          <p>{post.context}</p>
          <a href={post.source} target="_blank" rel="noreferrer">
            View source preview <Icon name="arrow-up-right" size={14} />
            <span className="sr-only"> for {post.author} (new tab)</span>
          </a>
        </div>
      </details>
    </article>
  );
}

function App() {
  const [view, setView] = useState<View>(
    location.hash === "#saved" ? "saved" : "feed",
  );
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic>("All posts");
  const [sort, setSort] = useState<Sort>("picks");
  const [limit, setLimit] = useState(3);
  const [saved, setSaved] = useState(readSaved);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [about, setAbout] = useState(false);
  const aboutRef = useRef<HTMLDialogElement>(null);
  const aboutTriggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const result = selectPosts(query, topic, sort, view === "saved", saved);
  const visible = result.slice(0, limit);
  const filtersActive = Boolean(query.trim()) || topic !== "All posts";

  useEffect(() => {
    function changeRoute() {
      const next = location.hash === "#saved" ? "saved" : "feed";
      setView(next);
      setQuery("");
      setTopic("All posts");
      setLimit(3);
    }
    addEventListener("hashchange", changeRoute);
    function syncBookmarks(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null)
        setSaved(readSaved());
    }
    addEventListener("storage", syncBookmarks);
    return () => {
      removeEventListener("hashchange", changeRoute);
      removeEventListener("storage", syncBookmarks);
    };
  }, []);

  useEffect(() => {
    if (about) {
      aboutRef.current?.showModal();
      document.body.classList.add("dialog-open");
    } else {
      aboutRef.current?.close();
      document.body.classList.remove("dialog-open");
      aboutTriggerRef.current?.focus({ preventScroll: true });
    }
    return () => document.body.classList.remove("dialog-open");
  }, [about]);

  function chooseTopic(next: Topic) {
    setTopic(next);
    setLimit(3);
  }
  function showAbout(event: React.MouseEvent<HTMLButtonElement>) {
    aboutTriggerRef.current = event.currentTarget;
    setAbout(true);
  }
  function clearFilters() {
    setQuery("");
    setTopic("All posts");
    setLimit(3);
    searchRef.current?.focus();
  }
  function switchView(next: View) {
    setView(next);
    setQuery("");
    setTopic("All posts");
    setLimit(3);
    location.hash = next === "saved" ? "saved" : "feed";
    requestAnimationFrame(() =>
      headingRef.current?.focus({ preventScroll: true }),
    );
  }
  function toggleSaved(post: Post) {
    const next = saved.includes(post.id)
      ? saved.filter((id) => id !== post.id)
      : [...saved, post.id];
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageUnavailable(false);
    } catch {
      setStorageUnavailable(true);
    }
    setAnnouncement(
      next.includes(post.id)
        ? `Saved post from ${post.author}. Bookmarks stay on this browser.`
        : `Removed saved post from ${post.author}.`,
    );
  }

  return (
    <>
      <a className="skip-link" href="#feed">
        Skip to posts
      </a>
      <header className="site-header">
        <div className="header-inner page-width">
          <a
            className="brand"
            href="#"
            aria-label="Swamp Signal home"
            onClick={() => switchView("feed")}
          >
            <img src="./favicon.svg" alt="" width="38" height="38" />
            <span>
              swamp<wbr /><span className="brand-light">signal</span>
              <span className="brand-dot">.</span>
            </span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <button
              className={`nav-item feed-nav${view === "feed" ? " active" : ""}`}
              type="button"
              aria-current={view === "feed" ? "page" : undefined}
              onClick={() => switchView("feed")}
            >
              <Icon name="signal" size={18} />
              <span>Explore</span>
            </button>
            <button
              className={`nav-item${view === "saved" ? " active" : ""}`}
              type="button"
              aria-label={`Saved posts${saved.length ? `, ${saved.length}` : ""}`}
              aria-current={view === "saved" ? "page" : undefined}
              onClick={() => switchView("saved")}
            >
              <Icon name="bookmark" size={18} />
              <span className="nav-text">Saved</span>
              {saved.length > 0 && (
                <span className="saved-count">{saved.length}</span>
              )}
            </button>
            <button
              className="nav-item"
              type="button"
              aria-label="About this feed"
              onClick={showAbout}
            >
              <span className="mobile-info">
                <Icon name="info" size={20} />
              </span>
              <span className="nav-text">About</span>
            </button>
          </nav>
          <a
            className="header-x secondary-button"
            href="https://x.com/search?q=IdentityMD%20OR%20%22identity.md%22&f=top"
            target="_blank"
            rel="noreferrer"
          >
            <XMark size={14} /> Explore on X{" "}
            <Icon name="arrow-up-right" size={16} />
            <span className="sr-only"> (new tab)</span>
          </a>
        </div>
      </header>

      <main className="page-width">
        {view === "feed" && (
          <section className="hero" aria-labelledby="hero-title">
            <img
              className="hero-art"
              src="./assets/ai-pepe-squad.webp"
              alt=""
              width="1536"
              height="1024"
              fetchPriority="high"
            />
            <div className="hero-content">
              <h1 id="hero-title">
                Frogs with
                <br />a hive mind.
              </h1>
              <p>Top tweets from the IdentityMD community.</p>
              <a className="primary-button" href="#feed">
                Explore the feed <Icon name="arrow-down" size={17} />
              </a>
            </div>
            <div className="hero-caption">
              <span className="caption-dot" /> Pepes, armed with AI.
            </div>
          </section>
        )}

        <div
          className={`content-layout${view === "saved" ? " saved-layout" : ""}`}
        >
          <section
            className="feed"
            aria-labelledby="feed-title"
            id="feed"
            tabIndex={-1}
          >
            <div className="feed-heading">
              <div>
                {view === "saved" ? (
                  <h1 id="feed-title" ref={headingRef} tabIndex={-1}>
                    Saved signals
                  </h1>
                ) : (
                  <h2 id="feed-title" ref={headingRef} tabIndex={-1}>
                    Inside the swarm
                  </h2>
                )}
                <p>
                  {view === "saved"
                    ? "A little signal, kept for later."
                    : "The ideas, the builds, the frog lore."}
                </p>
              </div>
              <span className="collection-label">
                <Icon
                  name={view === "saved" ? "bookmark" : "signal"}
                  size={14}
                />
                {view === "saved" ? "On this browser" : "Curated snapshot"}
              </span>
            </div>

            <div className="search-row">
              <label className="search-field">
                <Icon name="search" size={19} />
                <span className="search-label">
                  Search
                  <span className="sr-only"> posts, people or topics</span>
                </span>
                <input
                  ref={searchRef}
                  type="search"
                  name="post-search"
                  placeholder="Posts, people or topics"
                  autoComplete="off"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setLimit(3);
                  }}
                />
              </label>
            </div>
            <div
              className="topic-filters"
              role="group"
              aria-label="Filter by topic"
            >
              {topics.map((item) => (
                <button
                  type="button"
                  className={`topic-filter${topic === item ? " selected" : ""}`}
                  key={item}
                  aria-pressed={topic === item}
                  onClick={() => chooseTopic(item)}
                >
                  {item === "All posts" ? null : (
                    <Icon name={topicIcons[item]} size={15} />
                  )}
                  {item}
                </button>
              ))}
            </div>
            <div className="results-toolbar">
              <p role="status" aria-live="polite" aria-atomic="true">
                {result.length} {result.length === 1 ? "post" : "posts"}
                {filtersActive
                  ? " found"
                  : view === "saved"
                    ? " saved"
                    : " to explore"}
                {filtersActive && (
                  <button
                    className="clear-filters"
                    type="button"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}
              </p>
              <label className="sort-field">
                <span className="sr-only">Sort posts</span>
                <select
                  name="sort"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as Sort);
                    setLimit(3);
                  }}
                >
                  <option value="picks">Top picks</option>
                  <option value="newest">Newest first</option>
                </select>
                <Icon name="chevron-down" size={14} />
              </label>
            </div>
            <div className="post-list">
              {visible.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  saved={saved.includes(post.id)}
                  featured={
                    view === "feed" &&
                    post.id === posts[0].id &&
                    sort === "picks"
                  }
                  onSave={toggleSaved}
                  announce={setAnnouncement}
                />
              ))}
            </div>
            {result.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <Icon
                    name={
                      view === "saved" && !filtersActive ? "bookmark" : "search"
                    }
                    size={30}
                  />
                </div>
                <h2>
                  {view === "saved" && !filtersActive
                    ? "Keep a little signal."
                    : "No signals found."}
                </h2>
                <p>
                  {filtersActive
                    ? `No posts match ${query.trim() ? `“${query.trim()}”${topic !== "All posts" ? ` in ${topic}` : ""}` : topic}. Try another topic or clear your filters.`
                    : "Save a post to find it here. Bookmarks stay on this browser."}
                </p>
                <button
                  className="primary-button"
                  type="button"
                  onClick={
                    filtersActive ? clearFilters : () => switchView("feed")
                  }
                >
                  {filtersActive ? "Clear filters" : "Explore the feed"}
                  <Icon name="arrow-right" size={16} />
                </button>
              </div>
            )}
            {result.length > limit && (
              <button
                className="load-more secondary-button"
                type="button"
                onClick={() => {
                  setLimit(result.length);
                  setAnnouncement(`Showing all ${result.length} posts.`);
                }}
              >
                Show {result.length - limit} more posts{" "}
                <Icon name="arrow-down" size={16} />
              </button>
            )}
            {result.length > 0 && result.length <= limit && (
              <p className="end-note">
                <Icon name="frog" size={18} /> You’ve reached the edge of the
                swamp.
              </p>
            )}
            {storageUnavailable && (
              <p className="storage-note" role="status">
                Browser storage is unavailable. Saved posts will last for this
                visit.
              </p>
            )}
            <div
              className="sr-only"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {announcement}
            </div>
          </section>

          <aside className="sidebar" aria-label="Explore IdentityMD">
            <section className="field-guide">
              <div className="guide-heading">
                <span className="guide-icon">
                  <Icon name="frog" size={28} />
                </span>
                <h2>Welcome to the swamp.</h2>
              </div>
              <p>
                Independent minds. Shared intelligence. IdentityMD is a network
                of AI agents building onchain.
              </p>
              <a href="https://imd.fun/" target="_blank" rel="noreferrer">
                Meet IdentityMD <Icon name="arrow-up-right" size={16} />
                <span className="sr-only"> (new tab)</span>
              </a>
            </section>
            <section className="topic-directory">
              <h2>Follow your curiosity</h2>
              {topics
                .filter((item) => item !== "All posts")
                .map((item) => (
                  <button
                    type="button"
                    className={
                      topic === item
                        ? "directory-row directory-active"
                        : "directory-row"
                    }
                    key={item}
                    onClick={() => {
                      chooseTopic(item);
                      headingRef.current?.focus({ preventScroll: true });
                      document
                        .getElementById("feed")
                        ?.scrollIntoView({ block: "start" });
                    }}
                  >
                    <span className="directory-icon">
                      <Icon name={topicIcons[item]} size={18} />
                    </span>
                    <span>{item}</span>
                    <span className="directory-count">
                      {
                        posts.filter(
                          (post) =>
                            (view !== "saved" || saved.includes(post.id)) &&
                            post.topics.includes(
                              item as Exclude<Topic, "All posts">,
                            ),
                        ).length
                      }
                    </span>
                    <Icon name="arrow-up-right" size={15} />
                  </button>
                ))}
            </section>
            <section className="rabbit-hole">
              <h2>A few good rabbit holes</h2>
              <a href="https://imd.fun/docs" target="_blank" rel="noreferrer">
                <span>
                  IdentityMD docs<small>Understand the protocol</small>
                </span>
                <Icon name="arrow-up-right" size={17} />
                <span className="sr-only"> (new tab)</span>
              </a>
              <a
                href="https://explorer.imd.fun/"
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  Swarm explorer<small>See what the agents are building</small>
                </span>
                <Icon name="arrow-up-right" size={17} />
                <span className="sr-only"> (new tab)</span>
              </a>
              <a
                href="https://x.com/search?q=IdentityMD%20OR%20%22identity.md%22&f=top"
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  The wider conversation<small>Find more posts on X</small>
                </span>
                <Icon name="arrow-up-right" size={17} />
                <span className="sr-only"> (new tab)</span>
              </a>
            </section>
            <div className="snapshot-note">
              <Icon name="info" size={17} />
              <div>
                <p>
                  A snapshot, not a live feed. Top picks are editorial, not
                  ranked by engagement.
                </p>
                <button type="button" onClick={showAbout}>
                  How this feed works <Icon name="arrow-right" size={14} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="site-footer page-width">
        <span className="footer-brand">
          <Icon name="frog" size={20} /> A little less noise. A little more
          signal.
        </span>
        <span>
          Independent of IdentityMD & X.
          <button type="button" onClick={showAbout}>
            About this feed
          </button>
        </span>
      </footer>

      <dialog
        ref={aboutRef}
        className="about-dialog"
        aria-labelledby="about-title"
        onCancel={() => setAbout(false)}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons =
            event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const box = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < box.left ||
              event.clientX > box.right ||
              event.clientY < box.top ||
              event.clientY > box.bottom
            )
              setAbout(false);
          }
        }}
      >
        <div className="dialog-heading">
          <h2 id="about-title">About Swamp Signal</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close about this feed"
            onClick={() => setAbout(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <p>
          A small reading room for the IdentityMD community, with Pepes armed
          with AI.
        </p>
        <h3>What’s in the feed?</h3>
        <p>
          Six sourced posts from May to August 2026, checked on 22 October 2026.
          Top picks is an editorial order based on project context, building
          activity and community culture. It is not an engagement ranking or a
          live X feed.
        </p>
        <h3>Read it in context</h3>
        <p>
          Cards show short excerpts. “Read on X” opens the original post in a
          new tab; X may ask you to sign in. “Behind the signal” adds context
          and a third-party source preview. Posts represent their authors’
          views.
        </p>
        <h3>Your bookmarks stay here</h3>
        <p>
          Saved posts use this browser’s local storage. No account, wallet or
          tracking. Clearing browser data removes your bookmarks. The artwork is
          original; author avatars are monograms.
        </p>
        <div className="dialog-footer">
          <span>Independent community project.</span>
          <button
            className="primary-button"
            type="button"
            onClick={() => setAbout(false)}
          >
            Back to the feed <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </dialog>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
