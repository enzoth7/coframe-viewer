import localFont from "next/font/local";

export const joyrideWide = localFont({
  src: [
    {
      path: "../public/fonts/joyride/JoyrideWIDE.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-joyride-wide",
  display: "swap",
});
