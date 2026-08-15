import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  Check,
  EnvelopeSimple,
  ImageSquare,
  List,
  MagnifyingGlass,
  SquaresFour,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import CountUp from "./components/CountUp";
import Masonry from "./components/Masonry";
import SplitText from "./components/SplitText";

const INITIAL_BATCH = 28;
const FILTERS = ["全部", "个人渲染作品", "电商设计", "视频动效", "Ai与IP设计"];
const PORTFOLIO_CATEGORIES = new Set(FILTERS.slice(1));

const HERO_ASSETS = {
  background: "/media/主页/img_1786676805873_rcyg_PSD图层_01_背景无文字_去橙光无圆圈.png",
  backgroundLit: "/media/主页/img_1786676805873_rcyg_PSD图层_01_背景无文字.png",
  numbers: "/media/主页/2026纯白数字_完全照图1_全画布5504x3072.png",
  person: "/media/主页/主页海报_PSD图层_03_中间人物_去橙光.png",
  personLit: "/media/主页/主页海报_PSD图层_03_中间人物.png",
};

const PROJECTS = [
  {
    index: "01",
    category: "个人渲染作品",
    english: "PERSONAL RENDERING",
    subtitle: "键盘产品视觉渲染",
    description: "围绕键盘产品完成建模、材质、灯光与场景构建，用精确细节呈现结构、触感与产品气质。",
    tags: ["3D RENDER", "MATERIAL", "LIGHTING"],
    theme: "paper",
    preferred: ["2高端G键盘渲染设计", "2超写实高端G键盘——特写上漂键帽 (2)", "2超写实高端G键盘特写键帽_i1", "1渲染大场景"],
  },
  {
    index: "02",
    category: "电商设计",
    english: "E-COMMERCE DESIGN",
    subtitle: "跨境与国内电商视觉设计",
    description: "覆盖跨境与国内电商，从主视觉到详情页组织产品卖点、使用场景与统一的品牌表达。",
    tags: ["CROSS-BORDER", "DOMESTIC", "A+ CONTENT"],
    theme: "lilac",
    preferred: ["Image 1", "1.辅图_深色高级可调节功能图", "79ff6408e706279cdb4f973551051db5", "exec-638bc1e6-988a-4ab3-a026-1e6ef0074dbd", "img_1783930658354_9iiv"],
  },
  {
    index: "03",
    category: "视频动效",
    english: "MOTION & VIDEO DESIGN",
    subtitle: "产品动效与动画",
    description: "以镜头节奏、材质运动和产品拆解，让功能信息转化为清晰、有力度的动态视觉表达。",
    tags: ["MOTION", "PRODUCT FILM", "ANIMATION"],
    theme: "sand",
    preferred: ["TRIARC电动剃须刀产品动画", "1，第一个视频", "人体工学办公椅_品牌—Hbada", "运动鞋_跑步鞋_柔性包裹篇"],
  },
  {
    index: "04",
    category: "Ai与IP设计",
    english: "AI APPLICATION & IP DESIGN",
    subtitle: "Ai概念设计",
    description: "结合生成式工具与角色设定，探索产品概念、IP 形象及其可延展的视觉世界观。",
    tags: ["AI CONCEPT", "IP DESIGN", "WORLD BUILDING"],
    theme: "sage",
    preferred: ["人物四视图", "展示设计687654", "exec-81484bc5-574a-4580-881d-77fc17d5f67f", "exec-e363d8e9-eee1-4b25-96cc-05d907c0cfcd"],
  },
];

function assetUrl(value) {
  if (!value) return value;
  return window.location.protocol === "file:" && value.startsWith("/") ? `./public${value}` : value;
}

function niceName(entry) {
  if (!entry) return "视觉作品";
  return entry.name.replace(/^exec-[\w-]+$/i, "AI 视觉实验").replace(/[_-]+/g, " ");
}

function isCrossBorderEntry(entry) {
  const market = entry?.market || "";
  return market === "跨境"
    || /^\d+[.、_-]?\s*跨境/.test(market)
    || entry?.url?.includes("/电商设计/1.跨境/");
}

function useReveal(refreshKey) {
  useEffect(() => {
    const targets = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (items) => items.forEach((item) => {
        if (!item.isIntersecting) return;
        item.target.classList.add("is-visible");
        observer.unobserve(item.target);
      }),
      { threshold: 0.1 },
    );
    targets.forEach((target) => {
      if (target.classList.contains("is-visible")) return;
      target.classList.add("reveal-pending");
      observer.observe(target);
    });
    return () => observer.disconnect();
  }, [refreshKey]);
}

function MediaVisual({ entry, className = "", eager = false, controls = false, preview = false, original = false }) {
  if (!entry) return <div className={`media-placeholder ${className}`} />;
  if (entry.kind === "video") {
    return (
      <video
        className={className}
        src={assetUrl(entry.url)}
        preload="metadata"
        muted={preview}
        loop={preview}
        playsInline
        controls={controls}
      />
    );
  }
  const source = original ? entry.url : entry.thumbnail || entry.url;
  return <img className={className} src={assetUrl(source)} alt={niceName(entry)} loading={eager ? "eager" : "lazy"} decoding="async" />;
}

function Hero() {
  const heroRef = useRef(null);
  const frameRef = useRef(0);

  const updateLight = (event) => {
    const node = heroRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
      node.style.setProperty("--light-x", `${x}%`);
      node.style.setProperty("--light-y", `${y}%`);
      node.style.setProperty("--parallax-x", `${(x - 50) * 0.08}px`);
      node.style.setProperty("--parallax-y", `${(y - 50) * 0.05}px`);
      node.style.setProperty("--light-opacity", "1");
    });
  };

  const resetLight = () => {
    const node = heroRef.current;
    if (!node) return;
    node.style.setProperty("--light-x", "58%");
    node.style.setProperty("--light-y", "36%");
    node.style.setProperty("--parallax-x", "0px");
    node.style.setProperty("--parallax-y", "0px");
    node.style.setProperty("--light-opacity", ".58");
  };

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  return (
    <section className="hero" id="top" ref={heroRef} onPointerMove={updateLight} onPointerLeave={resetLight} aria-label="作品集首页">
      <img className="hero-layer hero-background" src={assetUrl(HERO_ASSETS.background)} alt="" aria-hidden="true" />
      <img className="hero-layer hero-background-lit hero-light-mask" src={assetUrl(HERO_ASSETS.backgroundLit)} alt="" aria-hidden="true" />
      <div className="hero-cursor-light" aria-hidden="true" />
      <img className="hero-layer hero-numbers" src={assetUrl(HERO_ASSETS.numbers)} alt="" aria-hidden="true" />
      <div className="hero-person-wrap" aria-hidden="true">
        <img className="hero-layer hero-person" src={assetUrl(HERO_ASSETS.person)} alt="" />
        <img className="hero-layer hero-person hero-person-lit hero-light-mask" src={assetUrl(HERO_ASSETS.personLit)} alt="" />
      </div>
      <div className="hero-vignette" aria-hidden="true" />

      <nav className="hero-nav" aria-label="主导航">
        <a className="wordmark" href="#top" data-reveal>LMS<span>●</span></a>
        <div className="nav-links" data-reveal>
          <a href="#about">关于</a>
          <a href="#projects">作品方向</a>
          <a href="#archive">作品库</a>
          <a href="#contact">邮箱联系</a>
        </div>
        <span className="nav-year" data-reveal>©2026</span>
      </nav>

      <div className="hero-copy">
        <p className="eyebrow" data-reveal>PRODUCT VISUAL DESIGNER</p>
        <SplitText
          tag="h1"
          className="hero-title"
          text={"以 3D、AI 与电商设计\n打造有说服力的产品视觉。"}
          splitType="words, chars"
          delay={34}
          duration={0.85}
          rootMargin="0px"
        />
      </div>

      <a className="hero-contact" href="mailto:1617589399@qq.com" data-reveal>
        邮箱联系 <ArrowUpRight weight="bold" />
      </a>

      <div className="hero-disciplines" aria-label="设计方向" data-reveal>
        <span>3D RENDERING</span><span>E-COMMERCE</span><span>AI VISUAL</span><span>MOTION</span>
      </div>
    </section>
  );
}

function MarqueeRow({ entries, reverse = false }) {
  const loopEntries = entries.length ? entries : [];
  return (
    <div className={`image-marquee-row ${reverse ? "reverse" : ""}`} aria-hidden="true">
      <div className="image-marquee-rail">
        {[0, 1].map((copy) => (
          <div className="image-marquee-set" key={copy}>
            {loopEntries.map((entry) => <MediaVisual key={`${copy}-${entry.id}`} entry={entry} eager />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualMarquee({ entries }) {
  const midpoint = Math.ceil(entries.length / 2);
  const top = entries.slice(0, midpoint);
  const bottom = entries.slice(midpoint);
  return (
    <section className="visual-marquee" aria-labelledby="visual-marquee-title">
      <div className="shell visual-marquee-heading" data-reveal>
        <p>SELECTED VISUALS / 2023 TO 2026</p>
        <div className="visual-title" id="visual-marquee-title" role="heading" aria-level="2">
          <SplitText tag="span" text="VISUALS THAT" splitType="chars" delay={26} duration={0.8} />
          <SplitText tag="span" className="outline-title" text="MAKE PRODUCTS FELT." splitType="chars" delay={20} duration={0.8} />
        </div>
      </div>
      <MarqueeRow entries={top} />
      <MarqueeRow entries={bottom} reverse />
    </section>
  );
}

function About({ entries }) {
  const iconNames = [
    "futuristic-crescent-transparent",
    "modular-cube-transparent",
    "chrome-torus-transparent",
    "robotic-starburst-transparent",
  ];
  const icons = iconNames.map((name) => entries.find((entry) => entry.category === "图标素材" && entry.name === name)).filter(Boolean);
  return (
    <section className="about" id="about">
      {icons.map((entry, index) => <MediaVisual key={entry.id} entry={entry} original className={`about-icon icon-${index + 1}`} />)}
      <div className="about-content" data-reveal>
        <p className="kicker">ABOUT / CREATIVE PROFILE</p>
        <div className="about-title" role="heading" aria-level="2">
          <SplitText tag="span" text="ABOUT" splitType="chars" delay={32} duration={0.85} />
          <SplitText tag="span" className="outline-title" text="ME" splitType="chars" delay={42} duration={0.85} />
        </div>
        <SplitText
          tag="p"
          className="about-lead"
          text="我专注于产品视觉设计，把策略、3D、AI 与动效整合成清晰而有情绪的视觉叙事。从电商详情页到品牌短片，每一次创作都从产品本身出发，让功能被理解，让质感被看见。"
          splitType="lines"
          delay={90}
          duration={0.75}
        />
        <div className="about-stats">
          <div><strong><CountUp to={4} pad={2} suffix="+" /></strong><span>YEARS OF<br />VISUAL PRACTICE</span></div>
          <div><strong><CountUp to={entries.filter((entry) => PORTFOLIO_CATEGORIES.has(entry.category)).length} pad={3} /></strong><span>WORKS IN<br />THE ARCHIVE</span></div>
          <div><strong><CountUp to={4} pad={2} /></strong><span>CORE DESIGN<br />DIRECTIONS</span></div>
        </div>
      </div>
    </section>
  );
}

function pickProjectEntries(entries, project) {
  let candidates = entries.filter((entry) => (
    entry.category === project.category
    && (entry.kind === "video" || !entry.aspect || entry.aspect >= 1.2)
  ));
  if (project.category === "电商设计") {
    const curated = entries.filter((entry) => entry.category === project.category && entry.market === "展示");
    if (curated.length) candidates = curated;
  }
  const preferred = project.preferred.map((name) => candidates.find((entry) => entry.name === name)).filter(Boolean);
  return [...preferred, ...candidates.filter((entry) => !preferred.includes(entry))].slice(0, project.category === "电商设计" ? 5 : 4);
}

function ProjectCard({ project, entries, onOpen, stackIndex }) {
  const media = pickProjectEntries(entries, project);
  const isEcommerce = project.category === "电商设计";
  return (
    <article className={`project-card theme-${project.theme}`} style={{ "--stack-index": stackIndex }}>
      <header className="project-header">
        <span className="project-number"><CountUp to={Number(project.index)} pad={2} duration={0.9} /></span>
        <div data-reveal><p>FEATURED DIRECTION / {project.index}</p><h3>{project.category}<span>{project.english}</span></h3></div>
        <a href="#archive">VIEW ARCHIVE <ArrowUpRight weight="bold" /></a>
      </header>
      <div className="project-body">
        <div className="project-copy-block">
          <p className="project-subtitle" data-reveal>{project.subtitle}</p>
          <SplitText tag="p" className="project-description" text={project.description} splitType="lines" delay={90} duration={0.72} />
          {isEcommerce && <div className="market-split"><span>CROSS-BORDER / A+ VISUAL</span><span>DOMESTIC / CAMPAIGN</span></div>}
          <div className="project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
        <div className={`project-gallery ${isEcommerce ? "ecommerce-gallery" : ""}`}>
          {media.map((entry, index) => (
            <button
              className={`project-media project-media-${index + 1}`}
              key={entry.id}
              onClick={() => onOpen(entry)}
              onMouseEnter={(event) => event.currentTarget.querySelector("video")?.play().catch(() => {})}
              onMouseLeave={(event) => event.currentTarget.querySelector("video")?.pause()}
              aria-label={`查看 ${niceName(entry)}`}
            >
              <MediaVisual entry={entry} preview={entry.kind === "video"} />
              <span>{entry.kind === "video" ? <VideoCamera weight="fill" /> : <ArrowUpRight weight="bold" />}</span>
              {isEcommerce && <small>{entry.market === "展示" ? "FEATURED" : entry.market === "跨境" ? "CROSS-BORDER" : "DOMESTIC"}</small>}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function FeaturedProjects({ entries, onOpen }) {
  return (
    <section className="projects" id="projects">
      <div className="shell projects-heading" data-reveal>
        <p>FOUR CORE DIRECTIONS / 2026</p>
        <div className="projects-title" role="heading" aria-level="2">
          <SplitText tag="span" text="SELECTED" splitType="chars" delay={25} duration={0.8} />
          <SplitText tag="span" className="outline-title" text="PROJECTS." splitType="chars" delay={22} duration={0.8} />
        </div>
        <SplitText tag="p" className="projects-intro" text="以四个方向组织创作实践，从产品质感、商业转化、动态表达延伸到 AI 概念与 IP 设计。" splitType="lines" delay={90} duration={0.72} />
      </div>
      <div className="project-stack">
        {PROJECTS.map((project, index) => <ProjectCard key={project.index} project={project} entries={entries} onOpen={onOpen} stackIndex={index} />)}
        <div className="project-stack-tail" aria-hidden="true" />
      </div>
    </section>
  );
}

function Archive({ entries, onOpen }) {
  const [active, setActive] = useState("全部");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [compact, setCompact] = useState(false);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matched = entries.filter((entry) => {
      const matchesFilter = active === "全部" || entry.category === active;
      const haystack = `${entry.name} ${entry.group} ${entry.project} ${entry.market || ""}`.toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
    if (active !== "电商设计") return matched;
    return matched
      .map((entry, index) => ({ entry, index }))
      .sort((a, b) => Number(!isCrossBorderEntry(a.entry)) - Number(!isCrossBorderEntry(b.entry)) || a.index - b.index)
      .map(({ entry }) => entry);
  }, [entries, active, query]);

  const masonryItems = useMemo(() => filtered.slice(0, visibleCount).map((entry, index) => {
    const naturalRatio = entry.kind === "video" ? 0.62 : 1 / Math.max(0.55, entry.aspect || 1.35);
    const rhythm = [0.02, 0.22, -0.06, 0.34, 0.12, -0.1][index % 6];
    const heightRatio = compact
      ? Math.max(0.5, Math.min(1.02, naturalRatio + rhythm * 0.55))
      : Math.max(0.56, Math.min(1.68, naturalRatio + rhythm));
    return {
      id: entry.id,
      src: assetUrl(entry.kind === "video" ? entry.url : entry.thumbnail || entry.url),
      kind: entry.kind,
      heightRatio,
      label: `查看 ${niceName(entry)}`,
      entry,
    };
  }), [compact, filtered, visibleCount]);

  useEffect(() => setVisibleCount(INITIAL_BATCH), [active, query]);

  return (
    <section className="archive" id="archive">
      <div className="shell archive-head" data-reveal>
        <p>FULL ARCHIVE / ALL MEDIA</p>
        <div>
          <h2><CountUp to={entries.length} duration={1.3} /> PIECES.</h2>
          <SplitText tag="h3" text="ONE EVOLVING PRACTICE." splitType="words" delay={80} duration={0.8} />
        </div>
        <strong><CountUp to={FILTERS.length - 1} pad={3} duration={1.1} /><span>DIRECTIONS</span></strong>
      </div>
      <div className="shell archive-toolbar" data-reveal>
        <div className="filters" role="tablist" aria-label="作品分类">
          {FILTERS.map((filter) => (
            <button key={filter} className={active === filter ? "active" : ""} onClick={() => setActive(filter)}>
              {filter}{active === filter && <Check weight="bold" />}
            </button>
          ))}
        </div>
        <label className="search-field">
          <MagnifyingGlass />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索项目或作品名称" />
          {query && <button onClick={() => setQuery("")} aria-label="清除搜索"><X /></button>}
        </label>
        <button className="view-toggle" onClick={() => setCompact((value) => !value)} aria-label="切换作品排列">
          {compact ? <SquaresFour /> : <List />}
        </button>
      </div>
      <div className={`shell archive-masonry ${compact ? "compact" : ""}`} aria-live="polite">
        <Masonry
          items={masonryItems}
          onItemClick={onOpen}
          ease="power3.out"
          duration={0.42}
          stagger={0.018}
          animateFrom="bottom"
          scaleOnHover={false}
          colorShiftOnHover={false}
        />
      </div>
      {!filtered.length && <div className="shell empty-state">没有找到匹配的作品。</div>}
      {visibleCount < filtered.length && (
        <button className="load-more" onClick={() => setVisibleCount((value) => value + INITIAL_BATCH)}>
          加载更多 <span>{visibleCount} / {filtered.length}</span>
        </button>
      )}
    </section>
  );
}

function Contact() {
  return (
    <footer className="contact" id="contact">
      <div className="shell contact-inner" data-reveal>
        <div><p>AVAILABLE FOR OPPORTUNITIES / 2026</p><div className="contact-title" role="heading" aria-level="2"><SplitText tag="span" text="让产品被理解，" splitType="chars" delay={38} duration={0.72} mask={false} /><SplitText tag="span" className="muted-title" text="让视觉被记住。" splitType="chars" delay={38} duration={0.72} mask={false} /></div></div>
        <a href="mailto:1617589399@qq.com"><EnvelopeSimple weight="fill" /> 1617589399@qq.com <ArrowUpRight weight="bold" /></a>
      </div>
      <div className="shell footer-line" data-reveal><span>LI MINGSHUAI PORTFOLIO</span><span>© 2026 ALL RIGHTS RESERVED</span><a href="#top">BACK TO TOP <CaretRight /></a></div>
    </footer>
  );
}

function Lightbox({ entry, entries, onClose, onChange }) {
  const index = entry ? entries.findIndex((item) => item.id === entry.id) : -1;
  const move = useCallback((direction) => {
    if (index >= 0) onChange(entries[(index + direction + entries.length) % entries.length]);
  }, [index, entries, onChange]);

  useEffect(() => {
    if (!entry) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [entry, move, onClose]);

  if (!entry) return null;
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={niceName(entry)} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <button className="lightbox-close" onClick={onClose} aria-label="关闭"><X /></button>
      <button className="lightbox-prev" onClick={() => move(-1)} aria-label="上一项"><CaretLeft /></button>
      <div className="lightbox-panel">
        <div className="lightbox-media"><MediaVisual entry={entry} controls original /></div>
        <div className="lightbox-meta">
          <span>{String(index + 1).padStart(3, "0")} / {entries.length}</span>
          <div><h3>{niceName(entry)}</h3><p>{entry.category} / {entry.kind === "video" ? "动态影像" : "视觉作品"}</p></div>
          <a href={assetUrl(entry.url)} target="_blank" rel="noreferrer">查看原文件 <ArrowUpRight /></a>
        </div>
      </div>
      <button className="lightbox-next" onClick={() => move(1)} aria-label="下一项"><CaretRight /></button>
    </div>
  );
}

function LoadingScreen() {
  return <div className="loading-screen"><span>LMS</span><div><i /></div><p>LOADING PORTFOLIO / 2026</p></div>;
}

export function App() {
  const [manifest, setManifest] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  useReveal(manifest?.entries?.length || 0);

  useEffect(() => {
    if (window.__PORTFOLIO_MANIFEST__) {
      setManifest(window.__PORTFOLIO_MANIFEST__);
      return;
    }
    fetch("/media-manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("作品数据加载失败");
        return response.json();
      })
      .then(setManifest)
      .catch((reason) => setError(reason.message));
  }, []);

  if (error) return <div className="fatal-error"><X /><h1>{error}</h1><p>请检查媒体清单是否已生成。</p></div>;
  if (!manifest) return <LoadingScreen />;

  const entries = manifest.entries;
  const portfolioEntries = entries.filter((entry) => PORTFOLIO_CATEGORIES.has(entry.category));
  const marqueeEntries = entries.filter((entry) => entry.category === "副业轮换" && entry.kind === "image");

  return (
    <>
      <Hero />
      <main>
        <VisualMarquee entries={marqueeEntries} />
        <About entries={entries} />
        <FeaturedProjects entries={portfolioEntries} onOpen={setSelected} />
        <Archive entries={portfolioEntries} onOpen={setSelected} />
      </main>
      <Contact />
      <Lightbox entry={selected} entries={portfolioEntries} onClose={() => setSelected(null)} onChange={setSelected} />
    </>
  );
}
