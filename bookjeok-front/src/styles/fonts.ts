import {
  Bitcount_Prop_Single,
  Gowun_Batang,
  Nanum_Gothic,
} from "next/font/google";
import localFont from "next/font/local";

export const nanum_gothic = Nanum_Gothic({
  weight: ["400", "700", "800"],
  variable: "--font-nanum-gothic",
  display: "swap",
  preload: false,
});

export const pretendard = localFont({
  src: "../../public/fonts/pretendard/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  preload: false,
});

export const bitcount = Bitcount_Prop_Single({
  weight: ["400"],
  variable: "--font-bitcount",
  display: "swap",
  preload: false,
});

export const gowun_batang = Gowun_Batang({
  weight: ["400", "700"],
  variable: "--font-gowun-batang",
  display: "swap",
  subsets: ["latin"],
});
