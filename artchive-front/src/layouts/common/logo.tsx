"use client";

import { useRouter } from "next/navigation";

export const Logo = () => {
  const router = useRouter();
  const handleClickLogo = () => {
    router.push("/home");
  };

  return (
    <div
      className="w-fit h-[30px] flex items-center justify-center cursor-pointer"
      onClick={handleClickLogo}
    >
      <span className="text-3xl font-extrabold font-sans leading-none tracking-tight">
        {/* 'Art' 부분: 로고 이미지의 어두운 파란색 계열로 변경 */}
        <span style={{ color: "#1a2a4b" }}>Art</span>
        {/* 'Chive' 부분: 로고 이미지의 어두운 녹색 계열로 변경 */}
        <span style={{ color: "#2b6d61" }}>Chive</span>
      </span>
    </div>
  );
};
