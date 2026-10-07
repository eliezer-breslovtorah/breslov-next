import { CommunityForm } from "@/components/community-form";
import { communityForm } from "@/lib/community-forms";
export const metadata = { title: "Matchmaking follow-up | Breslov Torah" };
export default function Page() {
  return (
    <div className="container section">
      <h1>Matchmaking follow-up questionnaire</h1>
      <p>
        Tell the matchmaking team more about yourself and what you are looking
        for. Name and email are required so staff can identify and contact you;
        other details are optional.
      </p>
      <CommunityForm definition={communityForm("matchmaking-follow-up")!} />
    </div>
  );
}
