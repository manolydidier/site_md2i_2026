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

type FacebookFeedResponse = {
  id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    fbtrace_id?: string;
  };
};

type PublisherReadiness = {
  channel: "LINKEDIN" | "FACEBOOK";
  label: string;
  ready: boolean;
  message: string;
  missingEnv: string[];

  // Alias conserves pour compatibilite si une autre page utilise ces noms.
  missing: string[];
  mode?: string;
};

function getRequiredEnv(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }

  return value;
}

function getOptionalEnv(key: string, fallback: string) {
  return process.env[key] || fallback;
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

function buildLinkedInPostUrl(postUrn: string | null) {
  if (!postUrn) return undefined;

  return `https://www.linkedin.com/feed/update/${postUrn}/`;
}

function buildFacebookPostUrl(postId: string | null) {
  if (!postId) return undefined;

  return `https://www.facebook.com/${postId}`;
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function getLinkedInAuthorUrn() {
  const authorType = getOptionalEnv("LINKEDIN_AUTHOR_TYPE", "PERSON");

  if (authorType === "ORGANIZATION") {
    const organizationId = getRequiredEnv("LINKEDIN_ORGANIZATION_ID");

    return `urn:li:organization:${organizationId}`;
  }

  const personId = getRequiredEnv("LINKEDIN_PERSON_ID");

  return `urn:li:person:${personId}`;
}

export function getCrmPublicationPublisherReadiness(): PublisherReadiness[] {
  const linkedInAuthorType = process.env.LINKEDIN_AUTHOR_TYPE || "PERSON";

  const linkedInMissingEnv: string[] = [];

  if (!process.env.LINKEDIN_ACCESS_TOKEN) {
    linkedInMissingEnv.push("LINKEDIN_ACCESS_TOKEN");
  }

  if (!process.env.LINKEDIN_API_VERSION) {
    linkedInMissingEnv.push("LINKEDIN_API_VERSION");
  }

  if (linkedInAuthorType === "ORGANIZATION") {
    if (!process.env.LINKEDIN_ORGANIZATION_ID) {
      linkedInMissingEnv.push("LINKEDIN_ORGANIZATION_ID");
    }
  } else {
    if (!process.env.LINKEDIN_PERSON_ID) {
      linkedInMissingEnv.push("LINKEDIN_PERSON_ID");
    }
  }

  const facebookMissingEnv: string[] = [];

  if (!process.env.FACEBOOK_PAGE_ID) {
    facebookMissingEnv.push("FACEBOOK_PAGE_ID");
  }

  if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    facebookMissingEnv.push("FACEBOOK_PAGE_ACCESS_TOKEN");
  }

  if (!process.env.FACEBOOK_GRAPH_VERSION) {
    facebookMissingEnv.push("FACEBOOK_GRAPH_VERSION");
  }

  const linkedInReady = linkedInMissingEnv.length === 0;
  const facebookReady = facebookMissingEnv.length === 0;

  return [
    {
      channel: "LINKEDIN",
      label: "LinkedIn",
      ready: linkedInReady,
      message: linkedInReady
        ? `LinkedIn est pret pour publier en mode ${linkedInAuthorType.toLowerCase()}.`
        : "LinkedIn n'est pas encore pret. Variables manquantes.",
      missingEnv: linkedInMissingEnv,
      missing: linkedInMissingEnv,
      mode: linkedInAuthorType,
    },
    {
      channel: "FACEBOOK",
      label: "Facebook",
      ready: facebookReady,
      message: facebookReady
        ? "Facebook est pret pour publier sur la page configuree."
        : "Facebook n'est pas encore pret. Variables manquantes.",
      missingEnv: facebookMissingEnv,
      missing: facebookMissingEnv,
    },
  ];
}

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

async function publishToLinkedIn(input: PublishInput): Promise<PublishResult> {
  const accessToken = getRequiredEnv("LINKEDIN_ACCESS_TOKEN");
  const linkedInVersion = getOptionalEnv("LINKEDIN_API_VERSION", "202605");
  const author = getLinkedInAuthorUrn();

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Linkedin-Version": linkedInVersion,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      commentary: buildPostText(input),
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      `Erreur LinkedIn ${response.status}: ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`
    );
  }

  const externalId = response.headers.get("x-restli-id") || undefined;

  return {
    externalId,
    externalUrl: buildLinkedInPostUrl(externalId || null),
  };
}

async function publishToFacebook(input: PublishInput): Promise<PublishResult> {
  const pageId = getRequiredEnv("FACEBOOK_PAGE_ID");
  const pageAccessToken = getRequiredEnv("FACEBOOK_PAGE_ACCESS_TOKEN");
  const graphVersion = getOptionalEnv("FACEBOOK_GRAPH_VERSION", "v24.0");

  const params = new URLSearchParams();

  params.set("message", buildPostText(input));
  params.set("link", input.trackedUrl);
  params.set("access_token", pageAccessToken);

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${pageId}/feed`,
    {
      method: "POST",
      body: params,
    }
  );

  const data = (await readResponseBody(response)) as FacebookFeedResponse;

  if (!response.ok) {
    throw new Error(
      `Erreur Facebook ${response.status}: ${JSON.stringify(data)}`
    );
  }

  const externalId = typeof data.id === "string" ? data.id : undefined;

  return {
    externalId,
    externalUrl: buildFacebookPostUrl(externalId || null),
  };
}

async function publishToIndeed(_input: PublishInput): Promise<PublishResult> {
  throw new Error(
    "Integration Indeed non disponible: Indeed doit etre traite comme une offre structuree, pas comme un simple post texte."
  );
}

async function publishToEmailCampaign(
  _input: PublishInput
): Promise<PublishResult> {
  throw new Error(
    "Integration email non disponible: rattachez ce canal a votre module email ou a un provider comme Resend, SendGrid, Mailgun ou Brevo."
  );
}

async function publishToWebsite(_input: PublishInput): Promise<PublishResult> {
  throw new Error(
    "Integration site web non disponible: creez d'abord un modele Article/Actualite puis branchez ce publisher dessus."
  );
}