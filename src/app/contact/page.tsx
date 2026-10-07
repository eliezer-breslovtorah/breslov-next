import { ServiceForm } from "@/components/service-form";
export const metadata = { title: "Contact Rabbi Nasan Maimon" };
export default function Page() {
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">STAY CONNECTED</p>
        <h1>Contact Rabbi Nasan Maimon</h1>
        <p>Send your question or message to Breslov Torah.</p>
      </header>
      <ServiceForm
        url="https://www.breslovtorah.com/contact/"
        title="contact form"
      />
    </div>
  );
}
