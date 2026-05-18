// src/app/(backoffice)/email-marketing/automations/page.tsx
"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Mail,
  Plus,
  Power,
  PowerOff,
  RefreshCcw,
  RotateCcw,
  Save,
  Trash2,
  X,
  Zap,
} from "lucide-react";

type LegacyTrigger =
  | "CONTACT_CREATED"
  | "CONTACT_STATUS_NEW"
  | "CONTACT_STATUS_PROSPECT"
  | "CONTACT_STATUS_HOT_PROSPECT"
  | "CONTACT_STATUS_CUSTOMER"
  | "CONTACT_STATUS_INACTIVE"
  | "EMAIL_OPENED"
  | "EMAIL_CLICKED"
  | "MANUAL_START";

type TriggerEvent =
  | "CONTACT_CREATED"
  | "CONTACT_UPDATED"
  | "EMAIL_OPENED"
  | "EMAIL_CLICKED"
  | "MANUAL_START";

type ConditionField =
  | "NONE"
  | "EMAIL"
  | "FIRST_NAME"
  | "LAST_NAME"
  | "PHONE"
  | "GROUP_ID"
  | "CRM_STATUS"
  | "CRM_SOURCE"
  | "COMPANY_NAME"
  | "COUNTRY"
  | "CITY"
  | "IS_ACTIVE"
  | "UNSUBSCRIBED";

type ConditionOperator =
  | "ALWAYS"
  | "EQUALS"
  | "NOT_EQUALS"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "EXISTS"
  | "NOT_EXISTS"
  | "CHANGED"
  | "CHANGED_TO"
  | "CHANGED_FROM";

type DelayUnit = "MINUTES" | "HOURS" | "DAYS";

type DraftCampaign = {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  fromName: string;
  fromEmail: string | null;
  replyTo: string | null;
  status: "DRAFT";
  updatedAt: string;
};

type ContactGroup = {
  id: string;
  name: string;
  _count?: {
    contacts?: number;
  };
};

type Automation = {
  id: string;
  name: string;
  description: string;

  trigger: LegacyTrigger;

  triggerEvent: TriggerEvent;
  conditionField: ConditionField;
  conditionOperator: ConditionOperator;
  conditionValue: string;
  conditionValueJson?: unknown;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  stepId: string | null;
  delayValue: number;
  delayUnit: DelayUnit;
  selectedCampaignId: string | null;
  selectedCampaign: DraftCampaign | null;
  stepCount: number;
};

type FormState = {
  id: string | null;
  name: string;
  description: string;

  trigger: LegacyTrigger;

  triggerEvent: TriggerEvent;
  conditionField: ConditionField;
  conditionOperator: ConditionOperator;
  conditionValue: string;

  campaignId: string;
  delayValue: number;
  delayUnit: DelayUnit;
  isActive: boolean;
};

const DEFAULT_FORM: FormState = {
  id: null,
  name: "",
  description: "",

  trigger: "CONTACT_CREATED",

  triggerEvent: "CONTACT_CREATED",
  conditionField: "NONE",
  conditionOperator: "ALWAYS",
  conditionValue: "",

  campaignId: "",
  delayValue: 0,
  delayUnit: "MINUTES",
  isActive: false,
};

const LEGACY_TRIGGER_LABELS: Record<LegacyTrigger, string> = {
  CONTACT_CREATED: "Nouveau contact",
  CONTACT_STATUS_NEW: "Contact devient nouveau",
  CONTACT_STATUS_PROSPECT: "Contact devient prospect",
  CONTACT_STATUS_HOT_PROSPECT: "Contact devient prospect chaud",
  CONTACT_STATUS_CUSTOMER: "Contact devient client",
  CONTACT_STATUS_INACTIVE: "Contact devient inactif",
  EMAIL_OPENED: "Email ouvert",
  EMAIL_CLICKED: "Lien email cliqué",
  MANUAL_START: "Démarrage manuel",
};

const TRIGGER_EVENT_LABELS: Record<TriggerEvent, string> = {
  CONTACT_CREATED: "Contact créé",
  CONTACT_UPDATED: "Contact modifié",
  EMAIL_OPENED: "Email ouvert",
  EMAIL_CLICKED: "Lien email cliqué",
  MANUAL_START: "Démarrage manuel",
};

const CONDITION_FIELD_LABELS: Record<ConditionField, string> = {
  NONE: "Aucune condition",
  EMAIL: "Email",
  FIRST_NAME: "Prénom",
  LAST_NAME: "Nom",
  PHONE: "Téléphone",
  GROUP_ID: "Groupe",
  CRM_STATUS: "Statut CRM",
  CRM_SOURCE: "Source CRM",
  COMPANY_NAME: "Entreprise",
  COUNTRY: "Pays",
  CITY: "Ville",
  IS_ACTIVE: "Contact actif",
  UNSUBSCRIBED: "Désinscrit",
};

const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  ALWAYS: "Toujours",
  EQUALS: "est égal à",
  NOT_EQUALS: "est différent de",
  CONTAINS: "contient",
  NOT_CONTAINS: "ne contient pas",
  EXISTS: "existe",
  NOT_EXISTS: "n’existe pas",
  CHANGED: "a changé",
  CHANGED_TO: "change vers",
  CHANGED_FROM: "change depuis",
};

const CRM_STATUS_OPTIONS = [
  "NEW",
  "PROSPECT",
  "HOT_PROSPECT",
  "CUSTOMER",
  "INACTIVE",
];

const BOOLEAN_OPTIONS = [
  { value: "true", label: "Oui" },
  { value: "false", label: "Non" },
];

const OPERATORS_WITHOUT_VALUE: ConditionOperator[] = [
  "ALWAYS",
  "EXISTS",
  "NOT_EXISTS",
  "CHANGED",
];

const CHANGE_OPERATORS: ConditionOperator[] = [
  "CHANGED",
  "CHANGED_TO",
  "CHANGED_FROM",
];

function isConditionAllowed(triggerEvent: TriggerEvent) {
  return triggerEvent === "CONTACT_CREATED" || triggerEvent === "CONTACT_UPDATED";
}

function isValueRequired(operator: ConditionOperator) {
  return !OPERATORS_WITHOUT_VALUE.includes(operator);
}

function getSuggestedName(form: Partial<FormState>) {
  if (form.triggerEvent === "CONTACT_CREATED") {
    if (form.conditionOperator === "ALWAYS" || form.conditionField === "NONE") {
      return "Email de bienvenue";
    }

    if (form.conditionField === "CRM_SOURCE") {
      return "Email selon la source";
    }

    if (form.conditionField === "GROUP_ID") {
      return "Email selon le groupe";
    }

    return "Email nouveau contact";
  }

  if (
    form.triggerEvent === "CONTACT_UPDATED" &&
    form.conditionField === "CRM_STATUS" &&
    form.conditionOperator === "CHANGED_TO"
  ) {
    if (form.conditionValue === "PROSPECT") return "Email de prospection";
    if (form.conditionValue === "HOT_PROSPECT") return "Relance prospect chaud";
    if (form.conditionValue === "CUSTOMER") return "Email client";
    if (form.conditionValue === "INACTIVE") return "Email de réactivation";
    if (form.conditionValue === "NEW") return "Email contact nouveau";
  }

  if (
    form.triggerEvent === "CONTACT_UPDATED" &&
    form.conditionField === "GROUP_ID"
  ) {
    return "Email selon changement de groupe";
  }

  if (form.triggerEvent === "EMAIL_OPENED") return "Relance après ouverture";
  if (form.triggerEvent === "EMAIL_CLICKED") return "Relance après clic";
  if (form.triggerEvent === "MANUAL_START") return "Automatisation manuelle";

  return "Nouvelle automatisation";
}

function mapDynamicToLegacyTrigger(
  form: Pick<
    FormState,
    "triggerEvent" | "conditionField" | "conditionOperator" | "conditionValue"
  >
): LegacyTrigger {
  if (form.triggerEvent === "EMAIL_OPENED") return "EMAIL_OPENED";
  if (form.triggerEvent === "EMAIL_CLICKED") return "EMAIL_CLICKED";
  if (form.triggerEvent === "MANUAL_START") return "MANUAL_START";

  if (
    form.triggerEvent === "CONTACT_UPDATED" &&
    form.conditionField === "CRM_STATUS" &&
    form.conditionOperator === "CHANGED_TO"
  ) {
    if (form.conditionValue === "NEW") return "CONTACT_STATUS_NEW";
    if (form.conditionValue === "PROSPECT") return "CONTACT_STATUS_PROSPECT";
    if (form.conditionValue === "HOT_PROSPECT") {
      return "CONTACT_STATUS_HOT_PROSPECT";
    }
    if (form.conditionValue === "CUSTOMER") return "CONTACT_STATUS_CUSTOMER";
    if (form.conditionValue === "INACTIVE") return "CONTACT_STATUS_INACTIVE";
  }

  return "CONTACT_CREATED";
}

function cleanEmailHtml(html: string) {
  return html
    .replace(/<link[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "")
    .replace(/<link[^>]*href=["'][^"']*\.css["'][^>]*>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/@import[^;]+;/gi, "");
}

function renderPreview(template: string) {
  return cleanEmailHtml(template || "")
    .replaceAll("{{firstName}}", "Manou")
    .replaceAll("{{lastName}}", "Ravelojaona")
    .replaceAll("{{fullName}}", "Manou Ravelojaona")
    .replaceAll("{{contactName}}", "Manou Ravelojaona")
    .replaceAll("{{email}}", "manou@example.com")
    .replaceAll("{{phone}}", "+261 34 00 000 00")
    .replaceAll("{{companyName}}", "Entreprise Test")
    .replaceAll("{{city}}", "Antananarivo")
    .replaceAll("{{country}}", "Madagascar")
    .replaceAll("{{prospectLink}}", "https://md2i.eu?preview=prospect-link")
    .replaceAll("{{ctaProspectLink}}", "https://md2i.eu?preview=prospect-link");
}

function getDelayLabel(value: number, unit: DelayUnit) {
  if (value === 0) return "Envoyé immédiatement";

  const unitLabels: Record<DelayUnit, string> = {
    MINUTES: value > 1 ? "minutes" : "minute",
    HOURS: value > 1 ? "heures" : "heure",
    DAYS: value > 1 ? "jours" : "jour",
  };

  return `Envoyé après ${value} ${unitLabels[unit]}`;
}

function getGroupNameById(groups: ContactGroup[], groupId: string) {
  const group = groups.find((item) => item.id === groupId);

  if (!group) return groupId || "—";

  const count = group._count?.contacts ?? 0;

  return `${group.name} (${count})`;
}

function getConditionValueLabel(
  field: ConditionField,
  value: string,
  groups: ContactGroup[]
) {
  if (!value) return "—";

  if (field === "GROUP_ID") {
    return getGroupNameById(groups, value);
  }

  if (field === "IS_ACTIVE" || field === "UNSUBSCRIBED") {
    return value === "true" ? "Oui" : "Non";
  }

  return value;
}

function getConditionLabel(
  automation: {
    triggerEvent: TriggerEvent;
    conditionField: ConditionField;
    conditionOperator: ConditionOperator;
    conditionValue: string;
  },
  groups: ContactGroup[] = []
) {
  const eventLabel = TRIGGER_EVENT_LABELS[automation.triggerEvent];

  if (
    automation.conditionOperator === "ALWAYS" ||
    automation.conditionField === "NONE"
  ) {
    return `${eventLabel} · toujours`;
  }

  const fieldLabel = CONDITION_FIELD_LABELS[automation.conditionField];
  const operatorLabel =
    CONDITION_OPERATOR_LABELS[automation.conditionOperator];

  if (!isValueRequired(automation.conditionOperator)) {
    return `${eventLabel} · ${fieldLabel} ${operatorLabel}`;
  }

  const valueLabel = getConditionValueLabel(
    automation.conditionField,
    automation.conditionValue,
    groups
  );

  return `${eventLabel} · ${fieldLabel} ${operatorLabel} ${valueLabel}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function getFieldValuePlaceholder(field: ConditionField) {
  if (field === "EMAIL") return "exemple@domaine.com";
  if (field === "FIRST_NAME") return "Manou";
  if (field === "LAST_NAME") return "Ravelojaona";
  if (field === "PHONE") return "+261...";
  if (field === "GROUP_ID") return "Choisir un groupe";
  if (field === "CRM_SOURCE") return "WEBSITE";
  if (field === "COMPANY_NAME") return "MD2I";
  if (field === "COUNTRY") return "Madagascar";
  if (field === "CITY") return "Antananarivo";
  return "Valeur";
}

function validateForm(form: FormState, groups: ContactGroup[]) {
  if (!form.name.trim()) {
    return "Le nom de l’automatisation est requis.";
  }

  if (form.isActive && !form.campaignId) {
    return "Choisissez une campagne brouillon avant d’activer l’automatisation.";
  }

  if (!isConditionAllowed(form.triggerEvent)) {
    return null;
  }

  if (form.conditionOperator === "ALWAYS") {
    return null;
  }

  if (form.conditionField === "NONE") {
    return "Choisissez un champ de condition.";
  }

  if (
    form.triggerEvent === "CONTACT_CREATED" &&
    CHANGE_OPERATORS.includes(form.conditionOperator)
  ) {
    return "Les conditions de changement sont réservées à l’événement Contact modifié.";
  }

  if (form.conditionField === "GROUP_ID" && groups.length === 0) {
    return "Aucun groupe disponible. Créez d’abord un groupe de contacts.";
  }

  if (isValueRequired(form.conditionOperator) && !form.conditionValue.trim()) {
    return "Renseignez une valeur de condition.";
  }

  return null;
}

export default function EmailAutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [draftCampaigns, setDraftCampaigns] = useState<DraftCampaign[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [initialForm, setInitialForm] = useState<FormState>(DEFAULT_FORM);
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isEditing = Boolean(form.id);

  const selectedCampaign = useMemo(() => {
    return (
      draftCampaigns.find((campaign) => campaign.id === form.campaignId) ||
      null
    );
  }, [draftCampaigns, form.campaignId]);

  const visibleAutomations = useMemo(() => {
    return automations.filter(
      (automation) => !automation.name.startsWith("[SUPPRIMÉE]")
    );
  }, [automations]);

  const hasChanges = useMemo(() => {
    return (
      form.id !== initialForm.id ||
      form.name !== initialForm.name ||
      form.description !== initialForm.description ||
      form.trigger !== initialForm.trigger ||
      form.triggerEvent !== initialForm.triggerEvent ||
      form.conditionField !== initialForm.conditionField ||
      form.conditionOperator !== initialForm.conditionOperator ||
      form.conditionValue !== initialForm.conditionValue ||
      form.campaignId !== initialForm.campaignId ||
      form.delayValue !== initialForm.delayValue ||
      form.delayUnit !== initialForm.delayUnit ||
      form.isActive !== initialForm.isActive
    );
  }, [form, initialForm]);

  const formError = validateForm(form, groups);

  const previewSubject = selectedCampaign
    ? renderPreview(selectedCampaign.subject)
    : "Aucune campagne sélectionnée";

  const previewContent = selectedCampaign
    ? renderPreview(selectedCampaign.htmlContent)
    : "<p>Choisissez une campagne brouillon pour voir l’aperçu.</p>";

  const delayLabel = getDelayLabel(form.delayValue, form.delayUnit);

  const loadData = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const [automationRes, groupsRes] = await Promise.all([
        fetch("/api/email-automations", {
          method: "GET",
          cache: "no-store",
        }),
        fetch("/api/groups", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const automationData = await automationRes.json();

      if (!automationRes.ok) {
        throw new Error(
          automationData.error || "Impossible de charger les automatisations."
        );
      }

      let groupsData: ContactGroup[] = [];

      if (groupsRes.ok) {
        groupsData = await groupsRes.json();
      } else {
        const errorData = await groupsRes.json().catch(() => null);

        throw new Error(
          errorData?.error || "Impossible de charger les groupes de contacts."
        );
      }

      setAutomations(automationData.automations || []);
      setDraftCampaigns(automationData.draftCampaigns || []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateForm = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      next.trigger = mapDynamicToLegacyTrigger(next);

      return next;
    });
  };

  const openCreateModal = () => {
    const nextForm = {
      ...DEFAULT_FORM,
    };

    setForm(nextForm);
    setInitialForm(nextForm);
    setShowModal(true);
    setMessage(null);
  };

  const openEditModal = (automation: Automation) => {
    const nextForm: FormState = {
      id: automation.id,
      name: automation.name,
      description: automation.description || "",

      trigger: automation.trigger || "CONTACT_CREATED",

      triggerEvent: automation.triggerEvent || "CONTACT_CREATED",
      conditionField: automation.conditionField || "NONE",
      conditionOperator: automation.conditionOperator || "ALWAYS",
      conditionValue: automation.conditionValue || "",

      campaignId: automation.selectedCampaignId || "",
      delayValue: automation.delayValue || 0,
      delayUnit: automation.delayUnit || "MINUTES",
      isActive: automation.isActive,
    };

    nextForm.trigger = mapDynamicToLegacyTrigger(nextForm);

    setForm(nextForm);
    setInitialForm(nextForm);
    setShowModal(true);
    setMessage(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(DEFAULT_FORM);
    setInitialForm(DEFAULT_FORM);
    setMessage(null);
  };

  const handleReset = () => {
    setForm(initialForm);
    setMessage(null);
  };

  const handleTriggerEventChange = (triggerEvent: TriggerEvent) => {
    setForm((prev) => {
      let next: FormState = {
        ...prev,
        triggerEvent,
      };

      if (!isConditionAllowed(triggerEvent)) {
        next = {
          ...next,
          conditionField: "NONE",
          conditionOperator: "ALWAYS",
          conditionValue: "",
        };
      }

      if (
        triggerEvent === "CONTACT_CREATED" &&
        CHANGE_OPERATORS.includes(next.conditionOperator)
      ) {
        next = {
          ...next,
          conditionOperator: "ALWAYS",
          conditionField: "NONE",
          conditionValue: "",
        };
      }

      if (next.conditionField === "GROUP_ID" && !next.conditionValue) {
        next.conditionValue = groups[0]?.id || "";
      }

      if (!next.name.trim()) {
        next.name = getSuggestedName(next);
      }

      next.trigger = mapDynamicToLegacyTrigger(next);

      return next;
    });
  };

  const handleConditionFieldChange = (conditionField: ConditionField) => {
    setForm((prev) => {
      let next: FormState = {
        ...prev,
        conditionField,
      };

      if (conditionField === "NONE") {
        next.conditionOperator = "ALWAYS";
        next.conditionValue = "";
      } else if (next.conditionOperator === "ALWAYS") {
        next.conditionOperator =
          next.triggerEvent === "CONTACT_UPDATED" ? "CHANGED_TO" : "EQUALS";
      }

      if (conditionField === "CRM_STATUS" && !next.conditionValue) {
        next.conditionValue = "PROSPECT";
      }

      if (conditionField === "GROUP_ID") {
        next.conditionValue = groups[0]?.id || "";
      }

      if (
        (conditionField === "IS_ACTIVE" || conditionField === "UNSUBSCRIBED") &&
        !next.conditionValue
      ) {
        next.conditionValue = "true";
      }

      if (
        conditionField !== "CRM_STATUS" &&
        conditionField !== "GROUP_ID" &&
        conditionField !== "IS_ACTIVE" &&
        conditionField !== "UNSUBSCRIBED" &&
        prev.conditionField !== conditionField
      ) {
        next.conditionValue = "";
      }

      if (!next.name.trim()) {
        next.name = getSuggestedName(next);
      }

      next.trigger = mapDynamicToLegacyTrigger(next);

      return next;
    });
  };

  const handleConditionOperatorChange = (
    conditionOperator: ConditionOperator
  ) => {
    setForm((prev) => {
      let next: FormState = {
        ...prev,
        conditionOperator,
      };

      if (conditionOperator === "ALWAYS") {
        next.conditionField = "NONE";
        next.conditionValue = "";
      }

      if (!isValueRequired(conditionOperator)) {
        next.conditionValue = "";
      }

      if (conditionOperator !== "ALWAYS" && next.conditionField === "NONE") {
        next.conditionField = "CRM_STATUS";
      }

      if (
        next.conditionField === "CRM_STATUS" &&
        isValueRequired(conditionOperator) &&
        !next.conditionValue
      ) {
        next.conditionValue = "PROSPECT";
      }

      if (
        next.conditionField === "GROUP_ID" &&
        isValueRequired(conditionOperator) &&
        !next.conditionValue
      ) {
        next.conditionValue = groups[0]?.id || "";
      }

      if (!next.name.trim()) {
        next.name = getSuggestedName(next);
      }

      next.trigger = mapDynamicToLegacyTrigger(next);

      return next;
    });
  };

  const handleSubmit = async () => {
    const validationError = validateForm(form, groups);

    if (validationError) {
      setMessage({
        type: "error",
        text: validationError,
      });

      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const url = form.id
        ? `/api/email-automations/${form.id}`
        : "/api/email-automations";

      const method = form.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,

          trigger: form.trigger,

          triggerEvent: form.triggerEvent,
          conditionField: form.conditionField,
          conditionOperator: form.conditionOperator,
          conditionValue: form.conditionValue || null,

          campaignId: form.campaignId || null,
          delayValue: form.delayValue,
          delayUnit: form.delayUnit,
          isActive: form.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde.");
      }

      setMessage({
        type: "success",
        text: form.id
          ? "Automatisation mise à jour."
          : "Automatisation créée.",
      });

      await loadData();
      closeModal();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Erreur lors de la sauvegarde.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async (automation: Automation) => {
    const nextIsActive = !automation.isActive;

    if (nextIsActive && !automation.selectedCampaignId) {
      setMessage({
        type: "error",
        text: `Impossible d’activer “${automation.name}” : aucune campagne brouillon n’est sélectionnée.`,
      });

      return;
    }

    const nextForm: FormState = {
      id: automation.id,
      name: automation.name,
      description: automation.description || "",

      trigger: automation.trigger || "CONTACT_CREATED",

      triggerEvent: automation.triggerEvent || "CONTACT_CREATED",
      conditionField: automation.conditionField || "NONE",
      conditionOperator: automation.conditionOperator || "ALWAYS",
      conditionValue: automation.conditionValue || "",

      campaignId: automation.selectedCampaignId || "",
      delayValue: automation.delayValue,
      delayUnit: automation.delayUnit,
      isActive: nextIsActive,
    };

    const validationError = validateForm(nextForm, groups);

    if (validationError) {
      setMessage({
        type: "error",
        text: validationError,
      });

      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/email-automations/${automation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nextForm.name,
          description: nextForm.description,

          trigger: mapDynamicToLegacyTrigger(nextForm),

          triggerEvent: nextForm.triggerEvent,
          conditionField: nextForm.conditionField,
          conditionOperator: nextForm.conditionOperator,
          conditionValue: nextForm.conditionValue || null,

          campaignId: nextForm.campaignId || null,
          delayValue: nextForm.delayValue,
          delayUnit: nextForm.delayUnit,
          isActive: nextIsActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Erreur lors du changement de statut de “${automation.name}”.`
        );
      }

      setAutomations((prev) =>
        prev.map((item) =>
          item.id === automation.id
            ? {
                ...item,
                isActive: nextIsActive,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      setMessage({
        type: "success",
        text: nextIsActive
          ? `Automatisation “${automation.name}” activée.`
          : `Automatisation “${automation.name}” désactivée.`,
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Erreur lors du changement de statut.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (automation: Automation) => {
    const confirmed = window.confirm(
      `Supprimer l’automatisation “${automation.name}” ? Les emails en attente liés à cette automatisation seront annulés.`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/email-automations/${automation.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la suppression.");
      }

      setMessage({
        type: "success",
        text: "Automatisation supprimée.",
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression.",
      });
    } finally {
      setSaving(false);
    }
  };

  const conditionIsEnabled = isConditionAllowed(form.triggerEvent);
  const conditionValueIsVisible =
    conditionIsEnabled && isValueRequired(form.conditionOperator);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={s.breadcrumb}>
            <span style={s.breadcrumbAccent}>Email Marketing</span>
            <span style={s.slash}>/</span>
            <span>Automatisations</span>
          </div>

          <div style={s.titleRow}>
            <div style={s.iconBadge}>
              <Zap size={22} />
            </div>

            <div>
              <h1 style={s.title}>Automatisations email</h1>
              <p style={s.subtitle}>
                Créez et paramétrez vos emails automatiques avec des
                déclencheurs dynamiques.
              </p>
            </div>
          </div>
        </div>

        <div style={s.headerActions}>
          <Link href="/admin/email-marketing" style={s.secondaryLink}>
            <ArrowLeft size={16} />
            Retour
          </Link>

          <button
            type="button"
            onClick={loadData}
            disabled={saving}
            style={{
              ...s.button,
              ...s.secondaryButton,
              opacity: saving ? 0.5 : 1,
            }}
          >
            <RefreshCcw size={16} />
            Recharger
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={saving}
            style={{
              ...s.button,
              ...s.primaryButton,
              opacity: saving ? 0.5 : 1,
            }}
          >
            <Plus size={16} />
            Nouvelle automatisation
          </button>
        </div>
      </header>

      {message && !showModal && (
        <div
          style={{
            ...s.message,
            ...(message.type === "success" ? s.messageSuccess : s.messageError),
          }}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertCircle size={17} />
          )}
          {message.text}
        </div>
      )}

      <main style={s.card}>
        <div style={s.cardHead}>
          <div>
            <h2 style={s.cardTitle}>Catégories d’emails automatisés</h2>
            <p style={s.cardSubtitle}>
              Chaque ligne représente une catégorie paramétrable depuis le
              backoffice.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={s.empty}>Chargement...</div>
        ) : visibleAutomations.length === 0 ? (
          <div style={s.empty}>
            Aucune automatisation pour le moment. Cliquez sur “Nouvelle
            automatisation”.
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Nom</th>
                  <th style={s.th}>Déclencheur dynamique</th>
                  <th style={s.th}>Campagne</th>
                  <th style={s.th}>Délai</th>
                  <th style={s.th}>Statut</th>
                  <th style={s.th}>Modifié</th>
                  <th style={s.thRight}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleAutomations.map((automation) => (
                  <tr key={automation.id}>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <Mail size={16} />
                        <div>
                          <strong>{automation.name}</strong>
                          {automation.description && (
                            <span>{automation.description}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={s.td}>
                      <div style={s.triggerCell}>
                        <strong>
                          {TRIGGER_EVENT_LABELS[automation.triggerEvent] ||
                            LEGACY_TRIGGER_LABELS[automation.trigger]}
                        </strong>
                        <span>{getConditionLabel(automation, groups)}</span>
                      </div>
                    </td>

                    <td style={s.td}>
                      {automation.selectedCampaign ? (
                        <div style={s.campaignCell}>
                          <strong>{automation.selectedCampaign.name}</strong>
                          <span>{automation.selectedCampaign.subject}</span>
                        </div>
                      ) : (
                        <span style={s.muted}>Aucune campagne</span>
                      )}
                    </td>

                    <td style={s.td}>
                      <span style={s.delayBadge}>
                        <Clock size={13} />
                        {getDelayLabel(
                          automation.delayValue,
                          automation.delayUnit
                        )}
                      </span>
                    </td>

                    <td style={s.td}>
                      <button
                        type="button"
                        onClick={() => handleQuickToggle(automation)}
                        disabled={saving}
                        aria-label={
                          automation.isActive
                            ? `Désactiver ${automation.name}`
                            : `Activer ${automation.name}`
                        }
                        title={
                          automation.isActive
                            ? "Cliquer pour désactiver"
                            : "Cliquer pour activer"
                        }
                        style={{
                          ...s.statusToggleButton,
                          ...(automation.isActive
                            ? s.statusToggleButtonActive
                            : s.statusToggleButtonInactive),
                          opacity: saving ? 0.5 : 1,
                        }}
                      >
                        <span style={s.statusToggleMain}>
                          {automation.isActive ? (
                            <Power size={14} />
                          ) : (
                            <PowerOff size={14} />
                          )}
                          <strong>
                            {automation.isActive ? "Active" : "Inactive"}
                          </strong>
                        </span>

                        <span style={s.statusToggleHint}>
                          {automation.isActive
                            ? "Cliquer pour désactiver"
                            : "Cliquer pour activer"}
                        </span>
                      </button>
                    </td>

                    <td style={s.td}>{formatDate(automation.updatedAt)}</td>

                    <td style={s.tdRight}>
                      <button
                        type="button"
                        onClick={() => openEditModal(automation)}
                        disabled={saving}
                        style={{
                          ...s.tableButton,
                          opacity: saving ? 0.5 : 1,
                        }}
                      >
                        <Edit3 size={14} />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(automation)}
                        disabled={saving}
                        style={{
                          ...s.tableButton,
                          ...s.dangerButton,
                          opacity: saving ? 0.5 : 1,
                        }}
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div style={s.modalOverlay}>
          <section style={s.modal}>
            <header style={s.modalHeader}>
              <div>
                <div style={s.breadcrumb}>
                  <span style={s.breadcrumbAccent}>Automatisation</span>
                  <span style={s.slash}>/</span>
                  <span>{isEditing ? "Modification" : "Création"}</span>
                </div>

                <div style={s.titleRow}>
                  <div style={s.iconBadge}>
                    <Zap size={22} />
                  </div>

                  <div>
                    <h2 style={s.title}>
                      {isEditing
                        ? "Modifier l’automatisation"
                        : "Nouvelle automatisation"}
                    </h2>
                    <p style={s.subtitle}>
                      Paramétrez le moment, la condition, la campagne, le délai
                      et l’aperçu.
                    </p>
                  </div>
                </div>
              </div>

              <div style={s.headerActions}>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasChanges || saving}
                  style={{
                    ...s.button,
                    ...s.secondaryButton,
                    opacity: !hasChanges || saving ? 0.5 : 1,
                  }}
                >
                  <RotateCcw size={16} />
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!hasChanges || saving || Boolean(formError)}
                  style={{
                    ...s.button,
                    ...s.primaryButton,
                    opacity:
                      !hasChanges || saving || Boolean(formError) ? 0.5 : 1,
                  }}
                >
                  <Save size={16} />
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={s.iconButton}
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {message && (
              <div
                style={{
                  ...s.message,
                  ...(message.type === "success"
                    ? s.messageSuccess
                    : s.messageError),
                }}
              >
                {message.type === "success" ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <AlertCircle size={17} />
                )}
                {message.text}
              </div>
            )}

            {formError && (
              <div style={{ ...s.message, ...s.messageError }}>
                <AlertCircle size={17} />
                {formError}
              </div>
            )}

            <main style={s.grid}>
              <section style={s.modalCard}>
                <div style={s.cardHead}>
                  <div>
                    <h3 style={s.cardTitle}>Paramétrage</h3>
                    <p style={s.cardSubtitle}>
                      Choisissez quand cette catégorie d’email doit se
                      déclencher.
                    </p>
                  </div>
                </div>

                <div style={s.statusSummary}>
                  <div>
                    <span style={s.statusLabel}>État actuel</span>
                    <strong
                      style={{
                        color: form.isActive ? "#166534" : "#991B1B",
                      }}
                    >
                      {form.isActive ? "Active" : "Inactive"}
                    </strong>
                  </div>

                  <div>
                    <span style={s.statusLabel}>Campagne</span>
                    <strong>
                      {selectedCampaign ? selectedCampaign.name : "Non définie"}
                    </strong>
                  </div>
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>Nom de la catégorie</label>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="Exemple : Email de prospection"
                    style={s.input}
                  />
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>Description</label>
                  <input
                    value={form.description}
                    onChange={(e) =>
                      updateForm("description", e.target.value)
                    }
                    placeholder="Exemple : envoyé quand un contact devient prospect"
                    style={s.input}
                  />
                </div>

                <div style={s.dynamicBox}>
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Quand</label>
                    <select
                      value={form.triggerEvent}
                      onChange={(e) =>
                        handleTriggerEventChange(e.target.value as TriggerEvent)
                      }
                      style={s.select}
                    >
                      {Object.entries(TRIGGER_EVENT_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div style={s.fieldGroup}>
                    <label style={s.label}>Si</label>
                    <select
                      value={form.conditionField}
                      onChange={(e) =>
                        handleConditionFieldChange(
                          e.target.value as ConditionField
                        )
                      }
                      disabled={!conditionIsEnabled}
                      style={{
                        ...s.select,
                        opacity: conditionIsEnabled ? 1 : 0.55,
                      }}
                    >
                      {Object.entries(CONDITION_FIELD_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div style={s.conditionGrid}>
                    <div style={s.fieldGroup}>
                      <label style={s.label}>Opérateur</label>
                      <select
                        value={form.conditionOperator}
                        onChange={(e) =>
                          handleConditionOperatorChange(
                            e.target.value as ConditionOperator
                          )
                        }
                        disabled={!conditionIsEnabled}
                        style={{
                          ...s.select,
                          opacity: conditionIsEnabled ? 1 : 0.55,
                        }}
                      >
                        {Object.entries(CONDITION_OPERATOR_LABELS).map(
                          ([value, label]) => {
                            const operator = value as ConditionOperator;

                            if (
                              form.triggerEvent === "CONTACT_CREATED" &&
                              CHANGE_OPERATORS.includes(operator)
                            ) {
                              return null;
                            }

                            return (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            );
                          }
                        )}
                      </select>
                    </div>

                    {conditionValueIsVisible && (
                      <div style={s.fieldGroup}>
                        <label style={s.label}>Valeur</label>

                        {form.conditionField === "CRM_STATUS" ? (
                          <select
                            value={form.conditionValue}
                            onChange={(e) =>
                              updateForm("conditionValue", e.target.value)
                            }
                            style={s.select}
                          >
                            {CRM_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        ) : form.conditionField === "GROUP_ID" ? (
                          <select
                            value={form.conditionValue}
                            onChange={(e) =>
                              updateForm("conditionValue", e.target.value)
                            }
                            style={s.select}
                          >
                            <option value="">
                              {groups.length === 0
                                ? "Aucun groupe disponible"
                                : "Choisir un groupe"}
                            </option>

                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name} ({group._count?.contacts ?? 0})
                              </option>
                            ))}
                          </select>
                        ) : form.conditionField === "IS_ACTIVE" ||
                          form.conditionField === "UNSUBSCRIBED" ? (
                          <select
                            value={form.conditionValue}
                            onChange={(e) =>
                              updateForm("conditionValue", e.target.value)
                            }
                            style={s.select}
                          >
                            {BOOLEAN_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={form.conditionValue}
                            onChange={(e) =>
                              updateForm("conditionValue", e.target.value)
                            }
                            placeholder={getFieldValuePlaceholder(
                              form.conditionField
                            )}
                            style={s.input}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div style={s.helpTextPlain}>
                    Résumé :{" "}
                    <strong>
                      {getConditionLabel(
                        {
                          triggerEvent: form.triggerEvent,
                          conditionField: form.conditionField,
                          conditionOperator: form.conditionOperator,
                          conditionValue: form.conditionValue,
                        },
                        groups
                      )}
                    </strong>
                  </div>
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>Statut</label>

                  <button
                    type="button"
                    onClick={() => updateForm("isActive", !form.isActive)}
                    style={{
                      ...s.statusToggle,
                      ...(form.isActive ? s.statusActive : s.statusInactive),
                    }}
                  >
                    {form.isActive
                      ? "Automatisation active"
                      : "Automatisation inactive"}
                  </button>
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>Campagne à utiliser</label>

                  <select
                    value={form.campaignId}
                    onChange={(e) => updateForm("campaignId", e.target.value)}
                    style={s.select}
                  >
                    <option value="">Choisir une campagne brouillon</option>

                    {draftCampaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name} — {campaign.subject}
                      </option>
                    ))}
                  </select>

                  <p style={s.helpTextPlain}>
                    Seules les campagnes brouillon peuvent être reliées à une
                    automatisation.
                  </p>
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>Délai d’envoi</label>

                  <div style={s.delayRow}>
                    <input
                      type="number"
                      min={0}
                      value={form.delayValue}
                      onChange={(e) =>
                        updateForm(
                          "delayValue",
                          Math.max(0, Number(e.target.value))
                        )
                      }
                      style={s.input}
                    />

                    <select
                      value={form.delayUnit}
                      onChange={(e) =>
                        updateForm("delayUnit", e.target.value as DelayUnit)
                      }
                      style={s.select}
                    >
                      <option value="MINUTES">Minutes</option>
                      <option value="HOURS">Heures</option>
                      <option value="DAYS">Jours</option>
                    </select>
                  </div>

                  <div style={s.helpText}>
                    <Clock size={14} />
                    {delayLabel}
                  </div>
                </div>

                {selectedCampaign && (
                  <div style={s.selectedBox}>
                    <strong>Campagne sélectionnée</strong>
                    <span>Nom : {selectedCampaign.name}</span>
                    <span>Sujet : {selectedCampaign.subject}</span>
                    <span>
                      Expéditeur : {selectedCampaign.fromName} &lt;
                      {selectedCampaign.fromEmail || "Non défini"}&gt;
                    </span>
                    <span>
                      Reply-to : {selectedCampaign.replyTo || "Non défini"}
                    </span>
                    <span>
                      Dernière modification :{" "}
                      {formatDate(selectedCampaign.updatedAt)}
                    </span>
                  </div>
                )}

                {draftCampaigns.length === 0 && (
                  <div style={s.warningBox}>
                    Aucune campagne brouillon disponible. Crée d’abord une
                    campagne brouillon dans l’onglet Campagnes.
                  </div>
                )}
              </section>

              <section style={s.modalCard}>
                <div style={s.cardHead}>
                  <div>
                    <h3 style={s.cardTitle}>Aperçu</h3>
                    <p style={s.cardSubtitle}>
                      L’aperçu utilise des données fictives de contact.
                    </p>
                  </div>

                  <div style={s.previewIcon}>
                    <Eye size={18} />
                  </div>
                </div>

                <div style={s.previewMeta}>
                  <span>À : manou@example.com</span>
                  <span>{delayLabel}</span>
                  <span>
                    Quand : {TRIGGER_EVENT_LABELS[form.triggerEvent]}
                  </span>
                  <span>
                    Si :{" "}
                    {getConditionLabel(
                      {
                        triggerEvent: form.triggerEvent,
                        conditionField: form.conditionField,
                        conditionOperator: form.conditionOperator,
                        conditionValue: form.conditionValue,
                      },
                      groups
                    )}
                  </span>
                  <span>
                    Expéditeur :{" "}
                    {selectedCampaign
                      ? `${selectedCampaign.fromName} <${
                          selectedCampaign.fromEmail || "Non défini"
                        }>`
                      : "Non défini"}
                  </span>
                </div>

                <div style={s.previewEmail}>
                  <div style={s.previewSubject}>{previewSubject}</div>

                  <div
                    style={s.previewBody}
                    dangerouslySetInnerHTML={{
                      __html: previewContent,
                    }}
                  />
                </div>
              </section>
            </main>
          </section>
        </div>
      )}
    </div>
  );
}

const ORANGE = "#EF9F27";
const ORANGE_SOFT = "rgba(239,159,39,0.1)";
const ORANGE_BORDER = "rgba(239,159,39,0.25)";
const BG = "#F8FAFC";
const SURFACE = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const MUTED = "#6B7280";
const SOFT_TEXT = "#9CA3AF";

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: BG,
    color: TEXT,
    padding: 32,
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 20,
    marginBottom: 22,
    flexWrap: "wrap",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
    color: MUTED,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  breadcrumbAccent: {
    color: ORANGE,
  },

  slash: {
    color: SOFT_TEXT,
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
    color: ORANGE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.03em",
  },

  subtitle: {
    margin: "5px 0 0",
    color: MUTED,
    fontSize: 14,
  },

  headerActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  button: {
    height: 40,
    padding: "0 15px",
    borderRadius: 11,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

  primaryButton: {
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE,
    color: "#1a0d00",
  },

  secondaryButton: {
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
  },

  secondaryLink: {
    height: 40,
    padding: "0 15px",
    borderRadius: 11,
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
  },

  message: {
    marginBottom: 18,
    padding: "12px 14px",
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
  },

  messageSuccess: {
    background: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
  },

  messageError: {
    background: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FECACA",
  },

  card: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    padding: 20,
    boxSizing: "border-box",
  },

  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },

  cardTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
  },

  cardSubtitle: {
    margin: "5px 0 0",
    color: MUTED,
    fontSize: 13,
  },

  tableWrap: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },

  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: `1px solid ${BORDER}`,
    color: MUTED,
    fontSize: 12,
    fontWeight: 800,
  },

  thRight: {
    textAlign: "right",
    padding: "12px 10px",
    borderBottom: `1px solid ${BORDER}`,
    color: MUTED,
    fontSize: 12,
    fontWeight: 800,
  },

  td: {
    padding: "13px 10px",
    borderBottom: `1px solid ${BORDER}`,
    verticalAlign: "top",
  },

  tdRight: {
    padding: "13px 10px",
    borderBottom: `1px solid ${BORDER}`,
    verticalAlign: "top",
    textAlign: "right",
    whiteSpace: "nowrap",
  },

  nameCell: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
  },

  triggerCell: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },

  campaignCell: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },

  muted: {
    color: SOFT_TEXT,
  },

  delayBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 8px",
    borderRadius: 999,
    background: "#F3F4F6",
    color: MUTED,
    fontWeight: 700,
  },

  statusToggleButton: {
    width: 150,
    minHeight: 44,
    padding: "7px 10px",
    borderRadius: 12,
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 2,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    textAlign: "left",
  },

  statusToggleButtonActive: {
    background: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
  },

  statusToggleButtonInactive: {
    background: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FECACA",
  },

  statusToggleMain: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },

  statusToggleHint: {
    fontSize: 10,
    fontWeight: 600,
    opacity: 0.75,
  },

  tableButton: {
    height: 32,
    padding: "0 10px",
    marginLeft: 6,
    borderRadius: 9,
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },

  dangerButton: {
    color: "#991B1B",
    border: "1px solid #FECACA",
    background: "#FEF2F2",
  },

  empty: {
    padding: 24,
    borderRadius: 14,
    background: "#F9FAFB",
    color: MUTED,
    fontSize: 14,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    background: "rgba(15, 23, 42, 0.45)",
    padding: 24,
    overflowY: "auto",
    boxSizing: "border-box",
  },

  modal: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
    background: BG,
    borderRadius: 22,
    padding: 24,
    boxSizing: "border-box",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.25)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 20,
    marginBottom: 22,
    flexWrap: "wrap",
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 11,
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(380px, 0.9fr)",
    gap: 20,
    alignItems: "start",
  },

  modalCard: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    padding: 20,
    boxSizing: "border-box",
  },

  statusSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 18,
  },

  statusLabel: {
    display: "block",
    marginBottom: 4,
    color: MUTED,
    fontSize: 12,
    fontWeight: 700,
  },

  fieldGroup: {
    marginBottom: 18,
  },

  label: {
    display: "block",
    marginBottom: 7,
    color: "#374151",
    fontSize: 13,
    fontWeight: 800,
  },

  input: {
    width: "100%",
    height: 42,
    borderRadius: 11,
    border: `1px solid ${BORDER}`,
    padding: "0 12px",
    fontSize: 14,
    color: TEXT,
    outline: "none",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    height: 42,
    borderRadius: 11,
    border: `1px solid ${BORDER}`,
    padding: "0 12px",
    fontSize: 14,
    color: TEXT,
    background: SURFACE,
    outline: "none",
    boxSizing: "border-box",
  },

  dynamicBox: {
    padding: 14,
    borderRadius: 16,
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE_SOFT,
    marginBottom: 18,
  },

  conditionGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: 10,
  },

  delayRow: {
    display: "grid",
    gridTemplateColumns: "130px 1fr",
    gap: 10,
  },

  helpText: {
    marginTop: 8,
    color: MUTED,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
  },

  helpTextPlain: {
    margin: "8px 0 0",
    color: MUTED,
    fontSize: 13,
  },

  statusToggle: {
    height: 40,
    padding: "0 13px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },

  statusActive: {
    border: "1px solid #BBF7D0",
    background: "#DCFCE7",
    color: "#166534",
  },

  statusInactive: {
    border: "1px solid #FECACA",
    background: "#FEE2E2",
    color: "#991B1B",
  },

  selectedBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE_SOFT,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#92400e",
    fontSize: 13,
  },

  warningBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #FDE68A",
    background: "#FEF3C7",
    color: "#92400E",
    fontSize: 13,
    fontWeight: 700,
  },

  previewIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: ORANGE_SOFT,
    color: ORANGE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  previewMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginBottom: 14,
    color: MUTED,
    fontSize: 13,
  },

  previewEmail: {
    border: `1px solid ${BORDER}`,
    borderRadius: 15,
    overflow: "hidden",
    background: "#FFFFFF",
  },

  previewSubject: {
    padding: 15,
    borderBottom: `1px solid ${BORDER}`,
    fontSize: 15,
    fontWeight: 800,
    color: TEXT,
    background: "#F9FAFB",
  },

  previewBody: {
    padding: 18,
    color: "#374151",
    fontSize: 14,
    lineHeight: 1.7,
  },
};