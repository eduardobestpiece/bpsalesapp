import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EventRow { id: string; summary: string; start: string; end: string; calendarId?: string }

export const AgendaTemp = ({ companyId }: { companyId: string }) => {
	const [rows, setRows] = useState<EventRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		setLoading(true);
		setError(null);
		try {
			const { data: sess } = await supabase.auth.getSession();
			const providerToken = (sess?.session as any)?.provider_token || (typeof window !== 'undefined' ? localStorage.getItem('google_provider_token') : '');
			const authUserId = (await supabase.auth.getUser()).data.user?.id;
			const { data: settingsRow } = await supabase
				.from('scheduling_calendar_settings')
				.select('google_calendar_id, sync_enabled')
				.eq('company_id', companyId)
				.eq('owner_user_id', authUserId || '')
				.maybeSingle();
			if (!providerToken) throw new Error('Sem provider_token');
			const selectedCalendarId = settingsRow?.google_calendar_id || 'primary';
			const headers = { Authorization: `Bearer ${providerToken}` } as any;
			const calId = selectedCalendarId === 'primary' || !selectedCalendarId ? 'primary' : selectedCalendarId;
			const now = new Date();
			const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
			const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14).toISOString();
			const params = new URLSearchParams({
				timeMin: from,
				timeMax: to,
				singleEvents: 'true',
				orderBy: 'startTime',
				maxResults: '2500'
			});
			const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?${params.toString()}`, { headers });
			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
			const json = await resp.json();
			const list: EventRow[] = (json.items || []).map((it: any) => ({
				id: it.id,
				summary: it.summary || '(Sem título)',
				start: it.start?.dateTime || it.start?.date,
				end: it.end?.dateTime || it.end?.date,
				calendarId: calId,
			}));
			setRows(list);
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); }, [companyId]);

	return (
		<Card className="brand-radius">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-xl">Agenda Temporária (Google)</CardTitle>
					<Button variant="outline" className="brand-radius" onClick={load} disabled={loading}>Atualizar</Button>
				</div>
			</CardHeader>
			<CardContent>
				{error && <div className="text-sm text-red-500 mb-4">{error}</div>}
				{loading ? (
					<div>Carregando...</div>
				) : rows.length === 0 ? (
					<div className="text-sm text-muted-foreground">Nenhum evento encontrado no calendário selecionado.</div>
				) : (
					<div className="space-y-2">
						{rows.map(r => (
							<div key={r.id} className="border p-2 brand-radius text-sm">
								<div className="font-medium">{r.summary}</div>
								<div className="text-muted-foreground">{r.start} → {r.end}</div>
								<div className="text-muted-foreground">Calendário: {r.calendarId}</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}; 