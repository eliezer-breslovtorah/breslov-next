import forms from "../../content/donation-forms.json";
export const donationForms = forms;
export function findDonationForm(slug: string) {
  return donationForms.find((f) => f.slug === slug);
}
