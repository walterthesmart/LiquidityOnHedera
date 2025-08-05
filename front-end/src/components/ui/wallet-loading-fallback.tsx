import { Spinner } from "@/components/ui/spinner";
export default function LoadingFallback() {
  return (
    <div className=" min-h-screen  flex  justify-center">
      <Spinner size="large" />
    </div>
  );
}
