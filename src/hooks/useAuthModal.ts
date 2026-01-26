import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for managing authentication modal state and outside click detection
 * @returns Modal state and control functions
 */
export function useAuthModal() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const showModal = () => setIsVisible(true);
  const hideModal = () => setIsVisible(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        hideModal();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible]);

  return {
    isVisible,
    showModal,
    hideModal,
    modalRef,
  };
}
