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
        <p>Send your question or message to Breslov Torah.</p>
      </header>
      <ContactForm initialSubject={subject?.slice(0, 200) || ""} />
    </div>
  );
}
