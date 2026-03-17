import { ArtDetail } from "@/features/art/components/detail/art-detail";

interface ArtDetailViewProps {
  artId: string;
}

export const ArtDetailView = ({ artId }: ArtDetailViewProps) => {
  return <ArtDetail artId={artId} />;
};
