/*==========================
HELPERS
==========================*/

const page = document.body.dataset.page;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function esc(value){
    return String(value ?? "").replace(/[&<>"']/g, c=>({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[c]));
}

async function loadJSON(path){
    try{
        const res = await fetch(path, { cache:"no-cache" });
        if(!res.ok) throw new Error(res.status);
        return await res.json();
    }catch(err){
        console.warn("Could not load " + path + ". Open the site through a web server (not file://).", err);
        return null;
    }
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// "2024-05" -> "May 2024"
function fmtMonth(value){
    if(!value) return "";
    const [y, m] = String(value).split("-");
    return m ? MONTHS[Number(m) - 1] + " " + y : y;
}

// Homepage shows pinned items first, then the newest ones, max 3
function pickHome(items, n = 3){
    const pinned = items.filter(i=>i.pinned);
    const rest = items.filter(i=>!i.pinned);
    return pinned.concat(rest).slice(0, n);
}

const ICONS = {
    router:'<rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 17h.01M11 17h.01M12 14V8m-4-2a5.5 5.5 0 018 0M5 3.5a9.5 9.5 0 0114 0"/>',
    shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
    code:'<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    camera:'<path d="M3 7h12l3 3v4l-3 3H3z"/><circle cx="9" cy="12" r="2"/><path d="M18 10l3-2v8l-3-2"/>',
    server:'<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    cloud:'<path d="M7 18a4 4 0 01-.5-7.97A6 6 0 0118 9a4.5 4.5 0 01-.5 9z"/>',
    medal:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7"/>',
    book:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>'
};

function icon(name){
    return '<svg viewBox="0 0 24 24">' + (ICONS[name] || ICONS.router) + '</svg>';
}


/*==========================
CARD TEMPLATES
==========================*/

function imageCard(item){
    return `
        <figure class="lab-card img-card reveal">
            <img src="${esc(item.image)}" alt="${esc(item.caption)}" loading="lazy">
            <span class="zoom-ic"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M11 8v6M8 11h6"/></svg></span>
            <figcaption>${esc(item.caption)}</figcaption>
        </figure>`;
}

function youtubeId(url){
    const m = String(url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : "";
}

function videoCard(item){
    const yt = youtubeId(item.youtube);
    // "#t=0.5" makes the browser show a frame as the thumbnail
    const media = yt
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="${esc(item.title)}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        : `<video preload="metadata" playsinline><source src="${esc(item.video)}#t=0.5" type="video/mp4"></video>
           <button class="play-btn" type="button" aria-label="Play ${esc(item.title)}">
               <svg viewBox="0 0 24 24" class="fill"><path d="M8 5.5v13l11-6.5z"/></svg>
           </button>`;

    return `
        <figure class="lab-card vid-card reveal">
            <div class="vid-wrap">${media}</div>
            <figcaption>
                <span class="vid-badge">${yt ? "YouTube" : "Video"}</span>
                ${esc(item.title)}
            </figcaption>
        </figure>`;
}

function emptyState(text){
    return `<p class="empty">${esc(text)}</p>`;
}


/*==========================
HOMEPAGE SECTIONS
==========================*/

// "Fu Info Tech Ltd." -> "FI"
function initials(name){
    const words = String(name || "").replace(/\b(ltd|limited|inc|co|plc)\b\.?/gi, "").split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(w=>w[0].toUpperCase()).join("") || "?";
}

// "2024-05" .. "2026-10" (or now) -> "2 yrs 6 mos"
function duration(start, end){
    if(!start) return "";
    const [sy, sm] = start.split("-").map(Number);
    const now = new Date();
    const [ey, em] = end ? end.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
    const total = (ey - sy) * 12 + (em - sm) + 1; // count both start and end month
    const y = Math.floor(total / 12), m = total % 12;
    const parts = [];
    if(y) parts.push(y + (y === 1 ? " yr" : " yrs"));
    if(m) parts.push(m + (m === 1 ? " mo" : " mos"));
    return parts.join(" ");
}

const META_ICONS = {
    date:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    time:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    place:'<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    type:'<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>'
};

function renderExperience(jobs){
    const list = document.getElementById("expList");

    list.innerHTML = jobs.map(job=>{
        const current = !job.end;
        return `
        <div class="tl-item exp-item reveal${current ? " current" : ""}">
            <div class="tl-dot"></div>
            <article class="exp-card">
                <header class="exp-head">
                    <div class="exp-logo">${esc(initials(job.company))}</div>
                    <div class="exp-title">
                        <h3>${esc(job.role)}</h3>
                        <h4>${esc(job.company)}</h4>
                        <div class="exp-meta">
                            <span>${META_ICONS.date}${fmtMonth(job.start)} – ${current ? "Present" : fmtMonth(job.end)}</span>
                            <span>${META_ICONS.time}${duration(job.start, job.end)}</span>
                            ${job.location ? `<span>${META_ICONS.place}${esc(job.location)}</span>` : ""}
                            ${job.type ? `<span>${META_ICONS.type}${esc(job.type)}</span>` : ""}
                        </div>
                    </div>
                    ${current ? `<span class="exp-current"><span class="dot"></span> Current</span>` : ""}
                </header>
                <div class="exp-body">
                    <h5>Key Responsibilities</h5>
                    <ul class="exp-list">
                        ${(job.points || []).map(p=>`<li>${esc(p)}</li>`).join("")}
                    </ul>
                </div>
            </article>
        </div>`;
    }).join("");

    // Current job -> About facts
    const current = jobs.find(j=>!j.end) || jobs[0];
    if(current){
        document.getElementById("factRole").textContent = current.role;
        document.getElementById("factCompany").textContent = current.company;
    }

    // Total years since first job
    const starts = jobs.map(j=>j.start).filter(Boolean).sort();
    if(starts.length){
        const [y, m] = starts[0].split("-").map(Number);
        const now = new Date();
        const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - (m || 1));
        const years = Math.floor(months / 12);
        document.getElementById("hlYears").textContent = years >= 1 ? years + "+" : "<1";
        document.getElementById("factYears").textContent =
            years >= 1 ? years + "+ " + (years === 1 ? "Year" : "Years") : "Less than 1 Year";
    }
}

// How many cards (from the start) should be wide, so rows of the 3-column grid stay full
function wideCount(n){
    if(n % 3 === 2) return 2;          // 5 cards -> 2 wide + 3 normal
    if(n % 3 === 1) return n === 1 ? 1 : 4; // 4 cards -> 2x2, 7 -> 4 wide + 3
    return 0;
}

function renderSkills(groups){
    const wide = wideCount(groups.length);

    document.getElementById("skillsGrid").innerHTML = groups.map((g, i)=>{
        const items = g.items || [];
        return `
        <div class="skill-group reveal${i < wide ? " wide" : ""}">
            <div class="sg-head">
                <div class="sg-icon">${icon(g.icon)}</div>
                <div>
                    <h3>${esc(g.title)}</h3>
                    <span class="sg-count">${items.length} ${items.length === 1 ? "skill" : "skills"}</span>
                </div>
            </div>
            <ul class="skill-list">
                ${items.map(s=>`<li>${esc(s)}</li>`).join("")}
            </ul>
        </div>`;
    }).join("");

    // Marquee: every skill, repeated twice for a seamless loop
    const all = groups.flatMap(g=>g.items || []);
    const strip = all.map(s=>`<span>${esc(s)}</span>`).join("");
    document.getElementById("skillMarquee").innerHTML = strip + strip;

    document.getElementById("hlSkills").textContent = all.length;
}

function renderEducation(data){
    document.getElementById("eduList").innerHTML = (data.education || []).map(e=>`
        <div class="tl-item reveal">
            <div class="tl-dot"></div>
            <div class="edu-card">
                <span class="date">${esc(e.year)}</span>
                <h3>${esc(e.degree)}</h3>
                <p>${esc(e.institute)}</p>
                ${e.gpa ? `<span class="gpa">GPA ${esc(e.gpa)}</span>` : ""}
            </div>
        </div>`).join("");

    document.getElementById("certList").innerHTML = (data.certifications || []).map(c=>`
        <div class="cert-card reveal">
            <div class="cert-icon">${icon(c.in_progress ? "book" : "medal")}</div>
            <div>
                <h3>${esc(c.title)}</h3>
                ${c.detail ? `<p class="${c.in_progress ? "progress-label" : ""}">${esc(c.detail)}</p>` : ""}
            </div>
        </div>`).join("");
}

function renderLabHome(gallery, videos){
    if(gallery){
        const items = gallery.items || [];
        const home = pickHome(items);
        const grid = document.getElementById("galleryHome");

        grid.innerHTML = items.length ? home.map(imageCard).join("") : emptyState("No images yet.");
        // Big-left + two-stacked layout only when there are exactly 3
        grid.classList.toggle("bento", home.length === 3);
        document.getElementById("galleryCount").textContent =
            `${items.length} ${items.length === 1 ? "image" : "images"} · tap to enlarge`;
    }

    if(videos){
        const items = videos.items || [];
        document.getElementById("videoHome").innerHTML =
            items.length ? pickHome(items).map(videoCard).join("") : emptyState("No videos yet.");
        document.getElementById("videoCount").textContent =
            `${items.length} ${items.length === 1 ? "video" : "videos"}`;
    }
}

/*==========================
PROJECTS
==========================*/

// Animated illustrations a project can use instead of a photo
const PROJECT_VISUALS = {
    network:`
        <path class="pv-link" d="M160 80L62 40M160 80L62 120M160 80L258 40M160 80L258 120"/>
        <rect class="pv-node" x="40" y="28" width="44" height="24" rx="6"/>
        <rect class="pv-node" x="40" y="108" width="44" height="24" rx="6"/>
        <rect class="pv-node" x="236" y="28" width="44" height="24" rx="6"/>
        <rect class="pv-node" x="236" y="108" width="44" height="24" rx="6"/>
        <text class="pv-label" x="62" y="44">BR-1</text>
        <text class="pv-label" x="62" y="124">BR-2</text>
        <text class="pv-label" x="258" y="44">BR-3</text>
        <text class="pv-label" x="258" y="124">BR-4</text>
        <rect class="pv-core" x="128" y="62" width="64" height="36" rx="9"/>
        <text class="pv-core-label" x="160" y="84">CORE</text>
        <circle class="pv-pulse" cx="160" cy="80" r="34"/>`,
    vpn:`
        <rect class="pv-node" x="24" y="56" width="64" height="48" rx="8"/>
        <rect class="pv-node" x="232" y="56" width="64" height="48" rx="8"/>
        <text class="pv-label" x="56" y="84">SITE A</text>
        <text class="pv-label" x="264" y="84">SITE B</text>
        <path class="pv-tunnel" d="M88 68H232M88 92H232"/>
        <path class="pv-link" d="M88 80H232"/>
        <circle class="pv-packet" cx="100" cy="80" r="4"/>
        <circle class="pv-lock-bg" cx="160" cy="80" r="20"/>
        <path class="pv-lock" d="M152 79v-5a8 8 0 0116 0v5M150 79h20v13h-20z"/>
        <text class="pv-tag" x="160" y="128">GRE + IPSec</text>`,
    code:`
        <rect class="pv-term" x="30" y="18" width="260" height="124" rx="10"/>
        <path class="pv-term-bar" d="M30 40H290"/>
        <circle class="pv-dot-r" cx="46" cy="29" r="4"/>
        <circle class="pv-dot-y" cx="60" cy="29" r="4"/>
        <circle class="pv-dot-g" cx="74" cy="29" r="4"/>
        <text class="pv-code" x="46" y="64"><tspan class="c-gold">$</tspan> python router_backup.py</text>
        <text class="pv-code" x="46" y="84"><tspan class="c-green">✓</tspan> backup saved</text>
        <text class="pv-code" x="46" y="104"><tspan class="c-green">✓</tspan> health check: all up</text>
        <text class="pv-code" x="46" y="124"><tspan class="c-gold">$</tspan> <tspan class="pv-cursor">▋</tspan></text>`,
    camera:`
        <path class="pv-frame" d="M30 34V20h16M274 20h16v14M290 126v14h-16M46 140H30v-14"/>
        <circle class="pv-rec" cx="44" cy="32" r="4"/>
        <text class="pv-rec-label" x="54" y="36">REC</text>
        <circle class="pv-person" cx="98" cy="62" r="9"/>
        <path class="pv-person" d="M98 72v28M86 84h24M98 100l-9 18M98 100l9 18"/>
        <rect class="pv-box" x="74" y="46" width="48" height="78" rx="3"/>
        <text class="pv-box-label" x="74" y="41">HUMAN</text>
        <path class="pv-car" d="M180 108v-12l12-16h52l14 16v12zM180 108h78"/>
        <circle class="pv-car" cx="198" cy="110" r="7"/>
        <circle class="pv-car" cx="242" cy="110" r="7"/>
        <rect class="pv-box" x="170" y="68" width="98" height="56" rx="3"/>
        <text class="pv-box-label" x="170" y="63">VEHICLE</text>
        <path class="pv-scan" d="M30 80H290"/>`
};

function projectCard(p, i){
    const visual = p.visual === "image" && p.image
        ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`
        : `<svg viewBox="0 0 320 160" aria-hidden="true">${PROJECT_VISUALS[p.visual] || PROJECT_VISUALS.network}</svg>`;

    return `
        <article class="project-card reveal">
            <div class="p-visual">${visual}</div>
            <div class="p-body">
                <div class="p-meta">
                    <span class="p-num">${String(i + 1).padStart(2, "0")}</span>
                    ${p.category ? `<span class="p-cat">${esc(p.category)}</span>` : ""}
                </div>
                <h3>${esc(p.title)}</h3>
                <p>${esc(p.description)}</p>
                <div class="tags">${(p.tags || []).map(t=>`<span>${esc(t)}</span>`).join("")}</div>
            </div>
        </article>`;
}

function renderProjects(items){
    // Pinned projects first, then the rest in admin order
    const ordered = items.filter(p=>p.pinned).concat(items.filter(p=>!p.pinned));
    document.getElementById("projectGrid").innerHTML =
        ordered.length ? ordered.map(projectCard).join("") : emptyState("No projects yet.");
}


/*==========================
GITHUB (live from api.github.com)
==========================*/

const GH_USER = "Junaidbhuiyan591";

// Shown if a repo has no description on GitHub, or if the API can't be reached
const GH_FALLBACK = [
    { name:"Enterprise-Network-Design", description:"Enterprise network design project.", language:"", html_url:`https://github.com/${GH_USER}/Enterprise-Network-Design` },
    { name:"Junaid-Portfolio", description:"Personal portfolio website built with HTML, CSS and JavaScript.", language:"CSS", html_url:`https://github.com/${GH_USER}/Junaid-Portfolio` }
];

const LANG_COLORS = {
    HTML:"#e34c26", CSS:"#663399", JavaScript:"#f1e05a", TypeScript:"#3178c6",
    Python:"#3572A5", Shell:"#89e051", PowerShell:"#012456", RouterOS:"#d4af37"
};

// Cached for 10 minutes so visitors don't hit GitHub's rate limit
async function ghFetch(path){
    const key = "gh:" + path;
    try{
        const cached = JSON.parse(sessionStorage.getItem(key) || "null");
        if(cached && Date.now() - cached.t < 600000) return cached.d;
    }catch{}

    const res = await fetch("https://api.github.com" + path);
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();

    try{ sessionStorage.setItem(key, JSON.stringify({ t:Date.now(), d:data })); }catch{}
    return data;
}

function repoCard(repo){
    const fallback = GH_FALLBACK.find(f=>f.name === repo.name);
    const desc = repo.description || (fallback && fallback.description) || "Network engineering project.";
    const updated = repo.updated_at ? new Date(repo.updated_at) : null;

    return `
        <a class="repo-card reveal" href="${esc(repo.html_url)}" target="_blank" rel="noopener">
            <div class="repo-top">
                <span class="repo-icon"><svg viewBox="0 0 24 24"><path d="M4 4h6l2 2h8v14H4z"/></svg></span>
                <span class="repo-vis">Public</span>
            </div>
            <h3>${esc(repo.name)}</h3>
            <p>${esc(desc)}</p>
            <div class="repo-meta">
                ${repo.language ? `<span><i class="lang-dot" style="background:${LANG_COLORS[repo.language] || "var(--gold)"}"></i>${esc(repo.language)}</span>` : ""}
                ${typeof repo.stargazers_count === "number" ? `<span><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>${repo.stargazers_count}</span>` : ""}
                ${updated ? `<span>Updated ${MONTHS[updated.getMonth()]} ${updated.getFullYear()}</span>` : ""}
                <span class="repo-arrow">→</span>
            </div>
        </a>`;
}

function moreCard(){
    return `
        <a class="repo-card more reveal" href="https://github.com/${GH_USER}?tab=repositories" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            <strong>More projects coming soon</strong>
            <span>Follow on GitHub →</span>
        </a>`;
}

async function renderGitHub(){
    const box = document.getElementById("ghRepos");
    let repos;

    try{
        const [user, list] = await Promise.all([
            ghFetch(`/users/${GH_USER}`),
            ghFetch(`/users/${GH_USER}/repos?sort=updated&per_page=100`)
        ]);

        document.getElementById("ghRepoCount").textContent = user.public_repos;
        document.getElementById("ghFollowers").textContent = user.followers;
        document.getElementById("ghSince").textContent = new Date(user.created_at).getFullYear();

        repos = list.filter(r=>!r.fork).slice(0, 6);
    }catch(err){
        console.warn("GitHub API not reachable, showing saved repos.", err);
        repos = GH_FALLBACK;
    }

    // Keep the grid even: add a "more coming" card when the count is odd
    box.innerHTML = repos.map(repoCard).join("") + (repos.length % 2 ? moreCard() : "");
    observeReveal();
}

async function renderHome(){
    renderGitHub();

    const [exp, skills, edu, gallery, videos, projects] = await Promise.all([
        loadJSON("experience.json"),
        loadJSON("skills.json"),
        loadJSON("education.json"),
        loadJSON("gallery.json"),
        loadJSON("videos.json"),
        loadJSON("projects.json")
    ]);

    if(exp) renderExperience(exp.items || []);
    if(projects) renderProjects(projects.items || []);
    if(skills) renderSkills(skills.groups || []);
    if(edu) renderEducation(edu);
    renderLabHome(gallery, videos);

    observeReveal();
    onScroll();
}


/*==========================
"SEE ALL" PAGES
==========================*/

async function renderAll(kind){
    const data = await loadJSON(kind === "gallery" ? "gallery.json" : "videos.json");
    const items = data ? data.items || [] : [];

    document.getElementById("count").textContent = items.length;
    document.getElementById("allGrid").innerHTML = items.length
        ? items.map(kind === "gallery" ? imageCard : videoCard).join("")
        : emptyState("Nothing here yet.");

    observeReveal();
}


/*==========================
TYPING EFFECT
==========================*/

const titles = [
    "Network Engineer",
    "MikroTik Specialist",
    "Cisco Networking",
    "Network Security",
    "Python Automation"
];

const typed = document.getElementById("typed");

let titleIndex = 0;
let charIndex = titles[0].length;
let deleting = true;

function typeLoop(){
    if(deleting){
        charIndex--;
        if(charIndex === 0){
            deleting = false;
            titleIndex = (titleIndex + 1) % titles.length;
        }
    }else{
        charIndex++;
    }

    typed.textContent = titles[titleIndex].slice(0, charIndex);

    let delay = deleting ? 45 : 90;

    if(!deleting && charIndex === titles[titleIndex].length){
        deleting = true;
        delay = 1800;
    }

    setTimeout(typeLoop, delay);
}

if(typed){
    if(reduceMotion){
        setInterval(()=>{
            titleIndex = (titleIndex + 1) % titles.length;
            typed.textContent = titles[titleIndex];
        }, 2500);
    }else{
        setTimeout(typeLoop, 1800);
    }
}


/*==========================
MOBILE MENU
==========================*/

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

function closeMenu(){
    if(!navLinks) return;
    navLinks.classList.remove("open");
    menuBtn.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
}

if(menuBtn){
    menuBtn.addEventListener("click", ()=>{
        const open = navLinks.classList.toggle("open");
        menuBtn.classList.toggle("open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("menu-open", open);
    });

    // Back to desktop width: make sure the menu isn't left open
    window.addEventListener("resize", ()=>{
        if(window.innerWidth > 1100) closeMenu();
    });

    navLinks.querySelectorAll("a").forEach(link=>{
        link.addEventListener("click", closeMenu);
    });
}


/*==========================
NAVBAR + BACK TO TOP + ACTIVE LINK
==========================*/

const navbar = document.getElementById("navbar");
const topBtn = document.getElementById("topBtn");
const sections = document.querySelectorAll("main section[id]");
const links = navLinks ? navLinks.querySelectorAll("a[href^='#']") : [];

const progress = document.getElementById("scrollProgress");
let lastY = window.scrollY;

function onScroll(){
    const y = window.scrollY;

    if(navbar){
        navbar.classList.toggle("scrolled", y > 20);

        // Phone/tablet only: hide header while scrolling down, show it on scroll up.
        // On desktop the header (Home, Lab, ...) always stays visible at the top.
        const mobile = window.innerWidth <= 1100;
        const menuOpen = navLinks && navLinks.classList.contains("open");
        if(!menuOpen) navbar.classList.toggle("hide", mobile && y > lastY && y > 400);
    }
    lastY = y;

    if(progress){
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }

    topBtn.classList.toggle("show", y > 400);

    let currentId = "home";
    sections.forEach(sec=>{
        if(y >= sec.offsetTop - 120){
            currentId = sec.id;
        }
    });

    links.forEach(a=>{
        a.classList.toggle("active", a.getAttribute("href") === "#" + currentId);
    });
}

window.addEventListener("scroll", onScroll, { passive:true });
onScroll();

topBtn.addEventListener("click", ()=>{
    window.scrollTo({ top:0, behavior:"smooth" });
});


/*==========================
SCROLL REVEAL
==========================*/

const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold:0.12 })
    : null;

function observeReveal(){
    document.querySelectorAll(".reveal:not(.visible)").forEach(el=>{
        if(revealObserver) revealObserver.observe(el);
        else el.classList.add("visible");
    });
}

observeReveal();


/*==========================
COPY PHONE / EMAIL
==========================*/

const toast = document.getElementById("toast");
let toastTimer;

function showToast(text){
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toast.classList.remove("show"), 1800);
}

document.addEventListener("click", async e=>{
    const btn = e.target.closest(".copy-btn");
    if(!btn) return;

    try{
        await navigator.clipboard.writeText(btn.dataset.copy);
        showToast("Copied: " + btn.dataset.copy);
    }catch{
        // Clipboard blocked (e.g. non-HTTPS): let the user copy manually
        window.prompt("Copy this:", btn.dataset.copy);
    }
});


/*==========================
VIDEO PLAY BUTTON
==========================*/

document.addEventListener("click", e=>{
    const btn = e.target.closest(".play-btn");
    if(!btn) return;

    const wrap = btn.closest(".vid-wrap");
    const video = wrap.querySelector("video");

    // Pause any other playing video first
    document.querySelectorAll(".vid-wrap video").forEach(v=>{ if(v !== video) v.pause(); });

    wrap.classList.add("playing");
    video.controls = true;
    video.play();
});


/*==========================
IMAGE LIGHTBOX
==========================*/

const lightbox = document.getElementById("lightbox");

if(lightbox){
    const lbImg = document.getElementById("lbImg");
    const lbCaption = document.getElementById("lbCaption");

    // Delegated, so it also works for cards rendered later from JSON
    document.addEventListener("click", e=>{
        const card = e.target.closest(".gallery .lab-card");
        if(!card) return;

        const img = card.querySelector("img");
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbCaption.textContent = card.querySelector("figcaption").textContent;
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
    });

    lightbox.addEventListener("click", e=>{
        if(e.target !== lbImg){
            lightbox.classList.remove("open");
            lightbox.setAttribute("aria-hidden", "true");
        }
    });
}

document.addEventListener("keydown", e=>{
    if(e.key === "Escape"){
        if(lightbox){
            lightbox.classList.remove("open");
            lightbox.setAttribute("aria-hidden", "true");
        }
        closeMenu();
    }
});


/*==========================
START
==========================*/

document.getElementById("year").textContent = new Date().getFullYear();

if(page === "home") renderHome();
if(page === "gallery" || page === "videos") renderAll(page);
