"use client";

import { useRef } from "react";
import { AlertTriangle, CalendarClock, X } from "lucide-react";

type CalendarModalDay = {
  key: string;
  dateIso: string | null;
  dayNumber: number | null;
  publications: Array<{
    id: string;
    campaignName: string;
    title: string;
    channelLabel: string;
  }>;
};

type CampaignCalendarModalProps = {
  currentMonth: string;
  calendarDays: CalendarModalDay[];
  unscheduledCount: number;
};

export default function CampaignCalendarModal({
  currentMonth,
  calendarDays,
  unscheduledCount,
}: CampaignCalendarModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        className="crm-marketing-action crm-marketing-action-primary"
        onClick={openModal}
      >
        <CalendarClock size={16} />
        Voir calendrier
      </button>

      <dialog ref={dialogRef} className="crm-modal">
        <div className="crm-modal-card crm-modal-card-calendar">
          <div className="crm-modal-head">
            <div>
              <p>Calendrier éditorial</p>
              <h2>{currentMonth}</h2>
            </div>

            <button
              type="button"
              className="crm-modal-close"
              onClick={closeModal}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="crm-calendar-weekdays" aria-hidden="true">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="crm-calendar-grid crm-calendar-grid-modal">
            {calendarDays.map((day) => (
              <div
                key={day.key}
                className={
                  day.dateIso
                    ? "crm-calendar-day"
                    : "crm-calendar-day crm-calendar-day-empty"
                }
              >
                {day.dateIso ? (
                  <>
                    <time dateTime={day.dateIso}>{day.dayNumber}</time>

                    <div className="crm-calendar-events">
                      {day.publications.length === 0 ? (
                        <span className="crm-calendar-none">-</span>
                      ) : (
                        day.publications.slice(0, 3).map((publication) => (
                          <span
                            key={publication.id}
                            className="crm-calendar-event"
                            title={`${publication.campaignName} - ${publication.title}`}
                          >
                            <strong>{publication.channelLabel}</strong>
                            {publication.title}
                          </span>
                        ))
                      )}

                      {day.publications.length > 3 ? (
                        <span className="crm-calendar-more">
                          +{day.publications.length - 3}
                        </span>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>

          {unscheduledCount > 0 ? (
            <div className="crm-calendar-unscheduled">
              <AlertTriangle size={16} />
              <span>
                {unscheduledCount} publication(s) sans date de planification.
              </span>
            </div>
          ) : null}
        </div>
      </dialog>
    </>
  );
}