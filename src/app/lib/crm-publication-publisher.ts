// src/app/lib/crm-publication-publisher.ts

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
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

type LinkedInInitializeImageUploadResponse = {
  value?: {
    uploadUrl?: string;
    image?: string;
  };
  message?: string;
  status?: number;
  serviceErrorCode?: number;
};

type PublisherReadiness = {
  channel: "LINKEDIN" | "FACEBOOK";
  label: string;
  ready: boolean;
  message: string;
  missingEnv: string[];
  missing: string[];
  mode?: string;
};

type ImagePayload = {
  bytes: Buffer;
  contentType: string;
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

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function toAbsoluteUrl(value: string) {
  if (!value) return value;

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${getSiteUrl()}${value}`;
  }

  return value;
}

function isPublicFacebookUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (url.protocol !== "https:") return false;

    if (hostname === "localhost") return false;
    if (hostname === "127.0.0.1") return false;
    if (hostname === "0.0.0.0") return false;

    if (hostname.startsWith("192.168.")) return false;
    if (hostname.startsWith("10.")) return false;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractFirstImageSrc(html: string) {
  const match = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);

  if (!match?.[1]) return null;

  return decodeHtmlEntities(match[1].trim());
}

function stripHtmlTags(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<img[^>]*>/gi, "")
      .replace(
        /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
        (_match, href, text) => {
          const cleanText = String(text).replace(/<[^>]*>/g, "").trim();
          const cleanHref = toAbsoluteUrl(String(href).trim());

          if (!cleanText) return cleanHref;

          return `${cleanText}: ${cleanHref}`;
        }
      )
      .replace(/<\/(p|div|h1|h2|h3|h4|li|figure|blockquote)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<hr\s*\/?>/gi, "\n---\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

function buildPostText(
  input: PublishInput,
  options?: {
    includeTrackedUrl?: boolean;
  }
) {
  const includeTrackedUrl = options?.includeTrackedUrl ?? true;

  const lines = [stripHtmlTags(input.content)];

  if (includeTrackedUrl) {
    if (input.ctaLabel) {
      lines.push(`${input.ctaLabel}: ${input.trackedUrl}`);
    } else {
      lines.push(input.trackedUrl);
    }
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

function readBase64Image(src: string): ImagePayload | null {
  const match = src.match(
    /^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,(.+)$/i
  );

  if (!match?.[1] || !match?.[2]) return null;

  const normalizedType =
    match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1];

  return {
    bytes: Buffer.from(match[2], "base64"),
    contentType: normalizedType,
  };
}

async function readImageFromSource(src: string): Promise<ImagePayload> {
  const base64Image = readBase64Image(src);

  if (base64Image) {
    return base64Image;
  }

  const imageUrl = toAbsoluteUrl(src);

  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    throw new Error(`Image LinkedIn invalide: ${src}`);
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Impossible de lire l'image avant publication LinkedIn: ${response.status}`
    );
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";

  if (!contentType.startsWith("image/")) {
    throw new Error(`Le fichier n'est pas une image: ${contentType}`);
  }

  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType,
  };
}

async function uploadLinkedInImage({
  accessToken,
  linkedInVersion,
  author,
  imageSrc,
}: {
  accessToken: string;
  linkedInVersion: string;
  author: string;
  imageSrc: string;
}) {
  const imagePayload = await readImageFromSource(imageSrc);

  const initializeResponse = await fetch(
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": linkedInVersion,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: author,
        },
      }),
    }
  );

  const initializeBody =
    (await readResponseBody(
      initializeResponse
    )) as LinkedInInitializeImageUploadResponse;

  if (
    !initializeResponse.ok ||
    !initializeBody.value?.uploadUrl ||
    !initializeBody.value?.image
  ) {
    throw new Error(
      `Erreur LinkedIn image initialize ${initializeResponse.status}: ${JSON.stringify(
        initializeBody
      )}`
    );
  }

  const uploadResponse = await fetch(initializeBody.value.uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": imagePayload.contentType,
    },
    body: imagePayload.bytes,
  });

  if (!uploadResponse.ok) {
    const uploadBody = await readResponseBody(uploadResponse);

    throw new Error(
      `Erreur LinkedIn image upload ${uploadResponse.status}: ${
        typeof uploadBody === "string" ? uploadBody : JSON.stringify(uploadBody)
      }`
    );
  }

  return initializeBody.value.image;
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
        ? `LinkedIn est prêt pour publier en mode ${linkedInAuthorType.toLowerCase()}.`
        : "LinkedIn n'est pas encore prêt. Variables manquantes.",
      missingEnv: linkedInMissingEnv,
      missing: linkedInMissingEnv,
      mode: linkedInAuthorType,
    },
    {
      channel: "FACEBOOK",
      label: "Facebook",
      ready: facebookReady,
      message: facebookReady
        ? "Facebook est prêt pour publier sur la page configurée."
        : "Facebook n'est pas encore prêt. Variables manquantes.",
      missingEnv: facebookMissingEnv,
      missing: facebookMissingEnv,
      mode: "PAGE",
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
      throw new Error(`Canal non automatisé: ${input.channel}`);
  }
}

async function publishToLinkedIn(input: PublishInput): Promise<PublishResult> {
  const accessToken = getRequiredEnv("LINKEDIN_ACCESS_TOKEN");
  const linkedInVersion = getOptionalEnv("LINKEDIN_API_VERSION", "202605");
  const author = getLinkedInAuthorUrn();
  const commentary = buildPostText(input);
  const imageSrc = extractFirstImageSrc(input.content);

  if (!commentary.trim()) {
    throw new Error(
      "Le contenu LinkedIn est vide après conversion du rich text."
    );
  }

  let linkedInImageUrn: string | null = null;

  if (imageSrc) {
    linkedInImageUrn = await uploadLinkedInImage({
      accessToken,
      linkedInVersion,
      author,
      imageSrc,
    });
  }

  const postPayload: Record<string, unknown> = {
    author,
    commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (linkedInImageUrn) {
    postPayload.content = {
      media: {
        id: linkedInImageUrn,
        altText: input.title,
      },
    };
  }

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": linkedInVersion,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(postPayload),
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
  const graphVersion = getOptionalEnv("FACEBOOK_GRAPH_VERSION", "v25.0");

  const canUseTrackedLink = isPublicFacebookUrl(input.trackedUrl);

  const message = buildPostText(input, {
    includeTrackedUrl: canUseTrackedLink,
  });

  if (!message.trim()) {
    throw new Error(
      "Le contenu Facebook est vide après conversion du rich text."
    );
  }

  const params = new URLSearchParams();

  params.set("message", message);
  params.set("access_token", pageAccessToken);

  /*
    Facebook refuse les URLs locales comme :
    - http://localhost:3000/...
    - http://127.0.0.1/...
    - http://192.168.x.x/...

    Donc en local, on publie uniquement le texte.
    Quand votre site sera en ligne avec une vraie URL HTTPS,
    le champ link sera automatiquement envoyé.
  */
  if (canUseTrackedLink) {
    params.set("link", input.trackedUrl);
  }

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
    "Intégration Indeed non disponible: Indeed doit être traité comme une offre structurée, pas comme un simple post texte."
  );
}

async function publishToEmailCampaign(
  _input: PublishInput
): Promise<PublishResult> {
  throw new Error(
    "Intégration email non disponible: rattachez ce canal à votre module email ou à un provider comme Resend, SendGrid, Mailgun ou Brevo."
  );
}

async function publishToWebsite(_input: PublishInput): Promise<PublishResult> {
  throw new Error(
    "Intégration site web non disponible: créez d'abord un modèle Article/Actualité puis branchez ce publisher dessus."
  );
}