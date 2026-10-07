import Link from "next/link";
import { CommunityForm } from "@/components/community-form";
import { communityForm } from "@/lib/community-forms";
export const metadata = { title: "Matchmaking | Breslov Torah" };
export default function Page() {
  return (
    <div className="container section">
      <h1>Breslov matchmaking</h1>
      <p>
        Introduce yourself to the matchmaking team. Submissions are reviewed
        privately by staff.
      </p>
      <CommunityForm definition={communityForm("matchmaking")!} />
      <p>
        Already introduced yourself?{" "}
        <Link href="/community/matchmaking/follow-up">
          Complete the follow-up questionnaire
        </Link>
        .
      </p>
    </div>
  );
}
