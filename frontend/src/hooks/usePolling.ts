import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function usePolling(milliseconds: number) {
  const router = useRouter();

  useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh();
    }, milliseconds);
    //cleanup
    return () => clearInterval(intervalId);
  });
}
