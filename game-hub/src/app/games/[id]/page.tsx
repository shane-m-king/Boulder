import GameCardDetailed from "../../components/GameCardDetailed";

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export const GamePage = async({ params }: GamePageProps) => {
  const { id } = await params;

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-boulder-dark text-foreground">
      <GameCardDetailed gameId={id} />
    </section>
  );
}

export default GamePage;
