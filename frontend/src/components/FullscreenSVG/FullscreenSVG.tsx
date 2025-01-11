import React, { useState } from "react";

interface FullscreenSVGProps {
  src: string;
  title: string;
}

const FullscreenSVG: React.FC<FullscreenSVGProps> = ({ src, title }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    document.body.style.overflow = isFullscreen ? "auto" : "hidden"; // Zablokuj lub odblokuj przewijanie strony
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (zoomed) {
      const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setOffsetX(x);
      setOffsetY(y);
    }
  };

  const handleZoom = () => {
    setZoomed((prev) => !prev);
  };

  return (
    <div
      className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-black" : ""}`}
    >
      {/* Miniatura SVG */}
      {!isFullscreen && (
        <div onClick={toggleFullscreen} className="cursor-pointer">
          <object
            data={src}
            type="image/svg+xml"
            width="100%"
            height="400"
            aria-label={title}
          />
        </div>
      )}

      {/* Widok pełnoekranowy */}
      {isFullscreen && (
        <div
          className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
        >
          <svg
            onMouseMove={handleMouseMove}
            onClick={handleZoom}
            xmlns="http://www.w3.org/2000/svg"
            className="max-w-full max-h-full"
            style={{
              transform: zoomed
                ? `scale(2) translate(-${offsetX}%, -${offsetY}%)`
                : "scale(1)",
              transformOrigin: zoomed ? `${offsetX}% ${offsetY}%` : "center",
              transition: "transform 0.3s ease",
              cursor: zoomed ? "zoom-out" : "zoom-in",
            }}
          >
            <use href={`${src}#root`} />
          </svg>
          <button
            className="absolute top-4 right-4 text-white bg-gray-800 p-2 rounded"
            onClick={toggleFullscreen}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default FullscreenSVG;
