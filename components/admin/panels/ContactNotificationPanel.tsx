interface ContactNotificationPanelProps {
  form: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
}

function normalizeReceivers(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function ContactNotificationPanel({
  form,
  updateFormValue,
}: ContactNotificationPanelProps) {
  const additionalReceivers = normalizeReceivers(form?.notificationEmails);

  const setAdditionalReceivers = (next: string[]) => {
    updateFormValue(['form', 'notificationEmails'], next);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
        Contact Email Notifications
      </div>

      <div className="mb-4">
        <label className="block text-xs text-gray-500">Primary Receiver Email</label>
        <input
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="owner@example.com"
          value={form?.notificationEmail || ''}
          onChange={(event) =>
            updateFormValue(['form', 'notificationEmail'], event.target.value)
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500">Sender Name (optional)</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Dr Huang Clinic"
            value={form?.senderName || ''}
            onChange={(event) =>
              updateFormValue(['form', 'senderName'], event.target.value)
            }
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Sender Email (optional)</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="no-reply@yourdomain.com"
            value={form?.senderEmail || ''}
            onChange={(event) =>
              updateFormValue(['form', 'senderEmail'], event.target.value)
            }
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-gray-500">Additional Receiver Emails</label>
          <button
            type="button"
            onClick={() => setAdditionalReceivers([...additionalReceivers, ''])}
            className="rounded-md border border-gray-200 px-2.5 py-1 text-xs hover:bg-gray-50"
          >
            Add Receiver
          </button>
        </div>
        <div className="space-y-2">
          {additionalReceivers.map((receiver, index) => (
            <div key={index} className="flex gap-2">
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="team@example.com"
                value={receiver}
                onChange={(event) => {
                  const next = [...additionalReceivers];
                  next[index] = event.target.value;
                  setAdditionalReceivers(next);
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setAdditionalReceivers(
                    additionalReceivers.filter((_, currentIndex) => currentIndex !== index)
                  )
                }
                className="px-3 rounded-md border border-red-200 text-xs text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs text-gray-500">Notification Message</label>
          <textarea
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            rows={2}
            placeholder="Shown in the internal notification email."
            value={form?.notificationMessage || ''}
            onChange={(event) =>
              updateFormValue(['form', 'notificationMessage'], event.target.value)
            }
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Auto-Reply Message</label>
          <textarea
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            rows={3}
            placeholder="Message sent to customer. You can use {businessName}."
            value={form?.autoReplyMessage || ''}
            onChange={(event) =>
              updateFormValue(['form', 'autoReplyMessage'], event.target.value)
            }
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Receiver priority: this panel, then site email. Sender falls back to env when sender email is empty.
      </p>
    </div>
  );
}
