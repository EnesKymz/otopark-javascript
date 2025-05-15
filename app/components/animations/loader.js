import { BarLoader } from "react-spinners";

export default function Loader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <BarLoader/>
    </div>
  );
}