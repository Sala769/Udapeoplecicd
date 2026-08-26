import { Tower } from "../types";

/**
 * The Control Tower metaphor: five towers an engineer can see from anywhere
 * in the app, each owning one slice of "how we build and run UdaPeople."
 */
export const towers: Tower[] = [
  {
    id: "launch",
    name: "Launch Tower",
    emoji: "🛫",
    tagline: "CI/CD pipeline standards",
    description:
      "Everything about turning a commit into a build, a test result, and a deployable artifact — before infrastructure ever gets touched."
  },
  {
    id: "foundation",
    name: "Foundation Tower",
    emoji: "🏗️",
    tagline: "Infrastructure-as-code standards",
    description:
      "How CloudFormation, Ansible and tagging keep every environment reproducible, disposable and explainable from source alone."
  },
  {
    id: "radar",
    name: "Radar Tower",
    emoji: "🛰️",
    tagline: "Observability & reliability standards",
    description:
      "What 'healthy' means for UdaPeople, and how Dynatrace watches for it continuously instead of once at deploy time."
  },
  {
    id: "vault",
    name: "Vault Tower",
    emoji: "🔐",
    tagline: "Security & compliance standards",
    description:
      "Secrets, access and transport — the standards that turn known shortcuts into tracked, expiring exceptions instead of silent debt."
  },
  {
    id: "recovery",
    name: "Recovery Tower",
    emoji: "🪂",
    tagline: "Release, rollback & data standards",
    description:
      "How UdaPeople gets back to a good state fast: blue-green cutovers, reversible migrations, and rollback paths that are tested, not hoped for."
  }
];

export const towerById = (id: string): Tower | undefined =>
  towers.find((t) => t.id === id);
