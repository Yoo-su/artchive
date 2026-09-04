import Image from "next/image";
import { useTranslations } from "next-intl";

import { BookjeokTextLogo, LogoVariant } from "@/shared/components/icons/bookjeok-text-logo";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface LogoProps {
  size?: "sm" | "md";
  variant?: LogoVariant;
}

export const Logo = ({ size = "md", variant = "ko" }: LogoProps) => {
  const t = useTranslations("common.aria");
  const isSmall = size === "sm";
  const isKorean = variant.startsWith("ko");

  return (
    <Link
      href={PATHS.HOME}
      className="inline-block"
      aria-label={t("go_home")}
    >
      <div className="group relative flex items-center cursor-pointer select-none">
        <Image
          src="/logo-square-sketch.svg"
          alt=""
          width={isSmall ? 28 : 30}
          height={isSmall ? 28 : 30}
          className="mr-1 object-contain"
          unoptimized
        />
        <div className="relative flex items-center translate-y-[0.5px]">
          <BookjeokTextLogo
            variant={variant}
            className={`${
              isKorean
                ? isSmall
                  ? "h-[19px]"
                  : "h-[23px]"
                : isSmall
                  ? "h-[22px]"
                  : "h-[26px]"
            } w-auto text-[#242424] dark:text-neutral-100 transition-colors`}
          />
        </div>
      </div>
    </Link>
  );
};

