import { useEffect, useState } from 'react'
import {
  Card, CardContent, Typography, Grid, Chip, Stack, Alert, Divider, CircularProgress
} from '@mui/material'
import { getStats } from '../lib/api'

function useHistoryCodes() {
  const [codes, setCodes] = useState([]);
  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem('short_history') || '[]');
      setCodes(h.map(x => x.code));
    } catch { setCodes([]); }
  }, []);
  return codes;
}
export default function Stats() {
  const codes = useHistoryCodes();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    async function load() {
      if (codes.length === 0) { setLoading(false); setItems([]); return; }
      const res = await Promise.all(
        codes.map(c => getStats(c).then(
          (r) => ({ ok: true, r }),
          (e) => ({ ok: false, err: e.message, code: c })
        ))
      );
      if (!cancel) {
        setItems(res);
        setLoading(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, [codes]);
  if (loading) return <Stack alignItems="center" mt={4}><CircularProgress /></Stack>;
  if (codes.length === 0)
    return <Alert severity="info">No history yet. Create some short links first.</Alert>;
  return (
    <Stack spacing={3}>
      <Typography variant="h5">Short URLs – Statistics</Typography>
      {items.map((it, i) => (
        <Card key={i} variant="outlined">
          <CardContent>
            {!it.ok ? (
              <Alert severity="error">/{it.code}: {it.err}</Alert>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  <a href={`${location.origin}/${it.r.shortcode}`} target="_blank" rel="noreferrer">
                    {location.origin}/{it.r.shortcode}
                  </a>
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                      <div><b>Original:</b> <span style={{ wordBreak:'break-all' }}>{it.r.originalUrl}</span></div>
                      <div><b>Created:</b> {new Date(it.r.createdAt).toLocaleString()}</div>
                      <div><b>Expires:</b> {new Date(it.r.expiry).toLocaleString()}</div>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body1"><b>Total Clicks:</b></Typography>
                      <Chip label={it.r.totalClicks} />
                    </Stack>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>Click Details</Typography>
                {it.r.clicks.length === 0 ? (
                  <Alert severity="info">No clicks yet.</Alert>
                ) : (
                  <Stack spacing={1}>
                    {it.r.clicks.map((c, idx) => (
                      <Card key={idx} variant="outlined">
                        <CardContent>
                          <Grid container>
                            <Grid item xs={12} md={4}><b>Time:</b> {new Date(c.at).toLocaleString()}</Grid>
                            <Grid item xs={12} md={4}><b>Source:</b> {c.referrer}</Grid>
                            <Grid item xs={12} md={4}><b>Coarse Location:</b> {c.location}</Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
