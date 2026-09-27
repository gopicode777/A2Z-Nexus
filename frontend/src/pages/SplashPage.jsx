import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashPage() {
  const navigate = useNavigate();
  const moved = useRef(false);

  const goToAuth = () => {
    if (moved.current) return;

    moved.current = true;
    navigate("/auth", { replace: true });
  };

  useEffect(() => {
    const fallback = window.setTimeout(() => {
      goToAuth();
    }, 10000);

    return () => {
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      <video
        src="/assets/a2z-intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        onEnded={goToAuth}
      />
    </main>
  );
}
