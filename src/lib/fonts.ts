import {
  Instrument_Serif,
  DM_Sans,
  JetBrains_Mono,
} from "next/font/google";

export const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/** Combined className string for all font CSS variables. */
export const fontVariables = [
  instrumentSerif.variable,
  dmSans.variable,
  jetbrainsMono.variable,
].join(" ");
