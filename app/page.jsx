import { parseAllExcelFiles } from "@/lib/parseExcel";
import Dashboard from "./components/Dashboard";

export default function Page() {
  const data = parseAllExcelFiles();
  return <Dashboard data={data} />;
}
