import { SVGProps } from "react";

export const NeogulipIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width="100"
      height="100"
      {...props}
    >
      <defs>
        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="fur-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF7043" />
          <stop offset="100%" stopColor="#F4511E" />
        </linearGradient>
      </defs>

      <g filter="url(#soft-shadow)">
        {/* === 거대한 나뭇잎 우산 (배경) === */}
        <g transform="rotate(-15 100 100) translate(-10 10)">
          <path
            d="M100 190 Q 100 150 100 100"
            stroke="#558B2F"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M100 110 
               C 70 100, 40 70, 60 40 
               C 75 15, 125 15, 140 40 
               C 160 70, 130 100, 100 110 
               Z"
            fill="#81C784"
            stroke="#4CAF50"
            strokeWidth="3"
            transform="scale(1.8) translate(-28 -20)"
          />
          <path
            d="M100 110 Q 100 60 100 10"
            stroke="#66BB6A"
            strokeWidth="3"
            fill="none"
            transform="scale(1.8) translate(-28 -20)"
          />
        </g>

        {/* === 꼬리 (풍성한 너구리/레서판다 꼬리) === */}
        <path
          d="M40 160 
             C 10 160, 0 130, 20 120 
             C 40 110, 60 140, 70 160"
          fill="url(#fur-gradient)"
        />
        <path
          d="M25 130 Q 30 145 45 138"
          stroke="#BF360C"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M20 145 Q 25 160 40 152"
          stroke="#BF360C"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* === 몸통 === */}
        <path
          d="M60 180 
             C 50 180, 45 150, 50 130 
             C 60 100, 140 100, 150 130 
             C 155 150, 150 180, 140 180 
             Z"
          fill="url(#fur-gradient)"
        />
        <ellipse cx="100" cy="155" rx="30" ry="22" fill="#FFF3E0" />

        {/* === 발 (작고 귀엽게) === */}
        <ellipse cx="75" cy="175" rx="10" ry="8" fill="#3E2723" />
        <ellipse cx="125" cy="175" rx="10" ry="8" fill="#3E2723" />

        {/* === 손 (앞으로 모은 손) === */}
        <ellipse cx="85" cy="145" rx="9" ry="7" fill="#3E2723" />
        <ellipse cx="115" cy="145" rx="9" ry="7" fill="#3E2723" />

        {/* === 머리 (크고 둥글게) === */}
        <ellipse cx="100" cy="95" rx="55" ry="45" fill="url(#fur-gradient)" />

        {/* === 귀 === */}
        <path
          d="M55 70 L 45 45 L 75 55 Z"
          fill="#3E2723"
          stroke="#3E2723"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M55 70 L 48 48 L 72 56 Z" fill="#FFF3E0" />
        <path
          d="M145 70 L 155 45 L 125 55 Z"
          fill="#3E2723"
          stroke="#3E2723"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M145 70 L 152 48 L 128 56 Z" fill="#FFF3E0" />

        {/* === 얼굴 무늬 (레서판다 특징) === */}
        {/* 볼 터치 같은 흰색 무늬 */}
        <circle cx="65" cy="105" r="18" fill="#FFFFFF" />
        <circle cx="135" cy="105" r="18" fill="#FFFFFF" />
        {/* 눈썹 같은 흰색 무늬 */}
        <ellipse
          cx="75"
          cy="75"
          rx="10"
          ry="6"
          fill="#FFFFFF"
          transform="rotate(-15 75 75)"
        />
        <ellipse
          cx="125"
          cy="75"
          rx="10"
          ry="6"
          fill="#FFFFFF"
          transform="rotate(15 125 75)"
        />

        {/* === 이목구비 === */}
        <circle cx="82" cy="100" r="5" fill="#3E2723" />
        <circle cx="118" cy="100" r="5" fill="#3E2723" />
        {/* 눈 반짝임 */}
        <circle cx="84" cy="98" r="2" fill="#FFFFFF" />
        <circle cx="120" cy="98" r="2" fill="#FFFFFF" />

        {/* 코 */}
        <ellipse cx="100" cy="110" rx="6" ry="4" fill="#3E2723" />

        {/* 입 (스마일) */}
        <path
          d="M90 118 Q 100 125 110 118"
          stroke="#3E2723"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* 홍조 */}
        <circle cx="65" cy="110" r="5" fill="#FFAB91" opacity="0.6" />
        <circle cx="135" cy="110" r="5" fill="#FFAB91" opacity="0.6" />
      </g>
    </svg>
  );
};
