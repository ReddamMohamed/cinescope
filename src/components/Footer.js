
import React from "react";
import { FaFilm, FaHeart, FaGithub } from "react-icons/fa";

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-card">
      <div className="max-w-7xl mx-auto px-6 py-10">

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          <div className="flex items-center gap-2">
            <FaFilm className="text-accent text-2xl" />
            <span className="text-xl font-black">
              CINE<span className="text-accent">SCOPE</span>
            </span>
          </div>

          <p className="text-gray-500 text-sm text-center">
            Discover stories. Explore entertainment.
          </p>

          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-white transition"
            aria-label="GitHub"
          >
            <FaGithub size={22} />
          </a>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-gray-600">
          <p>
            Made with <FaHeart className="inline text-accent mx-1" />
            by CineScope.
          </p>

          <p className="mt-2">
            TV data provided by TVmaze. Movie data provided by Wikidata.
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
