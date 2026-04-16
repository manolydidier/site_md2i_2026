'use client';

import React from "react";

type AnimatedMD2ILogoProps = {
  width?: number | string;
  className?: string;
};

const baseAnim: React.CSSProperties = {
  transformBox: "fill-box",
  transformOrigin: "center",
  opacity: 0,
};

export default function AnimatedMD2ILogo({
  width = 420,
  className = "",
}: AnimatedMD2ILogoProps) {
  return (
    <div
      className={`md2i-logo-wrap ${className}`}
      style={{ width }}
      aria-label="Logo MD2I animé"
    >
      <svg
        viewBox="235 10 320 145"
        xmlns="http://www.w3.org/2000/svg"
        className="md2i-logo-svg"
      >
        <defs>
          <linearGradient
            id="md2i-grad-191"
            x1="432.74"
            y1="130.26"
            x2="494.72"
            y2="166.62"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#e48100" />
            <stop offset=".11" stopColor="#e49624" />
            <stop offset=".22" stopColor="#e5a742" />
            <stop offset=".33" stopColor="#e5b458" />
            <stop offset=".44" stopColor="#e5bc65" />
            <stop offset=".54" stopColor="#e6bf6a" />
            <stop offset=".71" stopColor="#cf9e4b" />
            <stop offset=".89" stopColor="#ba8131" />
            <stop offset="1" stopColor="#b37727" />
          </linearGradient>

          <linearGradient
            id="md2i-grad-79"
            x1="415.3"
            y1="27.5"
            x2="487.4"
            y2="27.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#dd8524" />
            <stop offset=".54" stopColor="#e6bf6a" />
            <stop offset=".72" stopColor="#e3a845" />
            <stop offset=".9" stopColor="#e09528" />
            <stop offset="1" stopColor="#e08f1e" />
          </linearGradient>

          <linearGradient
            id="md2i-grad-122"
            x1="454.68"
            y1="145.94"
            x2="447.64"
            y2="66.06"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#f80" />
            <stop offset=".11" stopColor="#f69a24" />
            <stop offset=".22" stopColor="#efaa42" />
            <stop offset=".33" stopColor="#eab558" />
            <stop offset=".44" stopColor="#e7bc65" />
            <stop offset=".54" stopColor="#e6bf6a" />
            <stop offset=".61" stopColor="#dcb156" />
            <stop offset=".79" stopColor="#c69127" />
            <stop offset=".92" stopColor="#b87e0a" />
            <stop offset="1" stopColor="#b37700" />
          </linearGradient>

          <linearGradient
            id="md2i-grad-173"
            x1="452.19"
            y1="13.88"
            x2="465.46"
            y2="137.22"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#dd8300" />
            <stop offset=".05" stopColor="#db8607" />
            <stop offset=".12" stopColor="#d8911c" />
            <stop offset=".21" stopColor="#d3a23e" />
            <stop offset=".22" stopColor="#d3a543" />
            <stop offset=".33" stopColor="#daac4e" />
            <stop offset=".44" stopColor="#e5b860" />
            <stop offset=".49" stopColor="#e4b65d" />
            <stop offset=".52" stopColor="#e4b053" />
            <stop offset=".55" stopColor="#e2a644" />
            <stop offset=".58" stopColor="#e1992e" />
            <stop offset=".59" stopColor="#e09121" />
            <stop offset="1" stopColor="#e08f1e" />
          </linearGradient>
        </defs>

        {/* MD gauche */}
        <g
          style={{
            ...baseAnim,
            animation: "md2iLeftIn 0.95s cubic-bezier(.22,1,.36,1) 0.1s forwards",
          }}
        >
          <path
            fill="#666665"
            d="M424.99,54.92c-3.04-6.1-7.33-10.9-12.87-14.37-5.54-3.48-12.09-5.22-19.66-5.22h-23.31v23.28c4.13,1.32,7.12,5.18,7.12,9.75v20.13c0,4.57-2.99,8.43-7.12,9.75v18.23h23.31c7.57,0,14.12-1.74,19.66-5.22,5.54-3.48,9.83-8.27,12.87-14.37,3.04-6.1,4.56-13.1,4.56-20.98s-1.52-14.88-4.56-20.98ZM414.24,91.03c-2.16,4.29-5.12,7.57-8.87,9.85-3.75,2.28-8.02,3.42-12.82,3.42h-11.35v-56.8h11.35c4.8,0,9.07,1.14,12.82,3.42,3.75,2.28,6.7,5.55,8.87,9.79,2.16,4.25,3.24,9.31,3.24,15.18s-1.08,10.84-3.24,15.13Z"
          />
          <path
            fill="#666665"
            d="M352.8,88.49v-20.13c0-4.38,2.76-8.11,6.63-9.57v-1.38c0-4.4-.74-8.36-2.2-11.88-1.47-3.52-3.51-6.32-6.13-8.4-2.62-2.09-5.69-3.13-9.21-3.13s-6.54,1.04-9.21,3.13c-2.68,2.09-4.75,4.89-6.22,8.4-1.47,3.52-2.2,7.48-2.2,11.88v38.83c0,1.7-.32,3.27-.97,4.69-.65,1.43-1.5,2.57-2.56,3.42-1.06.85-2.23,1.28-3.53,1.28s-2.38-.42-3.44-1.28c-1.06-.85-1.91-1.99-2.56-3.42-.65-1.43-.97-2.99-.97-4.69v-38.83c0-4.4-.74-8.36-2.2-11.88-1.47-3.52-3.53-6.32-6.17-8.4-2.65-2.09-5.73-3.13-9.26-3.13s-6.53,1.04-9.17,3.13c-2.65,2.09-4.7,4.89-6.17,8.4-1.47,3.52-2.2,7.48-2.2,11.88v59.12h10.49v-60.85c0-1.78.32-3.38.97-4.81.65-1.43,1.5-2.57,2.56-3.42,1.06-.85,2.23-1.28,3.53-1.28s2.48.43,3.57,1.28c1.09.85,1.95,1.99,2.6,3.42.65,1.43.97,3.03.97,4.81v38.83c0,4.56.75,8.6,2.25,12.11,1.5,3.52,3.58,6.26,6.26,8.23,2.67,1.97,5.66,2.96,8.95,2.96s6.42-.99,9.04-2.96c2.62-1.97,4.69-4.71,6.22-8.23,1.53-3.52,2.29-7.55,2.29-12.11v-38.83c0-1.78.32-3.38.97-4.81.65-1.43,1.51-2.57,2.6-3.42,1.09-.85,2.28-1.28,3.57-1.28s2.47.43,3.53,1.28c1.06.85,1.9,1.99,2.51,3.42.62,1.43.93,3.03.93,4.81v60.85h10.58v-18.47c-3.87-1.46-6.63-5.19-6.63-9.57Z"
          />
        </g>

        {/* Symbole orange */}
        <g>
          <path
            fill="url(#md2i-grad-191)"
            d="M415.06,134.07v1.58c0,3.69,2.84,6.69,6.34,6.69h63.81c.49,0,.96-.06,1.41-.17-15.16-.61-60.75-3.03-71.12-10.51-.28.76-.43,1.58-.43,2.41Z"
            style={{
              ...baseAnim,
              animation:
                "md2iOrangeIn 0.85s cubic-bezier(.22,1,.36,1) 0.05s forwards, md2iFloat 4s ease-in-out 1.2s infinite",
            }}
          />
          <path
            fill="url(#md2i-grad-79)"
            d="M487.37,47.46c.01-.46.03-.92.03-1.39,0-18.96-10.87-38.54-36.68-38.54-11.79,0-24.24,5.5-32.79,11.93-2.42,1.82-3.3,5.2-2.12,8.08l.07.17c1.11,2.72,3.69,4.2,6.27,4.01,27.76-31.28,61.63-7.84,65.22,15.73Z"
            style={{
              ...baseAnim,
              animation:
                "md2iOrangeIn 0.85s cubic-bezier(.22,1,.36,1) 0.18s forwards, md2iFloat 4s ease-in-out 1.3s infinite",
            }}
          />
          <path
            fill="url(#md2i-grad-122)"
            d="M491.54,135.65v-1.5c0-3.69-2.84-6.69-6.34-6.69h-47.48v-.41l6.16-6.29c46.16-55.12,31.49-91.73,16.25-96.03,8.99,4.2,12.24,13.62,12.24,23.61-.18,19.98-14.01,37.11-44.6,69.33l-10.9,11.71c-.61.66-1.08,1.43-1.39,2.28,4.5,10.27,55.96,9.91,71.12,10.51,2.82-.68,4.93-3.34,4.93-6.52Z"
            style={{
              ...baseAnim,
              animation:
                "md2iOrangeIn 0.85s cubic-bezier(.22,1,.36,1) 0.32s forwards, md2iFloat 4s ease-in-out 1.4s infinite",
            }}
          />
          <path
            fill="url(#md2i-grad-173)"
            d="M442.89,120.76l3.43-3.5c24.77-26.4,40.66-45.94,41.25-69.78-3.58-23.57-37.46-47-65.22-15.73,1.04-.08,2.08-.42,3.03-1.06,6.13-4.18,14.45-8.25,22.22-8.25,4.61,0,8.41.83,11.53,2.29,15.25,4.29,29.92,40.9-16.25,96.03Z"
            style={{
              ...baseAnim,
              animation:
                "md2iOrangeIn 0.85s cubic-bezier(.22,1,.36,1) 0.46s forwards, md2iFloat 4s ease-in-out 1.5s infinite",
            }}
          />
        </g>

        {/* Ligne grise */}
        <g
          style={{
            ...baseAnim,
            animation: "md2iGrayIn 0.75s cubic-bezier(.22,1,.36,1) 0.36s forwards",
          }}
        >
          <path
            fill="#666665"
            d="M409.12,135.55v.47c0,3.58-2.88,6.48-6.45,6.48h-45.17c-32.31-2.21-69.39-6.01-81.84-12.36,1.01-.67,2.23-1.06,3.53-1.06h123.48c3.56,0,6.45,2.9,6.45,6.47Z"
          />
          <path
            fill="#474747"
            d="M357.5,142.5h-78.31c-3.56,0-6.45-2.9-6.45-6.48v-.47c0-2.26,1.15-4.25,2.91-5.41,6.97,10.08,49.53,10.15,81.84,12.36Z"
          />
          <path
            fill="#666665"
            d="M275.66,130.14c12.45,6.35,49.53,10.15,81.84,12.36-32.31-2.21-74.87-2.28-81.84-12.36Z"
          />
        </g>

        {/* i reconstitué proprement */}
        <g
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
        >
          <circle
            cx="518"
            cy="33"
            r="10.5"
            fill="#666665"
            style={{
              ...baseAnim,
              animation:
                "md2iDotIn 0.6s cubic-bezier(.22,1,.36,1) 0.78s forwards, md2iDotBounce 2.6s ease-in-out 1.8s infinite",
            }}
          />
          <rect
            x="509.5"
            y="52"
            width="17"
            height="82"
            rx="8.5"
            fill="#666665"
            style={{
              ...baseAnim,
              animation:
                "md2iStemIn 0.75s cubic-bezier(.22,1,.36,1) 0.68s forwards, md2iStemPulse 2.8s ease-in-out 1.8s infinite",
            }}
          />
        </g>

        {/* Loupe animée */}
        <g
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            opacity: 0,
            animation:
              "md2iLoupeIn 0.72s cubic-bezier(.22,1,.36,1) 1.02s forwards, md2iLoupeSwing 2.8s ease-in-out 2s infinite",
          }}
        >
          <circle
            cx="518"
            cy="82"
            r="11"
            fill="#fff"
            stroke="#636060"
            strokeWidth="1"
          />
          <rect
            x="527.8"
            y="90.2"
            width="3.8"
            height="15"
            rx="1.6"
            fill="#fff"
            stroke="#636060"
            strokeWidth=".25"
            transform="rotate(-45 529.7 97.7)"
          />
        </g>
      </svg>

      <style jsx>{`
        .md2i-logo-wrap {
          position: relative;
          display: inline-block;
          isolation: isolate;
        }

        .md2i-logo-wrap::before {
          content: "";
          position: absolute;
          inset: 8% 18%;
          background: radial-gradient(
            circle,
            rgba(229, 143, 40, 0.22) 0%,
            rgba(229, 143, 40, 0.08) 42%,
            transparent 72%
          );
          filter: blur(24px);
          z-index: -1;
          animation: md2iGlow 3.6s ease-in-out infinite;
        }

        .md2i-logo-svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible;
        }

        @keyframes md2iOrangeIn {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.88) rotate(-4deg);
          }
          70% {
            opacity: 1;
            transform: translateY(-3px) scale(1.03) rotate(0deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes md2iGrayIn {
          from {
            opacity: 0;
            transform: translateX(-18px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes md2iLeftIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes md2iStemIn {
          from {
            opacity: 0;
            transform: translateY(16px) scaleY(0.75);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }

        @keyframes md2iDotIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.6);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes md2iLoupeIn {
          from {
            opacity: 0;
            transform: scale(0.72) rotate(-12deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes md2iGlow {
          0%, 100% {
            opacity: 0.45;
            transform: scale(0.94);
          }
          50% {
            opacity: 0.75;
            transform: scale(1);
          }
        }

        @keyframes md2iFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.01);
          }
        }

        @keyframes md2iStemPulse {
          0%, 100% {
            transform: translateY(0) scaleY(1);
          }
          50% {
            transform: translateY(0) scaleY(1.03);
          }
        }

        @keyframes md2iDotBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-2px) scale(1.06);
          }
        }

        @keyframes md2iLoupeSwing {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.05) rotate(4deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .md2i-logo-wrap::before,
          .md2i-logo-svg * {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}