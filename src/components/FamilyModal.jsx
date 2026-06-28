import React, { useState, useEffect, lazy, Suspense } from 'react';
import QRCode from 'qrcode';
import { FamilyService } from '../services/FamilyService';

const BarcodeScanner = lazy(() => import('./BarcodeScanner').then(m => ({ default: m.BarcodeScanner })));

const Ic = ({ d, size = 18, stroke = 2, className = '', extra = null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    {extra || <path d={d} />}
  </svg>
);
const XIcon    = (p) => <Ic {...p} extra={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>}/>;
const UsersIc  = (p) => <Ic {...p} extra={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const PlusIc   = (p) => <Ic {...p} extra={<><path d="M12 5v14"/><path d="M5 12h14"/></>}/>;
const MailIc   = (p) => <Ic {...p} extra={<><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>}/>;
const TrashIc  = (p) => <Ic {...p} extra={<><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>;
const CheckIc  = (p) => <Ic {...p} d="M20 6 9 17l-5-5"/>;
const LogOutIc = (p) => <Ic {...p} extra={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>}/>;
const ShieldIc = (p) => <Ic {...p} extra={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>}/>;
const QrIc     = (p) => <Ic {...p} extra={<><rect width="5" height="5" x="3" y="3"/><rect width="5" height="5" x="16" y="3"/><rect width="5" height="5" x="3" y="16"/><path d="M16 16h.01M21 16h.01M16 21h.01M21 21h.01M18.5 18.5h.01"/></>}/>;
const CameraIc = (p) => <Ic {...p} extra={<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></>}/>;

const FIELD = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)] transition-all';
const BTN_PRIMARY = 'px-4 py-2 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_GHOST = 'px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';

export function FamilyModal({ user, onClose, onFamilyChange }) {
  const [family, setFamily] = useState(null);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('main'); // 'main' | 'create' | 'invite'
  const [familyName, setFamilyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrLink, setQrLink] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showJoinScanner, setShowJoinScanner] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    const [famResult, inviteResult] = await Promise.allSettled([
      FamilyService.getMyFamily(user.uid),
      FamilyService.getPendingInvites(user.email),
    ]);
    if (famResult.status === 'fulfilled') setFamily(famResult.value);
    if (inviteResult.status === 'fulfilled') setInvites(inviteResult.value);
    const famErr = famResult.status === 'rejected' ? famResult.reason?.message : null;
    const invErr = inviteResult.status === 'rejected' ? inviteResult.reason?.message : null;
    const famCode = famResult.status === 'rejected' ? (famResult.reason?.code || 'unknown') : null;
    const invCode = inviteResult.status === 'rejected' ? (inviteResult.reason?.code || 'unknown') : null;
    console.error('[FamilyModal] load errors:', { famErr, famCode, invErr, invCode });
    if (famErr) setError(`[Aile:${famCode}] ${famErr}`);
    else if (invErr) setError(`[Davet:${invCode}] ${invErr}`);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!familyName.trim()) return;
    setBusy(true); setError('');
    try {
      await FamilyService.createFamily(user.uid, user.email, user.displayName, familyName);
      await load();
      onFamilyChange?.();
      setView('main');
      setSuccess('Aile oluşturuldu!');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !family) return;
    setBusy(true); setError('');
    try {
      await FamilyService.inviteMember(family.id, family.name, user.uid, user.email, inviteEmail);
      setInviteEmail('');
      setView('main');
      setSuccess('Davet gönderildi!');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleQrInvite = async () => {
    if (!family) return;
    setBusy(true); setError(''); setSuccess(''); setQrLink(''); setQrDataUrl('');
    try {
      const { inviteId, secret } = await FamilyService.createQrInvite(family.id, family.name, user.uid);
      const link = `${window.location.origin}/#invite=${encodeURIComponent(inviteId)}&secret=${encodeURIComponent(secret)}`;
      setQrLink(link);
      setQrDataUrl(await QRCode.toDataURL(link, { margin: 1, width: 220 }));
      setSuccess('Tek kullanımlık QR daveti oluşturuldu.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const parseInviteLink = (raw) => {
    const text = String(raw || '').trim();
    const hash = text.includes('#') ? text.slice(text.indexOf('#')) : text;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    return { inviteId: params.get('invite'), secret: params.get('secret') };
  };

  const handleQrJoin = async (raw) => {
    setShowJoinScanner(false);
    setBusy(true); setError(''); setSuccess('');
    try {
      const { inviteId, secret } = parseInviteLink(raw);
      if (!inviteId || !secret) throw new Error('QR daveti okunamadı.');
      await FamilyService.acceptQrInvite(inviteId, secret, user.uid, user.email, user.displayName);
      await load();
      onFamilyChange?.();
      setSuccess('QR daveti kabul edildi.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleAccept = async (invite) => {
    setBusy(true); setError('');
    try {
      await FamilyService.acceptInvite(invite.id, user.uid, user.email, user.displayName);
      await load();
      onFamilyChange?.();
      setSuccess(`"${invite.familyName}" ailesine katıldınız!`);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleReject = async (invite) => {
    setBusy(true);
    try {
      await FamilyService.rejectInvite(invite.id);
      setInvites(prev => prev.filter(i => i.id !== invite.id));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleChangeRole = async (uid, currentRole) => {
    const newRole = currentRole === 'editor' ? 'member' : 'editor';
    setBusy(true); setError('');
    try {
      await FamilyService.changeRole(family.id, uid, newRole);
      await load();
      setSuccess(newRole === 'editor' ? 'Düzenleme yetkisi verildi.' : 'Yetki geri alındı.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleRemoveMember = async (uid) => {
    if (!family || uid === user.uid) return;
    setBusy(true); setError('');
    try {
      await FamilyService.removeMember(family.id, uid);
      await load();
      onFamilyChange?.();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleLeave = async () => {
    if (!family) return;
    setBusy(true); setError('');
    try {
      await FamilyService.leaveFamily(family.id, user.uid);
      setFamily(null);
      onFamilyChange?.();
      setSuccess('Aileden ayrıldınız.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const isAdmin = family?.members?.[user.uid]?.role === 'admin';
  const members = family ? Object.entries(family.members || {}) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"/>
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col animate-[slideUp_.25s_cubic-bezier(.22,.61,.36,1)]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)] grid place-items-center ring-1 ring-[var(--brand-100)]">
              <UsersIc size={16}/>
            </div>
            <div>
              <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                {view === 'create' ? 'Aile Oluştur' : view === 'invite' ? 'Üye Davet Et' : 'Aile Modu'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {family ? family.name : 'İlaçlarınızı aile üyeleriyle paylaşın'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <XIcon size={16}/>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {error && <div className="text-[12.5px] text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl px-3.5 py-2.5">{error}</div>}
          {success && <div className="text-[12.5px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-3.5 py-2.5">{success}</div>}

          {loading ? (
            <div className="text-center py-10 text-[13px] text-slate-400">Yükleniyor…</div>
          ) : view === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Aile Adı</label>
                <input value={familyName} onChange={e => setFamilyName(e.target.value)}
                  placeholder="Örn: Karamuk Ailesi" className={FIELD} autoFocus maxLength={60}/>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setView('main')} className={BTN_GHOST}>İptal</button>
                <button type="submit" disabled={busy || !familyName.trim()} className={BTN_PRIMARY}>
                  {busy ? 'Oluşturuluyor…' : 'Oluştur'}
                </button>
              </div>
            </form>

          ) : view === 'invite' ? (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">E-posta Adresi</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="ornek@email.com" className={FIELD} autoFocus/>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setView('main')} className={BTN_GHOST}>İptal</button>
                <button type="submit" disabled={busy || !inviteEmail.trim()} className={BTN_PRIMARY}>
                  {busy ? 'Gönderiliyor…' : 'Davet Gönder'}
                </button>
              </div>
            </form>

          ) : (
            <>
              {/* Bekleyen davetler */}
              {invites.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Bekleyen Davetler</div>
                  {invites.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <div>
                        <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{inv.familyName}</div>
                        <div className="text-[11.5px] text-slate-500">{inv.invitedBy} tarafından davet edildiniz</div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => handleReject(inv)} disabled={busy} className="px-2.5 py-1.5 rounded-lg text-[11.5px] text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Reddet</button>
                        <button onClick={() => handleAccept(inv)} disabled={busy} className="px-2.5 py-1.5 rounded-lg text-[11.5px] bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] transition-colors font-medium">Kabul Et</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Aile yok */}
              {!family && invites.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] grid place-items-center mx-auto mb-4">
                    <UsersIc size={28}/>
                  </div>
                  <div className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 mb-1">Henüz bir aileniz yok</div>
                  <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mb-5">Yeni bir aile oluşturun veya davet bekliyorsanız daveti kabul edin.</div>
                  <button onClick={() => { setView('create'); setError(''); setSuccess(''); }} className={BTN_PRIMARY}>
                    Aile Oluştur
                  </button>
                  <button onClick={() => setShowJoinScanner(true)} className={`${BTN_GHOST} ml-2 inline-flex items-center gap-1.5`}>
                    <CameraIc size={13}/> Aileye Katıl
                  </button>
                </div>
              )}

              {/* Aile var — üyeler */}
              {family && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Üyeler ({members.length})
                    </div>
                    {isAdmin && (
                      <button onClick={() => { setView('invite'); setError(''); setSuccess(''); }}
                        className="text-[12px] text-[var(--brand-600)] font-medium flex items-center gap-1 hover:underline">
                        <PlusIc size={13}/> Üye Davet Et
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowJoinScanner(true)} disabled={busy}
                      className={`${BTN_GHOST} inline-flex items-center gap-1.5`}>
                      <CameraIc size={13}/> Aileye Katıl
                    </button>
                    {isAdmin && (
                      <button onClick={handleQrInvite} disabled={busy}
                        className={`${BTN_GHOST} inline-flex items-center gap-1.5`}>
                        <QrIc size={13}/> Aileye Davet Et
                      </button>
                    )}
                  </div>

                  {qrDataUrl && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 text-center">
                      <img src={qrDataUrl} alt="Aile davet QR kodu" className="mx-auto w-[220px] h-[220px] rounded-lg bg-white p-2"/>
                      <div className="mt-2 text-[11.5px] text-slate-500 break-all">{qrLink}</div>
                    </div>
                  )}

                  {members.map(([uid, m]) => (
                    <div key={uid} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[var(--brand-100)] text-[var(--brand-700)] grid place-items-center shrink-0 text-[12px] font-bold">
                          {(m.displayName || m.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate">
                            {m.displayName || m.email}
                            {uid === user.uid && <span className="ml-1.5 text-[10px] text-[var(--brand-600)] font-semibold">(Siz)</span>}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{m.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full ${
                          m.role === 'admin'  ? 'bg-[var(--brand-50)] text-[var(--brand-700)]' :
                          m.role === 'editor' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400' :
                                                'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          {m.role === 'admin' ? 'Admin' : m.role === 'editor' ? 'Editör' : 'Üye'}
                        </span>
                        {isAdmin && uid !== user.uid && (
                          <>
                            <button
                              onClick={() => handleChangeRole(uid, m.role)}
                              disabled={busy}
                              title={m.role === 'editor' ? 'Düzenleme yetkisini geri al' : 'Düzenleme yetkisi ver'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                m.role === 'editor'
                                  ? 'text-violet-500 bg-violet-50 dark:bg-violet-950/20 hover:bg-violet-100'
                                  : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20'
                              }`}>
                              <ShieldIc size={13}/>
                            </button>
                            <button onClick={() => handleRemoveMember(uid)} disabled={busy}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
                              <TrashIc size={13}/>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Aileden ayrıl */}
                  {!isAdmin && (
                    <button onClick={handleLeave} disabled={busy}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 text-[13px] font-medium hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
                      <LogOutIc size={14}/> Aileden Ayrıl
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showJoinScanner && (
        <Suspense fallback={null}>
          <BarcodeScanner
            onResult={handleQrJoin}
            onClose={() => setShowJoinScanner(false)}
            mode="qr"
          />
        </Suspense>
      )}
    </div>
  );
}
