import { defineConfig } from "vitepress"

export default defineConfig({
  title: "GTLint",
  description: "A linter and formatter for the GuidedTrack language",
  base: "/gtlint/",

  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "GitHub", link: "https://github.com/jrc03c/gtlint" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "Rules", link: "/rules" },
          { text: "Formatter", link: "/formatter" },
          { text: "Configuration", link: "/configuration" },
          { text: "Directives", link: "/directives" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/jrc03c/gtlint" },
    ],

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the MIT License.",
    },
  },
})
