"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  ArrowUpRight,
  Search,
  Headphones,
  Home,
  Library,
  BookOpen,
  UserRound,
} from "lucide-react";
import "@/app/mobile-navigation.css";
import { HeaderSearch } from "./header-search";

const links = [
  ["Home", "/"],
  ["Library", "/library"],
  ["Courses", "/courses"],
  ["Teachers", "/teachers"],
  ["Dedications", "/dedications"],
  ["Account", "/account"],
];
const mobileLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Browse", href: "/library", icon: Library },
  { label: "Search", href: "/library#library-query", icon: Search },
  { label: "Courses", href: "/courses", icon: BookOpen },
  { label: "My learning", href: "/account", icon: UserRound },
];
function isMobileDestinationActive(
  pathname: string,
  href: string,
  searchActive: boolean,
) {
  if (href.includes("#")) return pathname === "/library" && searchActive;
  if (href === "/library" && pathname === "/library" && searchActive)
    return false;
  if (href === "/") return pathname === "/";
  if (href === "/library" && pathname.startsWith("/lessons/")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  useEffect(() => {
    const updateHash = () => {
      const active = window.location.hash === "#library-query";
      setSearchActive(active);
      if (pathname === "/library" && active)
        document.getElementById("library-query")?.focus();
    };
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link
            href="/"
            className="brand"
            aria-label="Breslov Torah home"
            onClick={() => setOpen(false)}
          >
            <img src="/images/logo.png" alt="" />
            <span className="brand-wordmark">
              Breslov Torah<small>The teachings of Rebbe Nachman</small>
            </span>
          </Link>
          <nav
            aria-label="Main navigation"
            className={open ? "main-nav is-open" : "main-nav"}
          >
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={
                  (href === "/" ? pathname === "/" : pathname.startsWith(href))
                    ? "active"
                    : ""
                }
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <HeaderSearch />
            <a
              className="donate-link"
              href="/donate"
              target="_blank"
              rel="noreferrer"
            >
              Support our work <ArrowUpRight size={15} />
            </a>
            <button
              className="menu-toggle"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="page-wrap footer-grid">
          <div>
            <Link href="/" className="footer-brand">
              Breslov Torah<span>Wisdom for everyday life.</span>
            </Link>
            <p>
              The teachings of Rebbe Nachman.
              <br />A living tradition, open to everyone.
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <Link href="/library">Shiurim library</Link>
            <Link href="/courses">Learning courses</Link>
            <Link href="/teachers">Our teachers</Link>
            <Link href="/calendar">Class schedule</Link>
            <Link href="/community">Community &amp; prayer</Link>
            <Link href="/blog">Articles &amp; updates</Link>
            <Link href="/newsletter">Breslov Bridge newsletter</Link>
          </div>
          <div>
            <h3>Connect</h3>
            <Link href="/about">About Breslov Torah</Link>
            <Link href="/dedications">Dedicate a teaching</Link>
            <Link href="/account">My learning</Link>
            <a href="/contact" target="_blank" rel="noreferrer">
              Contact us <ArrowUpRight size={13} />
            </a>
            <a href="/donate" target="_blank" rel="noreferrer">
              Support the learning <ArrowUpRight size={13} />
            </a>
          </div>
          <div className="footer-note">
            <Headphones size={25} />
            <h3>Make room for inspiration.</h3>
            <p>Timeless Torah, wherever life takes you.</p>
            <Link href="/library">
              Find your next shiur <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="page-wrap footer-bottom">
          <span>© {new Date().getFullYear()} Breslov Torah</span>
          <span>Learn. Reflect. Grow.</span>
          <a href="#main-content">Back to top ↑</a>
        </div>
      </footer>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mobileLinks.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={
              isMobileDestinationActive(pathname, href, searchActive)
                ? "page"
                : undefined
            }
            onClick={() => {
              setOpen(false);
              setSearchActive(href.includes("#"));
              if (href.includes("#") && pathname === "/library")
                document.getElementById("library-query")?.focus();
            }}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
export default Shell;
