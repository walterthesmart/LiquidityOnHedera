import { Spinner } from "@/components/ui/spinner";
export default function LoadingScreen() {
  return (
    <div className="h-3/4 flex  justify-center">
      {/* Change this to  skeletons*/}
      <div className="flex  text-2xl  items-center gap-2">
        <Spinner size="large" />
        Loading Admin Panel
      </div>
    </div>
  );
}
