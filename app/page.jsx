import { parseExcelData } from "@/lib/parseExcel";
import Dashboard from "./components/Dashboard";

export default function Page() {
  const data = parseExcelData();
  return <Dashboard data={data} />;
}
