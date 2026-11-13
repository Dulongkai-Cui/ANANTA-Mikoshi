import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/routes";

/** 已撤下的独立占位板块；旧书签返回工作台，不读写业务数据。 */
export default function Page() {
  redirect(HOME_PATH);
}
