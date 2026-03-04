import { AlertsClient } from "./AlertsClient";

export const metadata = {
  title: "Get Recall Alerts - RecallPlate",
  description:
    "Sign up for email alerts when new FDA or USDA food recalls are reported in your state. Stay informed about food safety.",
};

export default function AlertsPage() {
  return <AlertsClient />;
}
