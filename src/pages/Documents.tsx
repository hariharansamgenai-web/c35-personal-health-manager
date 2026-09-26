import { useCallback, useMemo, useState } from 'react';
import {
  Download, ExternalLink, FileText, Filter, Pencil, Plus, Search, Trash2,
} from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Loading } from '@/components/feedback/Loading';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';
import { DocumentEditForm } from '@/components/documents/DocumentEditForm';
import { useDocuments } from '@/hooks/useDocuments';
import {
  CATEGORY_LABELS, deleteDocument, formatFileSize, getSignedUrl, PRIMARY_CATEGORIES,
} from '@/lib/documents';
import { longDate } from '@/lib/health';
import type { DocumentCategory, MedicalDocument } from '@/types';

type Dialog =
  | { kind: 'upload' }
  | { kind: 'edit'; doc: MedicalDocument }
  | { kind: 'delete'; doc: MedicalDocument }
  | { kind: 'preview'; doc: MedicalDocument; url: string }
  | null;

const MIME_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/jpg': '🖼️',
  'image/png': '🖼️',
};

export function DocumentsPage() {
  const { activeProfile } = useActiveProfile();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | ''>('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { documents, loading, error, reload } = useDocuments({
    profileId: activeProfile?.id,
    category: categoryFilter || undefined,
  });

  // Client-side search (fast, avoids a round-trip for short lists)
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (d) =>
        (d.document_name ?? d.file_name).toLowerCase().includes(q) ||
        d.doctor?.toLowerCase().includes(q) ||
        d.hospital_clinic?.toLowerCase().includes(q) ||
        d.notes?.toLowerCase().includes(q),
    );
  }, [documents, search]);

  const openPreview = useCallback(async (doc: MedicalDocument) => {
    setActionLoading(doc.id);
    try {
      const url = await getSignedUrl(doc.file_path);
      setDialog({ kind: 'preview', doc, url });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not open preview.');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleDownload = useCallback(async (doc: MedicalDocument) => {
    setActionLoading(doc.id + '-dl');
    try {
      const url = await getSignedUrl(doc.file_path);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not download.');
    } finally {
      setActionLoading(null);
    }
  }, []);

  async function handleDelete(doc: MedicalDocument) {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDocument(doc);
      setDialog(null);
      await reload();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete.');
    } finally {
      setDeleting(false);
    }
  }

  if (!activeProfile || !user) return <Loading label="Loading" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-.02em' }}>Health Vault</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Files for {activeProfile.display_name}. Stored privately — no public access.
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: 'upload' })}>
          <Plus className="h-4 w-4" />
          Upload document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Search name, doctor, hospital, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <Select
          name="category-filter"
          value={categoryFilter}
          placeholder="All categories"
          options={PRIMARY_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
          onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | '')}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && documents.length === 0 ? (
        <Loading label="Loading documents" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={documents.length === 0 ? 'No documents yet' : 'No matches'}
          description={documents.length === 0 ? 'Upload your first lab report, prescription, or scan.' : 'Try a different search or category.'}
          action={documents.length === 0 ? <Button onClick={() => setDialog({ kind: 'upload' })}><Plus className="h-4 w-4" />Upload document</Button> : undefined}
        />
      ) : (
        <Card noPadding>
          <div className="border-b border-neutral-200 px-5 py-4">
            <CardHeader
              title="Health Vault"
              subtitle={`${filtered.length} of ${documents.length}`}
              action={<Filter className="h-4 w-4 text-neutral-400" />}
            />
          </div>
          <ul className="divide-y divide-neutral-100">
            {filtered.map((doc) => {
              const name = doc.document_name ?? doc.file_name;
              const icon = MIME_ICONS[doc.mime_type] ?? '📎';
              const isLoadingThis = actionLoading === doc.id || actionLoading === doc.id + '-dl';
              return (
                <li key={doc.id} className="flex items-start gap-3 px-5 py-4">
                  <span className="mt-0.5 text-2xl" aria-hidden>{icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-neutral-900">{name}</p>
                      <Badge variant="neutral">{CATEGORY_LABELS[doc.category]}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-500">
                      {doc.document_date && <span>{longDate(doc.document_date)}</span>}
                      {doc.doctor && <span>Dr. {doc.doctor}</span>}
                      {doc.hospital_clinic && <span>{doc.hospital_clinic}</span>}
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>Uploaded {longDate(doc.created_at.slice(0, 10))}</span>
                    </div>
                    {doc.notes && (
                      <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2">{doc.notes}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    <IconBtn label="Preview" loading={actionLoading === doc.id} onClick={() => openPreview(doc)}>
                      <ExternalLink className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Download" loading={actionLoading === doc.id + '-dl'} onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Edit" disabled={isLoadingThis} onClick={() => setDialog({ kind: 'edit', doc })}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Delete" danger disabled={isLoadingThis} onClick={() => { setDeleteError(null); setDialog({ kind: 'delete', doc }); }}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Upload */}
      <Modal open={dialog?.kind === 'upload'} onClose={() => setDialog(null)} title="Upload document" size="lg">
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <DocumentUploadForm
            userId={user.id}
            profileId={activeProfile.id}
            onUploaded={async () => { setDialog(null); await reload(); }}
            onCancel={() => setDialog(null)}
          />
        </div>
      </Modal>

      {/* Edit */}
      <Modal open={dialog?.kind === 'edit'} onClose={() => setDialog(null)} title="Edit document" size="lg">
        {dialog?.kind === 'edit' && (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <DocumentEditForm
              document={dialog.doc}
              onSaved={async () => { setDialog(null); await reload(); }}
              onCancel={() => setDialog(null)}
            />
          </div>
        )}
      </Modal>

      {/* Delete */}
      <Modal
        open={dialog?.kind === 'delete'}
        onClose={() => setDialog(null)}
        title="Delete this document?"
        size="sm"
        footer={dialog?.kind === 'delete' ? (
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>Keep it</Button>
            <Button variant="danger" loading={deleting} onClick={() => dialog?.kind === 'delete' && handleDelete(dialog.doc)}>
              Delete permanently
            </Button>
          </>
        ) : undefined}
      >
        {dialog?.kind === 'delete' && (
          <>
            <p className="text-sm text-neutral-700">
              "{dialog.doc.document_name ?? dialog.doc.file_name}" will be permanently removed from storage. This cannot be undone.
            </p>
            {deleteError && <p className="mt-3 text-sm text-error-600">{deleteError}</p>}
          </>
        )}
      </Modal>

      {/* Preview */}
      <Modal
        open={dialog?.kind === 'preview'}
        onClose={() => setDialog(null)}
        title={dialog?.kind === 'preview' ? (dialog.doc.document_name ?? dialog.doc.file_name) : ''}
        size="lg"
      >
        {dialog?.kind === 'preview' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-neutral-500">
              Preview link is valid for 60 seconds.{' '}
              <button className="text-primary-700 underline" onClick={() => openPreview(dialog.doc)}>Refresh</button>
            </p>
            {dialog.doc.mime_type === 'application/pdf' ? (
              <iframe
                src={dialog.url}
                title={dialog.doc.document_name ?? dialog.doc.file_name}
                className="h-[60vh] w-full rounded-lg border border-neutral-200"
              />
            ) : (
              <img
                src={dialog.url}
                alt={dialog.doc.document_name ?? dialog.doc.file_name}
                className="max-h-[60vh] w-full rounded-lg object-contain"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function IconBtn({
  label, onClick, danger, loading, disabled, children,
}: {
  label: string; onClick: () => void; danger?: boolean; loading?: boolean; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={loading || disabled}
      className={
        danger
          ? 'rounded-md p-1.5 text-neutral-500 hover:bg-error-50 hover:text-error-600 disabled:opacity-40'
          : 'rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40'
      }
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : children}
    </button>
  );
}
