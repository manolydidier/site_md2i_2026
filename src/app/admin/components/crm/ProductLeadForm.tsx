"use client";

import type { TFunction } from "i18next";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLocale } from "@/app/i18n/settings";
import { translateDynamicItems } from "@/app/i18n/dynamic";
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
  variant?: "default" | "premium";
  hideHeader?: boolean;
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

  website: string;
  submittedAt: number;
};

type FormErrors = Partial<Record<keyof FormState | "global", string>>;

const STEP_DEFS = [
  {
    id: "need",
    key: "need",
    label: "Besoin",
    title: "Votre besoin",
    description:
      "Choisissez le produit ou service concerné et le type de demande.",
  },
  {
    id: "contact",
    key: "contact",
    label: "Contact",
    title: "Vos coordonnées",
    description:
      "Indiquez les informations nécessaires pour vous recontacter.",
  },
  {
    id: "company",
    key: "company",
    label: "Entreprise",
    title: "Votre entreprise",
    description:
      "Aidez-nous à mieux comprendre votre contexte professionnel.",
  },
  {
    id: "message",
    key: "message",
    label: "Message",
    title: "Votre message",
    description:
      "Décrivez brièvement votre besoin pour recevoir une réponse adaptée.",
  },
] as const;

const REQUEST_TYPE_DEFS: { value: RequestType; label: string; optionLabel: string }[] = [
  { value: "DEMO", label: "Démonstration", optionLabel: "Demander une démonstration" },
  { value: "QUOTE", label: "Devis", optionLabel: "Demander un devis" },
  { value: "CONTACT", label: "Contact commercial", optionLabel: "Contact commercial" },
  { value: "CALLBACK", label: "Être rappelé", optionLabel: "Être rappelé" },
  { value: "INFO", label: "Informations", optionLabel: "Recevoir plus d’informations" },
  { value: "SUPPORT", label: "Support", optionLabel: "Assistance / support" },
  { value: "TRAINING", label: "Formation", optionLabel: "Formation" },
  { value: "MAINTENANCE", label: "Maintenance", optionLabel: "Maintenance" },
  { value: "TENDER", label: "Appel d’offre", optionLabel: "Appel d’offre" },
  { value: "OTHER", label: "Autre demande", optionLabel: "Autre demande" },
];

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

function validateStep(
  form: FormState,
  step: number,
  shouldShowProductSelect: boolean,
  t: TFunction
): FormErrors {
  const errors: FormErrors = {};

  if (step === 0) {
    if (shouldShowProductSelect && !form.selectedProductSlug.trim()) {
      errors.selectedProductSlug = String(
        t("leadForm.validation.productRequired", {
          defaultValue: "Veuillez choisir un produit ou service.",
        })
      );
    }
  }

  if (step === 1) {
    if (!form.email.trim()) {
      errors.email = String(
        t("leadForm.validation.emailRequired", {
          defaultValue: "L'email est obligatoire.",
        })
      );
    } else if (!isValidEmail(form.email)) {
      errors.email = String(
        t("leadForm.validation.emailInvalid", {
          defaultValue: "Veuillez saisir un email valide.",
        })
      );
    }

    if (form.phone.trim() && form.phone.trim().length < 6) {
      errors.phone = String(
        t("leadForm.validation.phoneShort", {
          defaultValue: "Le numéro de téléphone semble trop court.",
        })
      );
    }
  }

  if (step === 2) {
    if (!form.companyName.trim()) {
      errors.companyName = String(
        t("leadForm.validation.companyRequired", {
          defaultValue: "Veuillez indiquer votre entreprise ou organisme.",
        })
      );
    }
  }

  if (step === 3) {
    if (!form.message.trim()) {
      errors.message = String(
        t("leadForm.validation.messageRequired", {
          defaultValue: "Veuillez décrire brièvement votre besoin.",
        })
      );
    } else if (form.message.trim().length < 12) {
      errors.message = String(
        t("leadForm.validation.messageShort", {
          defaultValue: "Ajoutez quelques détails supplémentaires.",
        })
      );
    }

    if (!form.consentEmail) {
      errors.consentEmail = String(
        t("leadForm.validation.consentRequired", {
          defaultValue: "Vous devez accepter d'être recontacté.",
        })
      );
    }

    if (form.website.trim()) {
      errors.global = String(
        t("leadForm.validation.blocked", {
          defaultValue: "Votre demande n'a pas pu être validée.",
        })
      );
    }

    if (Date.now() - form.submittedAt < 1800) {
      errors.global = String(
        t("leadForm.validation.wait", {
          defaultValue: "Veuillez patienter quelques secondes avant l'envoi.",
        })
      );
    }
  }

  return errors;
}

function validateForm(
  form: FormState,
  shouldShowProductSelect: boolean,
  t: TFunction
): FormErrors {
  return {
    ...validateStep(form, 0, shouldShowProductSelect, t),
    ...validateStep(form, 1, shouldShowProductSelect, t),
    ...validateStep(form, 2, shouldShowProductSelect, t),
    ...validateStep(form, 3, shouldShowProductSelect, t),
  };
}

function getRequestTypeLabel(value: RequestType, t: TFunction) {
  const requestType = REQUEST_TYPE_DEFS.find((item) => item.value === value);

  return String(
    t(`leadForm.requestTypes.${value}.label`, {
      defaultValue: requestType?.label ?? value,
    })
  );
}

export default function ProductLeadForm({
  productId,
  productSlug,
  productName,
  productOptions = [],
  title,
  description,
  defaultRequestType = "CONTACT",
  showProductSelect = true,
  variant = "default",
  hideHeader = false,
}: ProductLeadFormProps) {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);
  const tracking = useMemo(() => getTrackingParams(), []);

  const [availableProducts, setAvailableProducts] =
    useState<ProductOption[]>(productOptions);
  const [localizedProducts, setLocalizedProducts] =
    useState<ProductOption[]>(productOptions);
  const [localizedProductName, setLocalizedProductName] = useState(
    productName ?? ""
  );

  const initialSelectedProductSlug =
    productSlug || productOptions[0]?.slug || "";

  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormState>(() =>
    createInitialForm(defaultRequestType, initialSelectedProductSlug)
  );

  const steps = useMemo(
    () =>
      STEP_DEFS.map((step) => ({
        ...step,
        label: String(
          t(`leadForm.steps.${step.key}.label`, {
            defaultValue: step.label,
          })
        ),
        title: String(
          t(`leadForm.steps.${step.key}.title`, {
            defaultValue: step.title,
          })
        ),
        description: String(
          t(`leadForm.steps.${step.key}.description`, {
            defaultValue: step.description,
          })
        ),
      })),
    [t]
  );

  const formTitle =
    title ??
    t("leadForm.title", { defaultValue: "Demander une information" });
  const formDescription =
    description ??
    t("leadForm.description", {
      defaultValue:
        "Remplissez ce formulaire pour être contacté par l'équipe MD2I.",
    });

  useEffect(() => {
    if (productSlug || productOptions.length > 0) return;

    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/crm/products", {
          headers: {
            Accept: "application/json",
          },
          credentials: "same-origin",
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

  useEffect(() => {
    let cancelled = false;

    translateDynamicItems<ProductOption>(availableProducts, locale, ["name"])
      .then((items) => {
        if (!cancelled) {
          setLocalizedProducts(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocalizedProducts(availableProducts);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [availableProducts, locale]);

  useEffect(() => {
    let cancelled = false;

    if (!productName) {
      setLocalizedProductName("");
      return;
    }

    translateDynamicItems<{ name: string }>([{ name: productName }], locale, [
      "name",
    ])
      .then(([item]) => {
        if (!cancelled) {
          setLocalizedProductName(item?.name ?? productName);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocalizedProductName(productName);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productName, locale]);

  const selectedRawProduct = availableProducts.find(
    (item) => item.slug === form.selectedProductSlug
  );
  const selectedProduct = localizedProducts.find(
    (item) => item.slug === form.selectedProductSlug
  );

  const finalProductSlug = productSlug || form.selectedProductSlug;
  const finalProductNameForSubmit =
    productName || selectedRawProduct?.name || "";
  const finalProductName =
    localizedProductName || selectedProduct?.name || finalProductNameForSubmit;
  const shouldShowProductSelect =
    showProductSelect && !productSlug && availableProducts.length > 0;

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

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

  const goNext = () => {
    const nextErrors = validateStep(
      form,
      currentStep,
      shouldShowProductSelect,
      t
    );

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      setNotice(
        String(
          t("leadForm.validation.fixFields", {
            defaultValue: "Veuillez corriger les champs indiqués.",
          })
        )
      );
      return;
    }

    setErrors({});
    setNotice("");
    setStatus("idle");
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setNotice("");
    setStatus("idle");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLastStep) {
      goNext();
      return;
    }

    const nextErrors = validateForm(form, shouldShowProductSelect, t);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      setNotice(
        String(
          t("leadForm.validation.fixFields", {
            defaultValue: "Veuillez corriger les champs indiqués.",
          })
        )
      );
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

          website: form.website,
          submittedAt: form.submittedAt,

          productId,
          productSlug: finalProductSlug,
          productNameFallback: finalProductNameForSubmit,

          source: resolveSourceFromUtm(tracking.utmSource),
          ...tracking,
        }),
        credentials: "same-origin",
      });

      let data: { success?: boolean; error?: string; message?: string } | null =
        null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          String(
            t("leadForm.validation.invalidServerResponse", {
              defaultValue: "Réponse serveur invalide.",
            })
          )
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
            String(
              t("leadForm.validation.submitError", {
                defaultValue: "Erreur pendant l'envoi.",
              })
            )
        );
      }

      setStatus("success");
      setNotice(
        String(
          t("leadForm.success", {
            defaultValue:
              "Votre demande a bien été envoyée. L'équipe MD2I vous contactera prochainement.",
          })
        )
      );

      const resetProductSlug =
        productSlug || availableProducts[0]?.slug || initialSelectedProductSlug;

      setForm(createInitialForm(defaultRequestType, resetProductSlug));
      setCurrentStep(0);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(
              t("leadForm.validation.submitFailed", {
                defaultValue: "Impossible d'envoyer votre demande.",
              })
            );

      setStatus("error");
      setNotice(message);
      setErrors({
        global: message,
      });
    }
  };

  return (
    <form
      onSubmit={submit}
      className={`${styles.form} ${
        variant === "premium" ? styles.formPremium : ""
      }`}
      noValidate
    >
      {!hideHeader && (
        <div className={styles.header}>
          <span className={styles.badge}>MD2I</span>

          {formTitle && <h2 className={styles.title}>{formTitle}</h2>}

          {formDescription && (
            <p className={styles.text}>{formDescription}</p>
          )}

          {finalProductName && (
            <p className={styles.productLabel}>
              {t("leadForm.productConcerned", {
                defaultValue: "Produit concerné : {{product}}",
                product: finalProductName,
              })}
            </p>
          )}
        </div>
      )}

      <div
        className={styles.progressWrap}
        aria-label={t("leadForm.progressAria", {
          defaultValue: "Progression du formulaire",
        })}
      >
        <div className={styles.progressTop}>
          <span>
            {t("leadForm.progress", {
              defaultValue: "Étape {{current}} sur {{total}}",
              current: currentStep + 1,
              total: steps.length,
            })}
          </span>

          <strong>{currentStepData.label}</strong>
        </div>

        <div className={styles.progressBar}>
          <span
            className={styles.progressFill}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <div className={styles.steps}>
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={`${styles.stepButton} ${
              index === currentStep ? styles.stepButtonActive : ""
            } ${index < currentStep ? styles.stepButtonDone : ""}`}
            onClick={() => {
              if (index <= currentStep) {
                setCurrentStep(index);
                setErrors({});
                setNotice("");
              }
            }}
            disabled={status === "loading" || index > currentStep}
            aria-current={index === currentStep ? "step" : undefined}
          >
            <span className={styles.stepNumber}>{index + 1}</span>
            <span>{step.label}</span>
          </button>
        ))}
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

      {notice && status === "success" && (
        <p className={styles.noticeSuccess} role="status">
          {notice}
        </p>
      )}

      {notice && status === "error" && !errors.global && (
        <p className={styles.noticeError} role="alert">
          {notice}
        </p>
      )}

      <section className={styles.stepPanel}>
        <div className={styles.stepHeader}>
          <p className={styles.stepEyebrow}>{currentStepData.label}</p>
          <h3>{currentStepData.title}</h3>
          <p>{currentStepData.description}</p>
        </div>

        {currentStep === 0 && (
          <div className={styles.stepContent}>
            {shouldShowProductSelect && (
              <label className={styles.field}>
                <span className={styles.label}>
                  {t("leadForm.fields.product", {
                    defaultValue: "Produit ou service concerné",
                  })}
                </span>

                <select
                  className={`${styles.input} ${
                    errors.selectedProductSlug ? styles.inputError : ""
                  }`}
                  value={form.selectedProductSlug}
                  onChange={(event) =>
                    updateField("selectedProductSlug", event.target.value)
                  }
                  required
                  aria-invalid={Boolean(errors.selectedProductSlug)}
                >
                  {localizedProducts.map((product) => (
                    <option key={product.slug} value={product.slug}>
                      {product.name}
                    </option>
                  ))}
                </select>

                {errors.selectedProductSlug && (
                  <span className={styles.error}>
                    {errors.selectedProductSlug}
                  </span>
                )}
              </label>
            )}

            <label className={styles.field}>
              <span className={styles.label}>
                {t("leadForm.fields.requestType", {
                  defaultValue: "Type de demande",
                })}
              </span>

              <select
                className={styles.input}
                value={form.requestType}
                onChange={(event) =>
                  updateField("requestType", event.target.value as RequestType)
                }
              >
                {REQUEST_TYPE_DEFS.map((requestType) => (
                  <option key={requestType.value} value={requestType.value}>
                    {t(`leadForm.requestTypes.${requestType.value}.option`, {
                      defaultValue: requestType.optionLabel,
                    })}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.summaryBox}>
              <span>
                {t("leadForm.summary.title", { defaultValue: "Résumé" })}
              </span>
              <strong>{getRequestTypeLabel(form.requestType, t)}</strong>
              <p>
                {finalProductName
                  ? t("leadForm.summary.productSelected", {
                      defaultValue: "Produit sélectionné : {{product}}",
                      product: finalProductName,
                    })
                  : t("leadForm.summary.general", {
                      defaultValue:
                        "Votre demande sera enregistrée comme demande commerciale générale.",
                    })}
              </p>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span className={styles.label}>
                  {t("leadForm.fields.firstName", { defaultValue: "Prénom" })}
                </span>

                <input
                  className={styles.input}
                  value={form.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                  placeholder={t("leadForm.placeholders.firstName", {
                    defaultValue: "Votre prénom",
                  })}
                  autoComplete="given-name"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  {t("leadForm.fields.lastName", { defaultValue: "Nom" })}
                </span>

                <input
                  className={styles.input}
                  value={form.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                  placeholder={t("leadForm.placeholders.lastName", {
                    defaultValue: "Votre nom",
                  })}
                  autoComplete="family-name"
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>
                {t("leadForm.fields.email", { defaultValue: "Email *" })}
              </span>

              <input
                className={`${styles.input} ${
                  errors.email ? styles.inputError : ""
                }`}
                type="email"
                required
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="vous@entreprise.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
              />

              {errors.email && (
                <span className={styles.error}>{errors.email}</span>
              )}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                {t("leadForm.fields.phone", { defaultValue: "Téléphone" })}
              </span>

              <input
                className={`${styles.input} ${
                  errors.phone ? styles.inputError : ""
                }`}
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+261 ..."
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
              />

              {errors.phone && (
                <span className={styles.error}>{errors.phone}</span>
              )}
            </label>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span className={styles.label}>
                  {t("leadForm.fields.jobTitle", { defaultValue: "Fonction" })}
                </span>

                <input
                  className={styles.input}
                  value={form.jobTitle}
                  onChange={(event) =>
                    updateField("jobTitle", event.target.value)
                  }
                  placeholder={t("leadForm.placeholders.jobTitle", {
                    defaultValue: "Responsable RH, DAF...",
                  })}
                  autoComplete="organization-title"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  {t("leadForm.fields.company", {
                    defaultValue: "Entreprise *",
                  })}
                </span>

                <input
                  className={`${styles.input} ${
                    errors.companyName ? styles.inputError : ""
                  }`}
                  value={form.companyName}
                  onChange={(event) =>
                    updateField("companyName", event.target.value)
                  }
                  placeholder={t("leadForm.placeholders.company", {
                    defaultValue: "Nom de l'entreprise",
                  })}
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
                <span className={styles.label}>
                  {t("leadForm.fields.country", { defaultValue: "Pays" })}
                </span>

                <input
                  className={styles.input}
                  value={form.country}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
                  placeholder={t("leadForm.placeholders.country", {
                    defaultValue: "Madagascar, France...",
                  })}
                  autoComplete="country-name"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  {t("leadForm.fields.city", { defaultValue: "Ville" })}
                </span>

                <input
                  className={styles.input}
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder={t("leadForm.placeholders.city", {
                    defaultValue: "Votre ville",
                  })}
                  autoComplete="address-level2"
                />
              </label>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.stepContent}>
            <label className={styles.field}>
              <span className={styles.label}>
                {t("leadForm.fields.message", { defaultValue: "Message *" })}
              </span>

              <textarea
                className={`${styles.input} ${styles.textarea} ${
                  errors.message ? styles.inputError : ""
                }`}
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder={t("leadForm.placeholders.message", {
                  defaultValue:
                    "Décrivez votre besoin, le nombre d'utilisateurs, le délai souhaité...",
                })}
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
                {t("leadForm.consent", {
                  defaultValue:
                    "J'accepte d'être contacté par MD2I au sujet de ma demande.",
                })}
              </span>
            </label>

            {errors.consentEmail && (
              <span className={styles.error}>{errors.consentEmail}</span>
            )}

            <div className={styles.finalSummary}>
              <span>
                {t("leadForm.finalSummary.title", {
                  defaultValue: "Avant envoi",
                })}
              </span>
              <p>
                {t("leadForm.finalSummary.text", {
                  defaultValue:
                    "Votre demande sera transmise à l'équipe MD2I et enregistrée dans le CRM pour assurer un suivi commercial.",
                })}
              </p>
            </div>
          </div>
        )}
      </section>

      <div className={styles.navigation}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={goBack}
          disabled={isFirstStep || status === "loading"}
        >
          {t("leadForm.actions.back", { defaultValue: "Retour" })}
        </button>

        <button
          type="submit"
          disabled={status === "loading"}
          className={styles.button}
        >
          {status === "loading" ? (
            <>
              <span className={styles.spinner} />
              {t("leadForm.actions.sending", {
                defaultValue: "Envoi en cours...",
              })}
            </>
          ) : isLastStep ? (
            <>
              {t("leadForm.actions.submit", {
                defaultValue: "Envoyer ma demande",
              })}
              <span aria-hidden="true">→</span>
            </>
          ) : (
            <>
              {t("leadForm.actions.continue", { defaultValue: "Continuer" })}
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>

      <p className={styles.securityNote}>
        {t("leadForm.securityNote", {
          defaultValue:
            "Formulaire sécurisé : validation des champs, anti-spam et contrôle côté serveur.",
        })}
      </p>
    </form>
  );
}
