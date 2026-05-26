// app/lib/crm-publication-publisher.ts

type PublishInput = {
  publicationId: string;
  channel: string;
  title: string;
  content: string;
  ctaLabel: string | null;
  trackedUrl: string;
  userId: string;
};

type PublishResult = {
  externalId?: string;
  externalUrl?: string;
};

export async function publishCrmPublication(
  input: PublishInput
): Promise<PublishResult> {
  switch (input.channel) {
    case "LINKEDIN":
      return publishToLinkedIn(input);

    case "FACEBOOK":
      return publishToFacebook(input);

    case "INDEED":
      return publishToIndeed(input);

    case "EMAIL":
      return publishToEmailCampaign(input);

    case "WEBSITE":
      return publishToWebsite(input);

    default:
      throw new Error(`Canal non automatise: ${input.channel}`);
  }
}

function buildPostText(input: PublishInput) {
  const lines = [input.content.trim()];

  if (input.ctaLabel) {
    lines.push(`${input.ctaLabel}: ${input.trackedUrl}`);
  } else {
    lines.push(input.trackedUrl);
  }

  return lines.filter(Boolean).join("\n\n");
}

async function publishToLinkedIn(input: PublishInput) {
  const text = buildPostText(input);

  // 1. Charger CrmSocialConnection pour LINKEDIN
  // 2. Dechiffrer accessToken
  // 3. Appeler LinkedIn Posts API
  // 4. Retourner externalId / externalUrl

  throw new Error("Integration LinkedIn a implementer");
}

async function publishToFacebook(input: PublishInput) {
  const text = buildPostText(input);

  // 1. Charger CrmSocialConnection pour FACEBOOK
  // 2. Dechiffrer Page Access Token
  // 3. Publier sur la Page
  // 4. Retourner externalId / externalUrl

  throw new Error("Integration Facebook a implementer");
}

async function publishToIndeed(input: PublishInput) {
  // Indeed doit probablement etre traite comme une offre structuree,
  // pas comme un simple post texte.
  throw new Error("Integration Indeed a implementer");
}

async function publishToEmailCampaign(input: PublishInput) {
  // Rattacher a votre module email existant ou a un provider type Resend,
  // SendGrid, Mailgun, Brevo, etc.
  throw new Error("Integration email a implementer");
}

async function publishToWebsite(input: PublishInput) {
  // Creer un article / actualite interne sur votre site
  throw new Error("Integration site web a implementer");
}