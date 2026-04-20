import { VaultDashboard } from "@/components/VaultDashboard";

export default async function Page({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
  return <VaultDashboard marketId={market} />;
}
