// hooks/useContacts.ts
// Hook React pour gérer les contacts avec pagination, recherche, CRUD

import { useState, useCallback, useEffect } from "react";
import type {
  Contact,
  PaginatedResponse,
  ContactFormData,
  ContactGroup,
  GroupFormData,
  Campaign,
  CampaignStatus,
  CrmStatusOption,
  CrmStatusOptionFormData,
} from "@/app/types/email-marketing";

interface UseContactsOptions {
  pageSize?: number;
  groupId?: string;
  crmStatus?: string;
  crmStatusOptionId?: string;
  crmSource?: string;
}

async function readJsonSafe<T = any>(res: Response): Promise<T | null> {
  const text = await res.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      error: text || `Réponse non JSON. Status HTTP: ${res.status}`,
    } as T;
  }
}

export function useContacts({
  pageSize = 20,
  groupId,
  crmStatus,
  crmStatusOptionId,
  crmSource,
}: UseContactsOptions = {}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (groupId) {
        params.set("groupId", groupId);
      }

      if (crmStatus) {
        params.set("crmStatus", crmStatus);
      }

      if (crmStatusOptionId) {
        params.set("crmStatusOptionId", crmStatusOptionId);
      }

      if (crmSource) {
        params.set("crmSource", crmSource);
      }

      const res = await fetch(`/api/contacts?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des contacts");
      }

      const data: PaginatedResponse<Contact> = await res.json();

      setContacts(Array.isArray(data.data) ? data.data : []);
      setTotal(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setContacts([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, groupId, crmStatus, crmStatusOptionId, crmSource]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Reset page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [search, groupId, crmStatus, crmStatusOptionId, crmSource]);

  const createContact = useCallback(
    async (data: ContactFormData) => {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || err?.error || "Erreur création");
      }

      await fetchContacts();

      return res.json();
    },
    [fetchContacts]
  );

  const updateContact = useCallback(
    async (id: string, data: ContactFormData) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error?.message || err?.error || "Erreur mise à jour"
        );
      }

      await fetchContacts();

      return res.json().catch(() => null);
    },
    [fetchContacts]
  );

  const deleteContact = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur suppression");
      }

      await fetchContacts();
    },
    [fetchContacts]
  );

  const deleteMany = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/contacts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        throw new Error("Erreur suppression");
      }

      await fetchContacts();
    },
    [fetchContacts]
  );

  return {
    contacts,
    total,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    loading,
    error,
    refetch: fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    deleteMany,
  };
}

// ─── Hook pour les groupes ────────────────────────────────────────────────────

export function useGroups() {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/groups", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des groupes");
      }

      const data = await res.json();

      setGroups(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = useCallback(
    async (data: GroupFormData) => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Erreur création groupe");
      }

      await fetchGroups();

      return res.json();
    },
    [fetchGroups]
  );

  const updateGroup = useCallback(
    async (id: string, data: GroupFormData) => {
      const res = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Erreur mise à jour groupe");
      }

      await fetchGroups();
    },
    [fetchGroups]
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur suppression groupe");
      }

      await fetchGroups();
    },
    [fetchGroups]
  );

  return {
    groups,
    loading,
    refetch: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}

// ─── Hook pour les statuts CRM dynamiques ─────────────────────────────────────

export function useCrmStatuses() {
  const [statuses, setStatuses] = useState<CrmStatusOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      /**
       * includeInactive=1 est utile pour afficher aussi les statuts désactivés.
       * Si ta route ne gère pas encore ce paramètre, elle peut simplement l’ignorer.
       */
      const res = await fetch("/api/crm/statuses?includeInactive=1", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJsonSafe<CrmStatusOption[] | { error?: string }>(
        res
      );

      if (!res.ok) {
        throw new Error(
          !Array.isArray(data) && data?.error
            ? data.error
            : "Erreur chargement statuts CRM."
        );
      }

      setStatuses(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur inconnue pendant le chargement des statuts CRM.";

      setError(message);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const createStatus = useCallback(
    async (data: CrmStatusOptionFormData) => {
      const res = await fetch("/api/crm/statuses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await readJsonSafe<CrmStatusOption & { error?: string }>(
        res
      );

      if (!res.ok || !json) {
        throw new Error(json?.error || "Erreur création statut CRM.");
      }

      await fetchStatuses();

      return json as CrmStatusOption;
    },
    [fetchStatuses]
  );

  const updateStatus = useCallback(
    async (id: string, data: Partial<CrmStatusOptionFormData>) => {
      const res = await fetch(`/api/crm/statuses/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await readJsonSafe<CrmStatusOption & { error?: string }>(
        res
      );

      if (!res.ok || !json) {
        throw new Error(json?.error || "Erreur modification statut CRM.");
      }

      await fetchStatuses();

      return json as CrmStatusOption;
    },
    [fetchStatuses]
  );

  const disableStatus = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/crm/statuses/${id}`, {
        method: "DELETE",
      });

      const json = await readJsonSafe<{ success?: boolean; error?: string }>(
        res
      );

      if (!res.ok) {
        throw new Error(json?.error || "Erreur désactivation statut CRM.");
      }

      await fetchStatuses();

      return json;
    },
    [fetchStatuses]
  );

  return {
    statuses,
    loading,
    error,
    refetch: fetchStatuses,
    createStatus,
    updateStatus,
    disableStatus,
  };
}

// ─── Hook pour les campagnes ──────────────────────────────────────────────────

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/campaigns?page=${page}&pageSize=10`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des campagnes");
      }

      const data = await res.json();

      setCampaigns(Array.isArray(data.data) ? data.data : []);
      setTotal(Number(data.total || 0));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const deleteCampaign = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur suppression campagne");
      }

      await fetchCampaigns();
    },
    [fetchCampaigns]
  );

  const duplicateCampaign = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/campaigns/${id}?action=duplicate`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Erreur duplication");
      }

      await fetchCampaigns();

      return res.json();
    },
    [fetchCampaigns]
  );

  return {
    campaigns,
    total,
    loading,
    page,
    setPage,
    refetch: fetchCampaigns,
    deleteCampaign,
    duplicateCampaign,
  };
}

// ─── Hook pour le polling du statut d'envoi ───────────────────────────────────

export function useCampaignStatus(campaignId: string | null, active: boolean) {
  const [status, setStatus] = useState<{
    status: CampaignStatus;
    progress: number;
    sentCount: number;
    failedCount: number;
    totalRecipients: number;
  } | null>(null);

  useEffect(() => {
    if (!campaignId || !active) return;

    let interval: ReturnType<typeof setInterval>;

    const poll = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/status`, {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();

        setStatus(data);

        if (
          data.status === "SENT" ||
          data.status === "FAILED" ||
          data.status === "CANCELLED"
        ) {
          clearInterval(interval);
        }
      } catch {
        // Ignorer les erreurs réseau temporaires
      }
    };

    poll();

    interval = setInterval(poll, 2000);

    return () => clearInterval(interval);
  }, [campaignId, active]);

  return status;
}