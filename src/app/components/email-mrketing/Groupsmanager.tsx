// components/email-marketing/GroupsManager.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { groupSchema } from "@/app/lib/email/schemas";
import { useGroups } from "@/app/hooks/useEmailMarketing";
import type { ContactGroup, GroupFormData } from "@/app/types/email-marketing";
import { Plus, Pencil, Trash2, Users, X, Check } from "lucide-react";

import styles from "./GroupsManager.module.css";

export function GroupsManager() {
  const { groups, loading, createGroup, updateGroup, deleteGroup } = useGroups();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className={styles.groupsManager}>
      <div className={styles.groupsHead}>
        <div>
          <div className={styles.sectionLabel}>Groupes</div>
          <p>Organisez vos contacts par segments.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className={styles.primaryBtn}
        >
          <Plus size={16} />
          Nouveau groupe
        </button>
      </div>

      {showAddForm && (
        <div className={styles.formSlot}>
          <GroupForm
            onSave={async (data) => {
              await createGroup(data);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <div className={styles.groupsGrid}>
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={styles.skeletonCard} />
          ))
        ) : groups.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Users size={28} />
            </div>

            <h3>Aucun groupe créé</h3>
            <p>Créez un groupe pour segmenter vos contacts.</p>
          </div>
        ) : (
          groups.map((group) =>
            editingId === group.id ? (
              <GroupForm
                key={group.id}
                initial={group}
                onSave={async (data) => {
                  await updateGroup(group.id, data);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <GroupCard
                key={group.id}
                group={group}
                onEdit={() => setEditingId(group.id)}
                onDelete={() => {
                  if (
                    confirm(
                      `Supprimer le groupe "${group.name}" ? Les contacts ne seront pas supprimés.`
                    )
                  ) {
                    deleteGroup(group.id);
                  }
                }}
              />
            )
          )
        )}
      </div>
    </div>
  );
}

function GroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: ContactGroup;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={styles.groupCard}>
      <div className={styles.groupCardTop}>
        <div className={styles.groupIcon}>
          <Users size={20} />
        </div>

        <div className={styles.groupActions}>
          <button type="button" onClick={onEdit} title="Modifier">
            <Pencil size={14} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Supprimer"
            className={styles.danger}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className={styles.groupCardBody}>
        <h3>{group.name}</h3>

        {group.description ? (
          <p>{group.description}</p>
        ) : (
          <p className={styles.muted}>Aucune description</p>
        )}
      </div>

      <div className={styles.groupCount}>
        <span>{group._count?.contacts ?? 0}</span>
        contact(s)
      </div>
    </div>
  );
}

function GroupForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ContactGroup;
  onSave: (data: GroupFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: initial?.name || "",
      description: initial?.description || "",
    },
  });

  return (
    <div className={styles.groupFormCard}>
      <form onSubmit={handleSubmit(onSave)}>
        <div className={styles.fieldGroup}>
          <label>Nom du groupe</label>

          <input
            type="text"
            {...register("name")}
            autoFocus
            placeholder="Ex: Newsletter"
          />

          {errors.name && <p className={styles.error}>{errors.name.message}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label>Description</label>

          <input
            type="text"
            {...register("description")}
            placeholder="Description optionnelle"
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelBtn}
          >
            <X size={16} />
            Annuler
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.saveBtn}
          >
            <Check size={16} />
            {isSubmitting ? "..." : initial ? "Mettre à jour" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}