import { ContactForm } from "@/components/contact-form";
export const metadata = { title: "Contact Rabbi Nasan Maimon" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">STAY CONNECTED</p>
        <h1>Contact Rabbi Nasan Maimon</h1>
        <p>
          Ask about a teaching, share a question about daily life, or ask where
          to begin. Your message goes to the Breslov Torah team for Rav Nasan.
        </p>
      </header>
      <p className="contact-invitation">
        Everyone is welcome to ask. You do not need an account or membership.
      </p>
      <ContactForm
        initialSubject={subject?.slice(0, 200) || "Question for Rav Nasan"}
      />
    </div>
  );
}
