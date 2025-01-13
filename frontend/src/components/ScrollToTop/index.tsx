import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    console.log("ScrollToTop component mounted");

    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
        console.log("ScrollToTop button is visible");
      } else {
        setIsVisible(false);
        console.log("ScrollToTop button is not visible");
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      console.log("ScrollToTop component unmounted");
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-[99]">
      {isVisible && (
        <div
          onClick={scrollToTop}
          aria-label="scroll to top"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md bg-primary text-white shadow-md transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp"
        >
          <span className="mt-[6px] h-3 w-3 rotate-45 border-l border-t border-white"></span>
        </div>
      )}
    </div>
  );
}