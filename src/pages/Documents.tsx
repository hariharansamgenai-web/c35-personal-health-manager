import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Check, Copy, Download, ExternalLink, FileText, Filter,
  Link2, Pencil, Plus, Search, Share2, Trash2, X,
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
import { createShare, shareUrl } from '@/lib/sharing';
import { longDate } from '@/lib/health';
import type { DocumentCategory, MedicalDocument } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Dialog =
  | { kind: 'upload' }
  | { kind: 'edit'; doc: MedicalDocument }
  | { kind: 'delete'; doc: MedicalDocument }
  | { kind: 'preview'; doc: MedicalDocument; url: string }
  | { kind: 'share-single'; doc: MedicalDocument }
  | { kind: 'share-all' }
  | null;

const MIME_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/jpg': '🖼️',
  'image/png': '🖼️',
};

// ---------------------------------------------------------------------------
// Share form — reused for both single-doc and consolidated share
// ---------------------------------------------------------------------------
interface ShareFormProps {
  profileId: string;
  mode: 'single' | 'all';
  doc?: MedicalDocument;        // only for mode === 'single'
  onDone: () => void;
  onCancel: () => void;
}

function ShareForm({ profileId, mode, doc, onDone, onCancel }: ShareFormProps) {
  const [email, setEmail]   = useState('');
  const [label, setLabel]   = useState(
    mode === 'single' && doc
      ? `${doc.document_name ?? doc.file_name}`
      : 'All Health Vault documents'
  );
  const [expiry, setExpiry] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-input)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  };
  const labelCss: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setErr('Recipient email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr('Enter a valid email.'); return; }
    setSaving(true); setErr(null);
    try {
      const share = await createShare({
        profile_id:        profileId,
        shared_with_email: email,
        resource_type:     mode === 'single' ? 'documents' : 'documents',
        label:             label.trim() || null,
        expires_at:        expiry ? new Date(expiry).toISOString() : null,
        document_ids:      mode === 'single' && doc ? [doc.id] : undefined,
      });
      setShareLink(shareUrl(share.share_token));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create share link.');
    } finally { setSaving(false); }
  }

  async function copyLink() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  // ── After link created ──
  if (shareLink) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: 'var(--good-bg)', border: '1px solid rgba(16,185,129,.2)' }}>
          <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--good)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--good-text)' }}>
            Share link created — read-only access, revocable anytime from the Sharing page.
          </p>
        </div>

        <div>
          <label style={labelCss}>Share link</label>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'var(--bg-card-2,var(--bg-card))', border: '1px solid var(--border)' }}>
            <p className="flex-1 truncate font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {shareLink}
            </p>
            <button onClick={copyLink}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold shrink-0"
              style={{ background: copied ? 'var(--good-bg)' : 'var(--accent-bg)', color: copied ? 'var(--good-text)' : 'var(--accent)' }}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button onClick={onDone}>Done</Button>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* What's being shared */}
      <div className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
        <FileText className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {mode === 'single' && doc ? (
            <>
              <p className="font-semibold">{doc.document_name ?? doc.file_name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {CATEGORY_LABELS[doc.category]} · {formatFileSize(doc.file_size)}
                {doc.document_date && ` · ${longDate(doc.document_date)}`}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">All Health Vault documents (consolidated)</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Recipient can view all documents currently in your Health Vault.
              </p>
            </>
          )}
        </div>
      </div>

      <div>
        <label style={labelCss}>Recipient email *</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="doctor@clinic.com" style={inputStyle} autoFocus />
      </div>

      <div>
        <label style={labelCss}>Label <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
        <input type="text" value={label} onChange={e => setLabel(e.target.value)}
          placeholder="e.g. For Dr. Priya – HbA1c report" style={inputStyle} />
      </div>

      <div>
        <label style={labelCss}>Expires <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(blank = never)</span></label>
        <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
          min={new Date().toISOString().slice(0, 10)} style={inputStyle} />
      </div>

      {err && (
        <p className="flex items-center gap-2 text-sm rounded-lg px-3 py-2"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
          {err}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>
          <Link2 className="h-4 w-4" />Create share link
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Share dropdown — shown per document row
// ---------------------------------------------------------------------------
function ShareDropdown({
  doc, profileId, onClose,
}: { doc: MedicalDocument; profileId: string; onClose: () => void }) {
  const [mode, setMode] = useState<'single' | 'all' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  if (mode) {
    return (
      <div
        ref={ref}
        className="absolute right-0 top-full mt-1 z-50 w-80 rounded-xl p-4 shadow-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'single' ? 'Share this document' : 'Share all documents'}
          </p>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <ShareForm
          profileId={profileId}
          mode={mode}
          doc={doc}
          onDone={onClose}
          onCancel={() => setMode(null)}
        />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-50 w-60 overflow-hidden rounded-xl shadow-xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="border-b px-4 py-2 text-xs font-bold uppercase tracking-widest"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        Share options
      </p>
      <button onClick={() => setMode('single')}
        className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors"
        style={{ color: 'var(--text-primary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--nav-hover-bg)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <FileText className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
        <div>
          <p className="font-semibold">Share this document</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Send a link to this single file only
          </p>
        </div>
      </button>
      <button onClick={() => setMode('all')}
        className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--nav-hover-bg)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <Share2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#c084fc' }} />
        <div>
          <p className="font-semibold">Share all documents</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Consolidated access to entire Health Vault
          </p>
        </div>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function DocumentsPage() {
  const { activeProfile } = useActiveProfile();
  const { user } = useAuth();

  const [search, setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | ''>('');
  const [dialog, setDialog]         = useState<Dialog>(null);
  const [deleting, setDeleting]     = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openShareId, setOpenShareId] = useState<string | null>(null);

  const { documents, loading, error, reload } = useDocuments({
    profileId: activeProfile?.id,
    category: categoryFilter || undefined,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return documents;
    return documents.filter(d =>
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
    } finally { setActionLoading(null); }
  }, []);

  const handleDownload = useCallback(async (doc: MedicalDocument) => {
    setActionLoading(doc.id + '-dl');
    try {
      const url = await getSignedUrl(doc.file_path);
      const a = document.createElement('a');
      a.href = url; a.download = doc.file_name; a.rel = 'noopener noreferrer';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not download.');
    } finally { setActionLoading(null); }
  }, []);

  async function handleDelete(doc: MedicalDocument) {
    setDeleting(true); setDeleteError(null);
    try { await deleteDocument(doc); setDialog(null); await reload(); }
    catch (e) { setDeleteError(e instanceof Error ? e.message : 'Could not delete.'); }
    finally { setDeleting(false); }
  }

  if (!activeProfile || !user) return <Loading label="Loading" />;

  return (
    <div className="space-y-6" onClick={() => setOpenShareId(null)}>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)', letterSpacing: '-.02em' }}>
            Health Vault
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Files for {activeProfile.display_name}. Stored privately — no public access.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Share all from header */}
          <Button variant="outline" onClick={e => { e.stopPropagation(); setDialog({ kind: 'share-all' }); }}>
            <Share2 className="h-4 w-4" />
            Share all
          </Button>
          <Button onClick={() => setDialog({ kind: 'upload' })}>
            <Plus className="h-4 w-4" />
            Upload document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="search" placeholder="Search name, doctor, hospital, notes…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              height: 40, width: '100%', paddingLeft: 36, paddingRight: 12,
              borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontSize: 14, outline: 'none',
            }} />
        </div>
        <Select name="category-filter" value={categoryFilter} placeholder="All categories"
          options={PRIMARY_CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c] }))}
          onChange={e => setCategoryFilter(e.target.value as DocumentCategory | '')} />
      </div>

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && documents.length === 0 ? (
        <Loading label="Loading documents" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={documents.length === 0 ? 'No documents yet' : 'No matches'}
          description={documents.length === 0
            ? 'Upload your first lab report, prescription, or scan.'
            : 'Try a different search or category.'}
          action={documents.length === 0
            ? <Button onClick={() => setDialog({ kind: 'upload' })}><Plus className="h-4 w-4" />Upload document</Button>
            : undefined}
        />
      ) : (
        <Card noPadding>
          <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
            <CardHeader
              title="Health Vault"
              subtitle={`${filtered.length} of ${documents.length} document${documents.length !== 1 ? 's' : ''}`}
              action={<Filter className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
            />
          </div>
          <ul className="divide-y" style={{ '--divide-color': 'var(--border)' } as React.CSSProperties}>
            {filtered.map(doc => {
              const name = doc.document_name ?? doc.file_name;
              const icon = MIME_ICONS[doc.mime_type] ?? '📎';
              const isLoadingThis = actionLoading === doc.id || actionLoading === doc.id + '-dl';
              const shareOpen = openShareId === doc.id;

              return (
                <li key={doc.id}
                  className="flex items-start gap-3 px-5 py-4"
                  style={{ borderTop: '1px solid var(--border)' }}
                  onClick={e => e.stopPropagation()}>
                  <span className="mt-0.5 text-2xl" aria-hidden>{icon}</span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
                      <Badge variant="neutral">{CATEGORY_LABELS[doc.category]}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {doc.document_date && <span>{longDate(doc.document_date)}</span>}
                      {doc.doctor && <span>Dr. {doc.doctor}</span>}
                      {doc.hospital_clinic && <span>{doc.hospital_clinic}</span>}
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>Uploaded {longDate(doc.created_at.slice(0, 10))}</span>
                    </div>
                    {doc.notes && (
                      <p className="mt-1.5 text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{doc.notes}</p>
                    )}
                  </div>

                  {/* Action buttons */}
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

                    {/* Share button with dropdown */}
                    <div className="relative">
                      <IconBtn
                        label="Share"
                        disabled={isLoadingThis}
                        onClick={e => { (e as React.MouseEvent).stopPropagation(); setOpenShareId(shareOpen ? null : doc.id); }}
                        highlight={shareOpen}
                      >
                        <Share2 className="h-4 w-4" />
                      </IconBtn>
                      {shareOpen && (
                        <ShareDropdown
                          doc={doc}
                          profileId={activeProfile.id}
                          onClose={() => setOpenShareId(null)}
                        />
                      )}
                    </div>

                    <IconBtn label="Delete" danger disabled={isLoadingThis}
                      onClick={() => { setDeleteError(null); setDialog({ kind: 'delete', doc }); }}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* ── Modals ── */}

      {/* Upload */}
      <Modal open={dialog?.kind === 'upload'} onClose={() => setDialog(null)} title="Upload document" size="lg">
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <DocumentUploadForm userId={user.id} profileId={activeProfile.id}
            onUploaded={async () => { setDialog(null); await reload(); }}
            onCancel={() => setDialog(null)} />
        </div>
      </Modal>

      {/* Edit */}
      <Modal open={dialog?.kind === 'edit'} onClose={() => setDialog(null)} title="Edit document" size="lg">
        {dialog?.kind === 'edit' && (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <DocumentEditForm document={dialog.doc}
              onSaved={async () => { setDialog(null); await reload(); }}
              onCancel={() => setDialog(null)} />
          </div>
        )}
      </Modal>

      {/* Delete */}
      <Modal open={dialog?.kind === 'delete'} onClose={() => setDialog(null)}
        title="Delete this document?" size="sm"
        footer={dialog?.kind === 'delete' ? (
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>Keep it</Button>
            <Button variant="danger" loading={deleting}
              onClick={() => dialog?.kind === 'delete' && handleDelete(dialog.doc)}>
              Delete permanently
            </Button>
          </>
        ) : undefined}>
        {dialog?.kind === 'delete' && (
          <>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              "{dialog.doc.document_name ?? dialog.doc.file_name}" will be permanently removed.
              This cannot be undone.
            </p>
            {deleteError && <p className="mt-3 text-sm" style={{ color: 'var(--danger)' }}>{deleteError}</p>}
          </>
        )}
      </Modal>

      {/* Preview */}
      <Modal open={dialog?.kind === 'preview'} onClose={() => setDialog(null)}
        title={dialog?.kind === 'preview' ? (dialog.doc.document_name ?? dialog.doc.file_name) : ''} size="lg">
        {dialog?.kind === 'preview' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Preview link valid for 60 seconds.{' '}
              <button className="underline" style={{ color: 'var(--accent)' }}
                onClick={() => openPreview(dialog.doc)}>Refresh</button>
            </p>
            {dialog.doc.mime_type === 'application/pdf' ? (
              <iframe src={dialog.url} title={dialog.doc.document_name ?? dialog.doc.file_name}
                className="h-[60vh] w-full rounded-lg"
                style={{ border: '1px solid var(--border)' }} />
            ) : (
              <img src={dialog.url} alt={dialog.doc.document_name ?? dialog.doc.file_name}
                className="max-h-[60vh] w-full rounded-lg object-contain" />
            )}
          </div>
        )}
      </Modal>

      {/* Share — single document (from header action bar if triggered that way) */}
      <Modal open={dialog?.kind === 'share-single'} onClose={() => setDialog(null)}
        title="Share document" size="md">
        {dialog?.kind === 'share-single' && (
          <ShareForm profileId={activeProfile.id} mode="single" doc={dialog.doc}
            onDone={() => setDialog(null)} onCancel={() => setDialog(null)} />
        )}
      </Modal>

      {/* Share — consolidated (all documents) */}
      <Modal open={dialog?.kind === 'share-all'} onClose={() => setDialog(null)}
        title="Share all Health Vault documents" size="md">
        {dialog?.kind === 'share-all' && (
          <ShareForm profileId={activeProfile.id} mode="all"
            onDone={() => setDialog(null)} onCancel={() => setDialog(null)} />
        )}
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// IconBtn
// ---------------------------------------------------------------------------
function IconBtn({ label, onClick, danger, loading, disabled, highlight, children }: {
  label: string; onClick: (e: React.MouseEvent) => void; danger?: boolean;
  loading?: boolean; disabled?: boolean; highlight?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      disabled={loading || disabled}
      className="rounded-md p-1.5 transition-colors disabled:opacity-40"
      style={{
        color:      highlight ? 'var(--accent)' : danger ? 'var(--text-muted)' : 'var(--text-muted)',
        background: highlight ? 'var(--accent-bg)' : 'transparent',
      }}
      onMouseEnter={e => { if (!highlight) (e.currentTarget as HTMLElement).style.background = danger ? 'var(--danger-bg)' : 'var(--nav-hover-bg)'; }}
      onMouseLeave={e => { if (!highlight) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : children}
    </button>
  );
}
