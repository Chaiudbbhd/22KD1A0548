import { useState } from 'react'
import {
  Card, CardContent, CardActions,
  TextField, Button, Grid, Typography, Alert, Stack, Divider, IconButton, Chip
} from '@mui/material'
import { Add, Delete, Link as LinkIcon } from '@mui/icons-material'
import { createShortUrl } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'

const urlRegex = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;
const emptyRow = () => ({ url: '', validity: '', shortcode: '', result: null, error: '' });
export default function Shortener() {
  const [rows, setRows] = useState([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const addRow = () => setRows(r => (r.length < 5 ? [...r, emptyRow()] : r));
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));
  const onChange = (i, key, val) => {
    setRows(r => {
      const copy = structuredClone(r);
      copy[i][key] = val;
      copy[i].error = '';
      return copy;
    });
  };
  const validateRow = ({ url, validity, shortcode }) => {
    if (!urlRegex.test(url)) return 'Enter a valid http/https URL';
    if (validity !== '' && (!Number.isInteger(Number(validity)) || Number(validity) <= 0))
      return 'Validity must be a positive integer (minutes)';
    if (shortcode && !/^[A-Za-z0-9]{4,20}$/.test(shortcode))
      return 'Shortcode: alphanumeric 4–20 chars';
    return '';
  };
  const submit = async () => {
    setSubmitting(true);
    const next = [...rows];
    for (let i = 0; i < next.length; i++) {
      const err = validateRow(next[i]);
      if (err) {
        next[i].error = err;
        setRows(next);
        setSubmitting(false);
        return;
      }
    }
    const promises = next.map((row) =>
      createShortUrl({
        url: row.url,
        validity: row.validity === '' ? undefined : Number(row.validity),
        shortcode: row.shortcode || undefined
      }).then(
        (res) => ({ ok: true, res }),
        (e) => ({ ok: false, err: e.message })
      )
    );
    const results = await Promise.all(promises);
    results.forEach((r, i) => {
      if (r.ok) {
        next[i].result = r.res;
        try {
          const code = r.res.shortLink.split('/').pop();
          const history = JSON.parse(localStorage.getItem('short_history') || '[]');
          if (!history.find(h => h.code === code)) {
            history.unshift({ code, createdAt: new Date().toISOString() });
            localStorage.setItem('short_history', JSON.stringify(history.slice(0, 100)));
          }
        } catch {}
      } else {
        next[i].error = r.err;
      }
    });
    setRows(next);
    setSubmitting(false);
  };
  const submitSingle = async (i) => {
    const row = rows[i];
    const err = validateRow(row);
    if (err) {
      setRows(r => {
        const copy = [...r];
        copy[i].error = err;
        return copy;
      });
      return;
    }
    try {
      const res = await createShortUrl({
        url: row.url,
        validity: row.validity === '' ? undefined : Number(row.validity),
        shortcode: row.shortcode || undefined
      });

      setRows(r => {
        const copy = [...r];
        copy[i].result = res;
        return copy;
      });

      try {
        const code = res.shortLink.split('/').pop();
        const history = JSON.parse(localStorage.getItem('short_history') || '[]');
        if (!history.find(h => h.code === code)) {
          history.unshift({ code, createdAt: new Date().toISOString() });
          localStorage.setItem('short_history', JSON.stringify(history.slice(0, 100)));
        }
      } catch {}
    } catch (e) {
      setRows(r => {
        const copy = [...r];
        copy[i].error = e.message;
        return copy;
      });
    }
  };
  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 600, textAlign: 'center', color: '#1976d2' }}>
        Shorten up to 5 URLs
      </Typography>
      <AnimatePresence>
        {rows.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth label="Long URL *" placeholder="https://example.com/very/long/link"
                      value={row.url} onChange={e => onChange(i, 'url', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth label="Validity (min)" type="number" inputProps={{ min: 1 }}
                      value={row.validity} onChange={e => onChange(i, 'validity', e.target.value)}
                      helperText="Default: 30"
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth label="Preferred Shortcode"
                      value={row.shortcode} onChange={e => onChange(i, 'shortcode', e.target.value)}
                      placeholder="e.g. myCode1"
                    />
                  </Grid>
                  <Grid item xs={12} md={1} display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => submitSingle(i)}
                      disabled={submitting}
                    >
                      Convert
                    </Button>
                    {rows.length > 1 && (
                      <IconButton color="error" onClick={() => removeRow(i)}>
                        <Delete />
                      </IconButton>
                    )}
                  </Grid>
                  {row.error && (
                    <Grid item xs={12}>
                      <Alert severity="error">{row.error}</Alert>
                    </Grid>
                  )}
                  {row.result && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          icon={<LinkIcon />}
                          label={row.result.shortLink}
                          color="success"
                          component="a"
                          href={row.result.shortLink}
                          target="_blank"
                          clickable
                        />
                        <Typography variant="body2" color="text.secondary">
                          Expires: {new Date(row.result.expiry).toLocaleString()}
                        </Typography>
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={addRow}
            disabled={rows.length >= 5}
          >
            Add another
          </Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={submitting}
          >
            Convert All
          </Button>
        </CardActions>
      </Card>
    </Stack>
  );
}
