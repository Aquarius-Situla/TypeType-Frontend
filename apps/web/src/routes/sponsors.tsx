import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdAgency } from "../components/ad-agency";
import { readAdVault } from "../lib/ad-vault";

export const Route = createFileRoute("/sponsors")({
  // The page does not exist for viewers who never turned ad mode on.
  beforeLoad: () => {
    const vault = readAdVault();
    if (!vault.wanted && vault.seen.length === 0) throw redirect({ to: "/" });
  },
  component: AdAgency,
});
