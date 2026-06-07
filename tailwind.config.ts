import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        bg2: "var(--bg2)",
        bg3: "var(--bg3)",
        card: "var(--card)",
        black: "var(--black)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        txt: "var(--txt)",
        muted: "var(--muted)",
        "muted-2": "var(--muted-2)",
        gold: "var(--gold)",
        "gold-dim": "var(--gold-dim)",
        safe: "var(--safe)",
        tight: "var(--tight)",
        late: "var(--late)",
        info: "var(--info)",
      },
      fontFamily: {
        poppins: ["Poppins", "system-ui", "sans-serif"],
        cormorant: ["Cormorant Garamond", "Georgia", "serif"],
      },
      borderRadius: {
        r: "var(--r)",
      },
      boxShadow: {
        vtw: "var(--shadow)",
        "vtw-md": "var(--shadow-md)",
        "vtw-lg": "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
export default config;
