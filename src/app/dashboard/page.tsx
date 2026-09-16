import { redirect } from "next/navigation";
import { getDashboardUrl } from "@/lib/dashboard-url";

export default function DashboardPage() {
	redirect(getDashboardUrl());
}
