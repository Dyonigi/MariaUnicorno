import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/unisalto/Game";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Game />;
}
