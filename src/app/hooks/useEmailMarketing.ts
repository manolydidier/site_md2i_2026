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
} from "@/app/types/email-marketing";

interface UseContactsOptions {
  pageSize?: number;
  groupId?: string;
  crmStatus?: string;
  crmSource?: string;
}

export function useContacts({
  pageSize = 20,
  groupId,
  crmStatus,
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

      if (crmSource) {
        params.set("crmSource", crmSource);
      }

      const res = await fetch(`/api/contacts?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des contacts");
      }

      const data: PaginatedResponse<Contact> = await res.json();

      setContacts(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, groupId, crmStatus, crmSource]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Reset page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [search, groupId, crmStatus, crmSource]);

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
        const err = await res.json();
        throw new Error(err.error?.message || err.error || "Erreur création");
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
        throw new Error(err?.error?.message || err?.error || "Erreur mise à jour");
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
      const res = await fetch("/api/groups");

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des groupes");
      }

      const data = await res.json();

      setGroups(data);
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

// ─── Hook pour les campagnes ──────────────────────────────────────────────────

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/campaigns?page=${page}&pageSize=10`);

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des campagnes");
      }

      const data = await res.json();

      setCampaigns(data.data);
      setTotal(data.total);
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
    status: string;
    progress: number;
    sentCount: number;
    failedCount: number;
    totalRecipients: number;
  } | null>(null);

  useEffect(() => {
    if (!campaignId || !active) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/status`);

        if (!res.ok) return;

        const data = await res.json();

        setStatus(data);

        if (data.status === "SENT" || data.status === "FAILED") {
          clearInterval(interval);
        }
      } catch {
        // Ignorer les erreurs réseau temporaires
      }
    };

    poll();

    const interval = setInterval(poll, 2000);

    return () => clearInterval(interval);
  }, [campaignId, active]);

  return status;
}