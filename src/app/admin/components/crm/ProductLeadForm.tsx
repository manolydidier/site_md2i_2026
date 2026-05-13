"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./productLeadform.module.css";

type SubmitStatus = "idle" | "loading" | "success" | "error";

type RequestType =
  | "DEMO"
  | "QUOTE"
  | "CONTACT"
  | "CALLBACK"
  | "INFO"
  | "SUPPORT"
  | "TRAINING"
  | "MAINTENANCE"
  | "TENDER"
  | "OTHER";

type ProductOption = {
  id?: string;
  slug: string;
  name: string;
};

type ProductLeadFormProps = {
  productId?: string;
  productSlug?: string;
  productName?: string;
  productOptions?: ProductOption[];
  title?: string;
  description?: string;
  defaultRequestType?: RequestType;
  showProductSelect?: boolean;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyName: string;
  country: string;
  city: string;
  requestType: RequestType;
  selectedProductSlug: string;
  message: string;
  consentEmail: boolean;

  // Sécurité anti-spam
  website: string;
  submittedAt: number;
};

type FormErrors = Partial<Record<keyof FormState | "global", string>>;

function getTrackingParams() {
  if (typeof window === "undefined") {
    return {
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmContent: "",
      utmTerm: "",
      landingPage: "",
      referrer: "",
    };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
    utmTerm: params.get("utm_term") || "",
    landingPage: window.location.pathname,
    referrer: document.referrer || "",
  };
}

function resolveSourceFromUtm(utmSource: string) {
  const source = utmSource.trim().toUpperCase();

  if (source === "FACEBOOK" || source === "META") return "FACEBOOK";
  if (source === "LINKEDIN") return "LINKEDIN";
  if (source === "GOOGLE") return "GOOGLE";
  if (source === "EMAIL" || source === "NEWSLETTER") return "EMAIL_CAMPAIGN";
  if (source === "DIRECT") return "DIRECT";
  if (source === "REFERRAL") return "REFERRAL";

  return "WEBSITE";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function createInitialForm(
  defaultRequestType: RequestType,
  selectedProductSlug: string
): FormState {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    companyName: "",
    country: "",
    city: "",
    requestType: defaultRequestType,
    selectedProductSlug,
    message: "",
    consentEmail: true,
    website: "",
    submittedAt: Date.now(),
  };
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.email.trim()) {
    errors.email = "L’email est obligatoire.";
  } else if (!isValidEmail(form.email)) {
    errors.email = "Veuillez saisir un email valide.";
  }

  if (form.phone.trim() && form.phone.trim().length < 6) {
    errors.phone = "Le numéro de téléphone semble trop court.";
  }

  if (!form.companyName.trim()) {
    errors.companyName = "Veuillez indiquer votre entreprise ou organisme.";
  }

  if (!form.message.trim()) {
    errors.message = "Veuillez décrire brièvement votre besoin.";
  } else if (form.message.trim().length < 12) {
    errors.message = "Ajoutez quelques détails supplémentaires.";
  }

  if (!form.consentEmail) {
    errors.consentEmail = "Vous devez accepter d’être recontacté.";
  }

  // Honeypot anti-bot : un vrai utilisateur ne remplit pas ce champ caché.
  if (form.website.trim()) {
    errors.global = "Votre demande n’a pas pu être validée.";
  }

  // Anti-bot simple : bloque les envois trop rapides.
  if (Date.now() - form.submittedAt < 1800) {
    errors.global = "Veuillez patienter quelques secondes avant l’envoi.";
  }

  return errors;
}

export default function ProductLeadForm({
  productId,
  productSlug,
  productName,
  productOptions = [],
  title = "Demander une information",
  description = "Remplissez ce formulaire pour être contacté par l’équipe MD2I.",
  defaultRequestType = "CONTACT",
  showProductSelect = true,
}: ProductLeadFormProps) {
  const tracking = useMemo(() => getTrackingParams(), []);

  const [availableProducts, setAvailableProducts] =
    useState<ProductOption[]>(productOptions);

  const initialSelectedProductSlug =
    productSlug || productOptions[0]?.slug || "";

  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormState>(() =>
    createInitialForm(defaultRequestType, initialSelectedProductSlug)
  );

  useEffect(() => {
    if (productSlug || productOptions.length > 0) return;

    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/crm/products", {
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok || !data?.success) return;

        const products = Array.isArray(data.products)
          ? data.products.map(
              (item: { id: string; slug: string; name: string }) => ({
                id: item.id,
                slug: item.slug,
                name: item.name,
              })
            )
          : [];

        if (!cancelled) {
          setAvailableProducts(products);

          if (!form.selectedProductSlug && products[0]?.slug) {
            setForm((prev) => ({
              ...prev,
              selectedProductSlug: products[0].slug,
            }));
          }
        }
      } catch (error) {
        console.error("[PRODUCT_LEAD_FORM_LOAD_PRODUCTS]", error);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [productSlug, productOptions.length, form.selectedProductSlug]);

  const selectedProduct = availableProducts.find(
    (item) => item.slug === form.selectedProductSlug
  );

  const finalProductSlug = productSlug || form.selectedProductSlug;
  const finalProductName = productName || selectedProduct?.name || "";
  const shouldShowProductSelect =
    showProductSelect && !productSlug && availableProducts.length > 0;

  const updateField = <K extends keyof FormState>(
    name: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
      global: undefined,
    }));

    if (status !== "idle") {
      setStatus("idle");
      setNotice("");
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      setNotice("Veuillez corriger les champs indiqués.");
      return;
    }

    setStatus("loading");
    setNotice("");
    setErrors({});

    try {
      const response = await fetch("/api/crm/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          jobTitle: form.jobTitle,
          companyName: form.companyName,
          country: form.country,
          city: form.city,
          requestType: form.requestType,
          message: form.message,
          consentEmail: form.consentEmail,

          // Sécurité serveur
          website: form.website,
          submittedAt: form.submittedAt,

          productId,
          productSlug: finalProductSlug,
          productNameFallback: finalProductName,

          source: resolveSourceFromUtm(tracking.utmSource),
          ...tracking,
        }),
      });

      let data: { success?: boolean; error?: string; message?: string } | null =
        null;

      try {
        data = await response.json();
      } catch {
        throw new Error("Réponse serveur invalide.");
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Erreur pendant l’envoi.");
      }

      setStatus("success");
      setNotice(
        "Votre demande a bien été envoyée. L’équipe MD2I vous contactera prochainement."
      );

      setForm(createInitialForm(defaultRequestType, initialSelectedProductSlug));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer votre demande.";

      setStatus("error");
      setNotice(message);
      setErrors({
        global: message,
      });
    }
  };

  return (
    <form onSubmit={submit} className={styles.form} noValidate>
      <div className={styles.header}>
        <span className={styles.badge}>MD2I</span>

        <h2 className={styles.title}>{title}</h2>

        <p className={styles.text}>{description}</p>

        {finalProductName && (
          <p className={styles.productLabel}>
            Produit concerné : {finalProductName}
          </p>
        )}
      </div>

      <input
        className={styles.honeypot}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(event) => updateField("website", event.target.value)}
        aria-hidden="true"
      />

      {errors.global && (
        <p className={styles.noticeError} role="alert">
          {errors.global}
        </p>
      )}

      {shouldShowProductSelect && (
        <label className={styles.field}>
          <span className={styles.label}>Produit ou service concerné</span>

          <select
            className={styles.input}
            value={form.selectedProductSlug}
            onChange={(event) =>
              updateField("selectedProductSlug", event.target.value)
            }
            required
          >
            {availableProducts.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>Prénom</span>

          <input
            className={styles.input}
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            placeholder="Votre prénom"
            autoComplete="given-name"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Nom</span>

          <input
            className={styles.input}
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            placeholder="Votre nom"
            autoComplete="family-name"
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Email *</span>

        <input
          className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
          type="email"
          required
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="vous@entreprise.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
        />

        {errors.email && <span className={styles.error}>{errors.email}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Téléphone</span>

        <input
          className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="+261 ..."
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
        />

        {errors.phone && <span className={styles.error}>{errors.phone}</span>}
      </label>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>Fonction</span>

          <input
            className={styles.input}
            value={form.jobTitle}
            onChange={(event) => updateField("jobTitle", event.target.value)}
            placeholder="Responsable RH, DAF..."
            autoComplete="organization-title"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Entreprise *</span>

          <input
            className={`${styles.input} ${
              errors.companyName ? styles.inputError : ""
            }`}
            value={form.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            placeholder="Nom de l’entreprise"
            autoComplete="organization"
            aria-invalid={Boolean(errors.companyName)}
          />

          {errors.companyName && (
            <span className={styles.error}>{errors.companyName}</span>
          )}
        </label>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>Pays</span>

          <input
            className={styles.input}
            value={form.country}
            onChange={(event) => updateField("country", event.target.value)}
            placeholder="Madagascar, France..."
            autoComplete="country-name"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Ville</span>

          <input
            className={styles.input}
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
            placeholder="Votre ville"
            autoComplete="address-level2"
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Type de demande</span>

        <select
          className={styles.input}
          value={form.requestType}
          onChange={(event) =>
            updateField("requestType", event.target.value as RequestType)
          }
        >
          <option value="DEMO">Demander une démonstration</option>
          <option value="QUOTE">Demander un devis</option>
          <option value="CALLBACK">Être rappelé</option>
          <option value="INFO">Recevoir plus d’informations</option>
          <option value="TRAINING">Formation</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="SUPPORT">Assistance / support</option>
          <option value="TENDER">Appel d’offre</option>
          <option value="OTHER">Autre demande</option>
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Message *</span>

        <textarea
          className={`${styles.input} ${styles.textarea} ${
            errors.message ? styles.inputError : ""
          }`}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="Décrivez votre besoin, le nombre d’utilisateurs, le délai souhaité..."
          aria-invalid={Boolean(errors.message)}
        />

        {errors.message && (
          <span className={styles.error}>{errors.message}</span>
        )}
      </label>

      <label
        className={`${styles.checkbox} ${
          errors.consentEmail ? styles.checkboxError : ""
        }`}
      >
        <input
          type="checkbox"
          checked={form.consentEmail}
          onChange={(event) =>
            updateField("consentEmail", event.target.checked)
          }
        />

        <span>
          J’accepte d’être contacté par MD2I au sujet de ma demande.
        </span>
      </label>

      {errors.consentEmail && (
        <span className={styles.error}>{errors.consentEmail}</span>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className={styles.button}
      >
        {status === "loading" ? (
          <>
            <span className={styles.spinner} />
            Envoi en cours...
          </>
        ) : (
          <>
            Envoyer ma demande
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>

      {notice && !errors.global && (
        <p
          className={
            status === "success" ? styles.noticeSuccess : styles.noticeError
          }
          role={status === "success" ? "status" : "alert"}
        >
          {notice}
        </p>
      )}

      <p className={styles.securityNote}>
        Formulaire sécurisé : validation des champs, anti-spam et contrôle côté
        serveur.
      </p>
    </form>
  );
}