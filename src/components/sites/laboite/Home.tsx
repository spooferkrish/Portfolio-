"use client";
/* eslint-disable @next/next/no-img-element -- Preserve original asset crops. */
/* eslint-disable @next/next/no-html-link-for-pages -- Home links reset the scroll-driven scene. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import reference from "../../../../docs/research/laboite/source.json";
import details from "../../../../docs/research/laboite/details.json";
import content from "../../../../docs/research/laboite/content.json";
import { ModelScene } from "./ModelScene";
import { VrModel } from "./VrModel";
import { clamp, damp } from "./motion";
import "./laboite.css";

const origin = "https://laboiteaslides.fr";
const asset = (url: string) => `/sites/laboite/${url.split("/").pop()}`;
const photo = (index: number) => asset(details.images[index].src);
const navigation = reference.links
  .filter((x) =>
    [
      "Accueil",
      "Réalisations",
      "Nous connaître",
      "Notre méthode",
      "Ressources",
      "Contact",
      "Offres d'emploi",
    ].includes(x.text),
  )
  .slice(0, 7);
const projects = reference.links.filter(
  (x) => x.href.includes("/realisations/") && x.text,
);
const expertise = reference.links.filter((x) =>
  [
    "PRÉSENTATIONS",
    "COMMUNICATION 360",
    "NAVIGATION APP LIKE",
    "SÉMINAIRE VR",
    "SOLUTIONS IA",
  ].includes(x.text),
);
const resources = reference.links.filter((x) =>
  /^(Article|Cas client|Livre blanc)\n\d/.test(x.text),
).slice(1, 4);
const methodProofs = [
  "0 retard sur +8 000 projets. Nous utilisons la rigueur de l’ISO 9001 pour sécuriser vos calendriers.",
  "96% de stabilité de l’enveloppe budgétaire. Notre méthode vise la justesse dès le départ pour respecter votre budget.",
  "La preuve ultime d’un rendu maîtrisé ? Un taux de réachat de 85% auprès des directions marketing, qui nous renouvellent leur confiance au cours de l’année.",
];
const footerExpertiseNames = [
  "Communication 360", "Navigation App Like", "Animatiques", "Conférences Interactives",
  "Séminaire VR", "Solutions IA", "Formations & Coaching",
];
const footerExpertise = footerExpertiseNames
  .map((name) => reference.links.find((link) => link.text === name))
  .filter((link) => link !== undefined);
const faqs = content.faq;
const reviewText = reference.text
  .split("ILS NOUS FONT\nCONFIANCE\n")[1]
  .split("\nFAQ")[0];
const reviews = [
  ...reviewText.matchAll(/([^\n]+)\n\n([^\n]+)\n\n(“[\s\S]*?”)/g),
].map((x) => ({ name: x[1], role: x[2], quote: x[3] }));
function ArrowLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a className="arrow-link" href={href}>
      <span aria-hidden="true">↗</span>
      {children}
    </a>
  );
}
function Logo() {
  return (
    <img
      className="brand"
      src="/sites/laboite/logo.svg"
      alt="La boîte à slides"
    />
  );
}

export function LaboiteHome() {
  const [menu, setMenu] = useState(false),
    [scrolled, setScrolled] = useState(false),
[darkHeader, setDarkHeader] = useState(false),
    [activeFaq, setActiveFaq] = useState<number | null>(null),
    [showAllFaqs, setShowAllFaqs] = useState(false),
[review, setReview] = useState(0),
[videoOpen, setVideoOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    hero = useRef<HTMLElement>(null);
const story = useRef<HTMLDivElement>(null);
const statement = useRef<HTMLElement>(null);
const method = useRef<HTMLElement>(null);
const vr = useRef<HTMLElement>(null);
const quality = useRef<HTMLElement>(null);
const videoDialog = useRef<HTMLDialogElement>(null);
const teaserVideo = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const sections = [hero, statement, method, vr, quality];
    const target = [0, 0, 0, 0, 0];
    const current = [0, 0, 0, 0, 0];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastFrame = 0;
    const progress = (element: HTMLElement | null) => {
      if (!element) return 0;
      const rect = element.getBoundingClientRect();
      return clamp(-rect.top / Math.max(rect.height - innerHeight, 1));
    };
    const inDarkSection = (element: HTMLElement | null) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.top <= 50 && rect.bottom > 50;
    };
    const render = (time: number) => {
      frame = 0;
      const elapsed = lastFrame ? time - lastFrame : 16;
      lastFrame = time;
      let moving = false;
      sections.forEach((section, index) => {
        current[index] = reducedMotion.matches ? target[index] : damp(current[index], target[index], elapsed);
        if (Math.abs(current[index] - target[index]) < .0005) current[index] = target[index];
        else moving = true;
        section.current?.style.setProperty(["--progress", "--statement", "--method", "--vr", "--quality"][index], String(current[index]));
      });
      hero.current?.style.setProperty("--white", `${clamp((current[0] - .25) * 4) * 100}%`);
      method.current?.style.setProperty("--cyan", `${clamp((current[2] - .1) * 5) * 100}%`);
      setDarkHeader((inDarkSection(vr.current) && (matchMedia("(max-width: 800px)").matches || current[3] > .4)) || [quality.current, document.querySelector<HTMLElement>(".laboite footer")].some(inDarkSection));
      if (moving) frame = requestAnimationFrame(render);
    };
    const scroll = () => {
      sections.forEach((section, index) => { target[index] = progress(section.current); });
      setScrolled(target[0] > .4 || !!hero.current && hero.current.getBoundingClientRect().bottom <= innerHeight);
      if (!frame) frame = requestAnimationFrame(render);
    };
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    reducedMotion.addEventListener("change", scroll);
    return () => {
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      reducedMotion.removeEventListener("change", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    if (menu) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);
useEffect(() => {
if (videoOpen) videoDialog.current?.showModal();
else videoDialog.current?.close();
}, [videoOpen]);
useEffect(() => {
const video = teaserVideo.current;
if (!video) return;
const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
const playback = () => {
  if (scrolled || preference.matches || document.hidden) video.pause();
  else video.play().catch(() => {});
};
playback();
preference.addEventListener("change", playback);
document.addEventListener("visibilitychange", playback);
return () => {
  preference.removeEventListener("change", playback);
  document.removeEventListener("visibilitychange", playback);
};
}, [scrolled]);
  const close = () => {
    setMenu(false);
    trigger.current?.focus();
  };
  return (
    <div className="laboite">
      <a className="skip" href="#contenu">
        Aller au contenu
      </a>
<header className={`site-header ${scrolled && !darkHeader ? "on-white" : ""}`}>
        <a href="/" aria-label="Accueil">
          <Logo />
        </a>
        <button
          ref={trigger}
          className="menu-toggle"
          aria-haspopup="dialog"
          aria-expanded={menu}
          onClick={() => setMenu(true)}
        >
          <span aria-hidden="true">⁙</span> Menu
        </button>
        <a className="quote-button" href={`${origin}/contact`}>
          Demander un devis
        </a>
      </header>
      <dialog
        ref={dialog}
        className="menu-dialog"
        onCancel={close}
        aria-label="Menu principal"
      >
        <div className="menu-head">
          <a href="/">
            <Logo />
          </a>
          <button className="menu-toggle" onClick={close}>
            × Fermer
          </button>
          <a className="quote-button" href={`${origin}/contact`}>
            Demander un devis
          </a>
        </div>
        <div className="menu-body">
          <div className="menu-feature">
            <img src={photo(0)} alt="Conférences interactives" />
            <h2>
              Conférences
              <br />
              interactives
            </h2>
            <ArrowLink href={`${origin}/expertises/conferences-interactives`}>
              Découvrir
            </ArrowLink>
          </div>
          <nav aria-label="Navigation principale">
            <small>EXPLORER</small>
            {navigation.map((x) => (
              <a key={x.text} href={x.text === "Accueil" ? "/" : x.href}>
                {x.text}
              </a>
            ))}
          </nav>
          <nav className="menu-expertises" aria-label="Expertises">
            <small>EXPERTISES</small>
            {expertise.map((x) => (
              <a key={x.text} href={x.href}>
                {x.text}
              </a>
            ))}
          </nav>
        </div>
        <div className="menu-bottom">
          Paris, Bordeaux, Verdun, Aix-en-Provence, Rennes, Strasbourg
        </div>
      </dialog>
      <div className={`video-teaser ${scrolled ? "is-hidden" : ""}`}>
        <video ref={teaserVideo} src="/sites/laboite/home-video.mp4" loop muted playsInline aria-hidden="true" />
        <button aria-label="Agrandir la vidéo" onClick={() => setVideoOpen(true)}>+</button>
      </div>
      <dialog ref={videoDialog} className="video-dialog" onCancel={() => setVideoOpen(false)} aria-label="Vidéo La boîte à slides">
        <button className="video-close" onClick={() => setVideoOpen(false)}>Fermer ×</button>
        {videoOpen && <video src="/sites/laboite/home-video.mp4" controls autoPlay playsInline />}
      </dialog>
      <main id="contenu">
        <div ref={story} className="story">
          <ModelScene storyRef={story} />
        <section
          ref={hero}
          className="hero"
          aria-label="Les meilleures idées font l’avenir"
        >
          <div className="hero-stage">
            <div className="shapes" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} className={`shard shard-${i}`} />
              ))}
            </div>
            <h1 className="hero-title">
              <span>Les meilleures</span>
              <span>idées font</span>
              <span>l’avenir</span>
            </h1>
            <p className="hero-subtitle">
              Quand elles sont
              <br />
              bien présentées
            </p>
            <p className="hero-next" aria-hidden="true">
              Quand elles
              <br />
              sont bien
              <br />
              <span>présentées</span>
            </p>
            <a
              href="#introduction"
              className="scroll-cue"
              aria-label="Défiler vers la présentation"
            >
              Scroll ↘<br />
              Scroll ↘
            </a>
          </div>
        </section>
        <section id="introduction" className="intro">
          <div className="intro-stage section-width">
          <p className="large-copy">
            La boite à slides<sup>®</sup> :<br />
            seule agence au monde
            <br />
            certifiée ISO 9001
            <br />
            qui transforme PowerPoint
            <br />
            en un puissant levier d’impact
            <br />
            pour votre business
          </p>
          <ArrowLink href="#projets">Découvrir</ArrowLink>
          </div>
        </section>
        <section ref={statement} className="statement">
          <div className="statement-stage section-width">
          <h2>
            {"Notre agence PowerPoint amplifie le retentissement des présentations stratégiques des leaders. On équipe ceux qui veulent faire bouger les lignes, dans tous les secteurs".split(" ").map((word, index) => (
              <span key={index} style={{ "--word": index } as CSSProperties}>{word}{" "}</span>
            ))}
          </h2>
          <div>
            <p>Nos clients ont des idées fortes, des stratégies à partager, des messages complexes à faire passer. Avec des contenus interactifs et des expériences captivantes, ils offrent à leur cible ce qu’il y a de plus puissant : l’évidence.</p>
            <ArrowLink href={`${origin}/realisations`}>
              Nos réalisations
            </ArrowLink>
          </div>
          </div>
        </section>
        </div>
        <section id="projets" className="portfolio section-width">
          <div className="section-heading">
            <h2>
              Un seul outil,
              <br />
              des possibilités
              <br />
              infinies
            </h2>
            <ArrowLink href={`${origin}/realisations`}>
              Toutes nos réalisations
            </ArrowLink>
          </div>
          <div className="project-grid">
            {projects.map((x, i) => {
              const [name, type] = x.text.split("\n");
              return (
                <a className="project-card" key={x.href} href={x.href}>
                  <img
                    src={photo(i + 2)}
                    alt={details.images[i + 2].alt}
                    loading="lazy"
                  />
                  <div className="project-caption">
                    <div>
                      <h3>{name}</h3>
                      <p>{type}</p>
                    </div>
                    <span className="circle-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
        <section ref={method} className="method">
          <ModelScene storyRef={method} variant="cyan" />
          <div className="marquee" aria-hidden="true">
            {[0, 1].map((i) => (
              <span key={i}>
                Depuis 2002 ● ISO 9001 ● 5/5 Note Google Avis ● +8 000 projets ●
                85% de réachat ● MOS PowerPoint ●{" "}
              </span>
            ))}
          </div>
          <div className="section-width method-content">
            <h2>
              Tirer parti des dernières avancées technologiques et intelligences artificielles pour valoriser vos messages les plus importants
            </h2>
            <p className="method-introduction">À la boite à slides, on maximise l’engagement de votre public depuis 2002. On repousse les limites de PowerPoint pour vous faire gagner en impact, en performance et en autonomie. Pour votre plus grande satisfaction.</p>
            <div>
              {methodProofs.map((proof, i) => <p className={i === 0 ? "large-copy" : undefined} key={proof}>{proof}</p>)}
              <a className="method-badges" href={`${origin}/la-methode-labas`} aria-label="Notre méthode et certifications">
                {[10, 11, 12].map((index) => <img key={index} src={photo(index)} alt={details.images[index].alt} />)}
              </a>
            </div>
          </div>
          <div className="trust-line section-width">
            <span>La seule agence PPT au monde certifiée ISO 9001</span>
            <span>85% de réachat</span>
            <span>5/5 Note Google Avis</span>
            <span>Certifiés Microsoft Office Specialist PowerPoint</span>
          </div>
        </section>
        <div className="method-proof-mobile">
          {methodProofs.map((proof, i) => (
            <div className="method-proof" key={proof}>
              <p>{proof}</p>
              {i < 2 && (
                <div className="method-proof-badges" aria-label="Certifications et avis">
                  {[10, 11, 12].map((index) => <span key={index}><img src={photo(index)} alt={details.images[index].alt} loading="lazy" /></span>)}
                </div>
              )}
            </div>
          ))}
          <ArrowLink href={`${origin}/realisations`}>Voir nos réalisations</ArrowLink>
        </div>
        <section className="expertise section-width">
          <p className="eyebrow">Nos expertises</p>
          {expertise.map((x, i) => (
            <a key={x.href} href={x.href}>
              <span>{x.text}</span>
              <span className="expertise-arrow">↗</span>
              <img src={photo(16 + i)} alt="" loading="lazy" />
            </a>
          ))}
        </section>
        <section ref={vr} className="vr">
          <div className="vr-stage">
            <h2 className="vr-heading">
              Dépassez
              <br className="mobile-break" />
              {" "}toutes
              <br className="desktop-break" />
              {" "}les
              <br className="mobile-break" />
              {" "}<em>limites de
              <br />
              PowerPoint</em>
            </h2>
          <div className="vr-copy">
            <p>
              Une expérience aussi bluffante, vous n’êtes pas prêt de l’oublier.
              Votre public non plus.
            </p>
            <ArrowLink href={`${origin}/expertises/conferences-interactives`}>
              En savoir plus
            </ArrowLink>
          </div>
          <div className="vr-visual">
            <VrModel sectionRef={vr} />
            <img
              src={photo(19)}
              alt="Immersion en réalité virtuelle"
              loading="lazy"
            />
          </div>
          </div>
        </section>
        <section className="about section-width">
          <img src={photo(21)} alt="La boîte à slides" loading="lazy" />
          <div>
            <h2>
              Toujours
              <br />
              carrés. <em>Jamais
              <br />
              formatés.</em>
            </h2>
            <p>
              Une équipe de spécialistes qui réunit sans concession une culture
              de la réflexion et le goût de l’inattendu. Ça donne la première
              agence PowerPoint en France.
            </p>
            <ArrowLink href={`${origin}/nous-connaitre`}>
              Nous connaître
            </ArrowLink>
          </div>
        </section>
        <section className="resources section-width">
          <div className="section-heading">
            <h2>
              Nos dernières
              <br />
              <em>ressources</em>
            </h2>
            <ArrowLink href={`${origin}/ressources`}>
              Voir toutes nos ressources
            </ArrowLink>
          </div>
          <div className="resource-grid">
            {resources.map((x, i) => {
              const [type, date, title] = x.text.split("\n");
              return (
                <a
                  href={x.href}
                  className={`resource resource-${i}`}
                  key={x.href}
                >
                  {i === 1 && (
                    <img
                      src={photo(22)}
                      alt="Équipe qui applaudit"
                      loading="lazy"
                    />
                  )}
                  {i === 2 && <img src="/sites/laboite/whitepaper-2.png" alt="" loading="lazy" />}
                  <div className="resource-meta">
                    <span>{type}</span>
                    <span>{date}</span>
                  </div>
                  <h3>{title}</h3>
                  <span className="circle-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              );
            })}
          </div>
        </section>
        <section ref={quality} className="quality">
          <div className="quality-inner section-width">
            <h2>
              Engagés pour
              <br />
              <em>la qualité</em>
            </h2>
            <div className="quality-grid">
              {[
                "5 étoiles Google Avis",
                "Certifié ISO 9001:2015 Bureau Veritas",
                "Microsoft Office Specialist",
              ].map((x, i) => (
                <article key={x}>
                  <h3>{x}</h3>
                  <img src={photo(23 + i)} alt={x} loading="lazy" />
                  <p>
                    {["Notation 2026", "Certification 2025", "Depuis 2020"][i]}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="testimonials section-width">
          <div className="section-heading">
            <h2>
              Ils nous font
              {" "}<em>confiance</em>
            </h2>
            <div className="carousel-buttons">
              <button
                aria-label="Avis précédent"
                onClick={() =>
                  setReview((review - 1 + reviews.length) % reviews.length)
                }
              >
                ←
              </button>
              <button
                aria-label="Avis suivant"
                onClick={() => setReview((review + 1) % reviews.length)}
              >
                →
              </button>
            </div>
          </div>
          <div className="review-grid" aria-live="polite">
            {[0, 1, 2, 3].map((offset) => {
              const i = (review + offset) % reviews.length,
                item = reviews[i];
              return (
                item && (
                  <article key={offset}>
                    <header>
                      <img src={photo(26 + i)} alt="" />
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.role}</p>
                      </div>
                    </header>
                    <blockquote>{item.quote}</blockquote>
                  </article>
                )
              );
            })}
          </div>
        </section>
        <section className="faq section-width">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>
              Des questions ?<br />
              <em>On vous répond</em>
            </h2>
          </div>
          <div>
            {faqs.slice(0, showAllFaqs ? faqs.length : 6).map((x, i) => (
              <div className="faq-item" key={x.q}>
                <h3>
                  <button
                    aria-expanded={activeFaq === i}
                    aria-controls={`answer-${i}`}
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  >
                    {x.q}
                    <span aria-hidden="true">
                      {activeFaq === i ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div id={`answer-${i}`} hidden={activeFaq !== i}>
                  <p>{x.a}</p>
                </div>
              </div>
            ))}
            <button className="faq-more arrow-link" onClick={() => setShowAllFaqs(!showAllFaqs)} aria-expanded={showAllFaqs}>
              <span aria-hidden="true">{showAllFaqs ? "−" : "+"}</span>
              {showAllFaqs ? "Voir moins de questions" : "Voir plus de questions"}
            </button>
          </div>
        </section>
      </main>
      <footer>
        <div className="section-width">
          <a href={`${origin}/contact`} className="footer-cta">
            Prêt à transformer
            <br />
            votre impact ? <span aria-hidden="true">↗</span>
          </a>
          <div className="footer-hero-mobile">
            <h2>Prêt à<br />transformer<br />votre <em>impact?</em></h2>
            <ArrowLink href={`${origin}/contact`}>Contactez-nous</ArrowLink>
          </div>
          <div className="footer-grid">
            <div>
              <a href="/">
                <Logo />
              </a>
              <p className="footer-language"><strong>FR</strong> EN</p>
              <p>
                Paris, Bordeaux, Verdun,
                <br />
                Aix-en-Provence, Rennes, Strasbourg
              </p>
              <a href="https://www.linkedin.com/company/laboiteaslides/">
                LinkedIn ↗
              </a>
              <br />
              <a href="https://vimeo.com/laboiteaslides">Vimeo ↗</a>
            </div>
            <nav aria-label="Explorer">
              <h3>Explorer</h3>
              {navigation.map((x) => (
                <a key={x.text} href={x.text === "Accueil" ? "/" : x.href}>
                  {x.text}
                </a>
              ))}
            </nav>
            <nav aria-label="Nos expertises">
              <h3>Expertises</h3>
              <div className="footer-links">
                {footerExpertise.map((x) => <a key={x.href} href={x.href}>{x.text}</a>)}
              </div>
            </nav>
            <nav aria-label="Présentations">
              <h3>Présentations</h3>
              <div className="footer-links">
                {reference.links
                  .filter((x) => x.text && x.href.includes("/presentations-powerpoint/"))
                  .map((x) => <a key={x.href} href={x.href}>{x.text}</a>)}
              </div>
            </nav>
            <div className="footer-certifications" aria-label="Certifications et avis">
              {[10, 11, 12].map((index) => <img key={index} src={photo(index)} alt={details.images[index].alt} loading="lazy" />)}
            </div>
            <div className="footer-social-mobile">
              <a href="https://www.linkedin.com/company/laboiteaslides/">LinkedIn ↗</a>
              <a href="https://vimeo.com/laboiteaslides">Vimeo ↗</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>©2026</span>
            <a href={`${origin}/mentions-legales`}>Mentions légales</a>
            <a href={`${origin}/politique-de-confidentialite`}>
              Politique de confidentialité
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
