// ============================================================
// Upstream — content loader
// Homepage posts and the trending-repos panel render from JSON
// instead of hardcoded HTML.
//
// To publish, APPEND a new post to the end of the array in
// data/posts.json — the last object in the file is always
// rendered first (newest on top). No HTML/CSS editing needed.
// Point POSTS_URL / REPOS_URL at a remote file (a raw GitHub
// URL, a CMS export, a published Google Sheet) to update the
// live site without redeploying it at all.
// ============================================================

const POSTS_URL = "data/posts.json";
const REPOS_URL = "data/repos.json";

// Universal injector function using the modern browser fetch API
function injectComponent(targetId, sourceFile) {
  return fetch(sourceFile)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.text();
    })
    .then(htmlContent => {
      document.getElementById(targetId).innerHTML = htmlContent;
    })
    .catch(error => console.error(`Error loading ${sourceFile}:`, error));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

// Keeps homepage cards skimmable — full excerpts belong on the article
// page, not the feed. Uses substring, then backs up to the last space
// so it never cuts a word in half.
function truncateExcerpt(text, maxLength) {
  if (!text || text.length <= maxLength) return text || "";
  const cut = text.substring(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.substring(0, lastSpace) : cut) + "…";
}

function postCardHtml(post, isFeatured) {
  const excerptMax = isFeatured ? 160 : 100;
  const excerpt = truncateExcerpt(post.excerpt, excerptMax);
  return `
    <article class="blog-card${isFeatured ? ' featured' : ''}">
      <div class="card-titlebar">
        <div class="dots"><span></span><span></span><span></span></div>
      </div>
      <div class="card-body">
        <div class="card-meta">
          ${isFeatured ? '<span class="latest-badge">Latest</span>' : ''}
          <span class="read-time">${escapeHtml(post.readTime)}</span>
        </div>
        <h2>${escapeHtml(post.title)}</h2>
        <p class="excerpt">${escapeHtml(excerpt)}</p>
        <a href="${escapeHtml(post.link || '#')}" class="read-link">Read article
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>
      </div>
    </article>`;
}

function repoItemHtml(repo) {
  return `
    <li>
      <a href="${escapeHtml(repo.link || '#')}">
        <span class="repo-name">${escapeHtml(repo.name)}</span>
        <span class="repo-meta"><span class="lang-dot" style="background:${escapeHtml(repo.color || '#89b4fa')}"></span> ${escapeHtml(repo.language)} &nbsp;·&nbsp; <span class="stars">&#9733; ${escapeHtml(repo.stars)}</span></span>
      </a>
    </li>`;
}

function renderPosts(posts) {
  const feed = document.getElementById("postsFeed");
  // Last object in the JSON array = most recently added = shown first.
  const newestFirst = [...posts].reverse();
  feed.innerHTML = newestFirst.map((post, i) => postCardHtml(post, i === 0)).join("");
}

function renderRepos(repos) {
  const list = document.getElementById("repoList");
  list.innerHTML = repos.map(repoItemHtml).join("");
}

function loadPosts() {
  if (!document.getElementById("postsFeed")) return Promise.resolve();
  return fetch(POSTS_URL)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP error! Status: ${r.status}`);
      return r.json();
    })
    .then(renderPosts)
    .catch(error => {
      console.error("Error loading posts:", error);
      document.getElementById("postsFeed").innerHTML =
        '<p class="feed-status">Couldn\'t load posts right now. Try refreshing.</p>';
    });
}

function loadRepos() {
  if (!document.getElementById("repoList")) return Promise.resolve();
  return fetch(REPOS_URL)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP error! Status: ${r.status}`);
      return r.json();
    })
    .then(renderRepos)
    .catch(error => {
      console.error("Error loading repos:", error);
      document.getElementById("repoList").innerHTML =
        '<li class="feed-status">Couldn\'t load repositories right now.</li>';
    });
}

// Highlight the nav link matching the current page (header.html is
// shared across every page, so this can't be hardcoded into it)
function setActiveNavLink() {
  const nav = document.getElementById("mainNav");
  if (!nav) return;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  nav.querySelectorAll("a").forEach(link => {
    const linkPage = (link.getAttribute("href") || "").split("#")[0];
    if (linkPage === currentPage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// Wire up the mobile hamburger menu (must run after header.html is injected)
function initNavToggle() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    injectComponent("global-header", "header.html"),
    injectComponent("global-footer", "footer.html")
  ]).then(() => {
    setActiveNavLink();
    initNavToggle();
  });

  loadPosts();
  loadRepos();
});
