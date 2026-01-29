import { UserProfileView } from "@/views/user-profile-view";

interface UserProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { handle } = await params;

  return <UserProfileView handle={handle} />;
}
