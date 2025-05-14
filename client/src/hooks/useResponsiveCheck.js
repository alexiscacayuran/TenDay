import { useTheme } from "@mui/joy/styles";
import { useEffect, useState } from "react";

/**
 * useResponsiveCheck
 * Hook to check if the current viewport matches a specific breakpoint (down).
 *
 * @param {'mobile' | 'tablet' | 'laptop' | 'desktop'} breakpointKey - Joy UI breakpoint key.
 * @returns {boolean} True if the screen width is less than or equal to the specified breakpoint.
 */
const useResponsiveCheck = (breakpointKey = "laptop") => {
  const theme = useTheme();
  const breakpointPx = theme.breakpoints.values[breakpointKey];
  const mediaQuery = `(max-width: ${breakpointPx}px)`;

  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(mediaQuery).matches
      : false
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(mediaQuery);
    const listener = (event) => setMatches(event.matches);

    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [mediaQuery]);

  return matches;
};

export default useResponsiveCheck;
