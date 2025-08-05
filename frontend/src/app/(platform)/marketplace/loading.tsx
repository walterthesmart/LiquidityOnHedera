import { Spinner } from "@/components/ui/spinner";
export default function LoadingScreen() {
  return (
    <div className="h-3/4 flex  justify-center">
      {/* Change this to a table*/}
      <div className="flex  text-2xl  items-center gap-2">
        <Spinner size="large" />
        Loading Marketplace
      </div>
    </div>
  );
}
